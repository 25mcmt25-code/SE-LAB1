import { Component } from '@angular/core';

import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  AuthService,
  FarmerBrowseQuery,
  PublicBuyerProfile,
  PublicFarmerProfile,
} from '../../auth/auth.service';

@Component({
    selector: 'app-search-page',
    imports: [ReactiveFormsModule, RouterLink],
    template: `
    <div class="container page-stack">
      <section class="card">
        <div class="header">
          <h2>{{ pageTitle }}</h2>
          <a routerLink="/home">Back</a>
        </div>

        <div class="friendly-hero directory-hero">
          <div class="friendly-picture" aria-hidden="true">
            <div class="visual-card-art search-art large-art"></div>
          </div>
          <div class="friendly-copy">
            <strong>{{ pageTitle }}</strong>
            <p class="directory-copy">{{ pageCopy }}</p>
            <div class="visual-steps compact">
              <div class="visual-step"><span class="visual-step-icon list"></span><span>Type name</span></div>
              <div class="visual-step"><span class="visual-step-icon field"></span><span>See crop details</span></div>
              <div class="visual-step"><span class="visual-step-icon deal"></span><span>Choose partner</span></div>
            </div>
          </div>
        </div>

        <form class="row" [formGroup]="form" (ngSubmit)="applyFilter()">
          <label>
            Search profiles
            <input formControlName="q" [placeholder]="searchPlaceholder" />
            <span class="input-hint">{{ searchHint }}</span>
          </label>
          @if (userRole === 'buyer') {
            <div class="split-fields">
              <label>
                Filter by crop
                <input formControlName="crop" placeholder="e.g. rice" />
              </label>
              <label>
                Filter by location
                <input formControlName="location" placeholder="e.g. Coimbatore" />
              </label>
            </div>
          }
          <button type="submit">Filter</button>
        </form>

        @if (error) {
          <div class="notice error-banner" style="margin-top: 12px">{{ error }}</div>
        }
      </section>

      <section class="card">
        <div class="section-header">
          <div>
            <p class="eyebrow">Directory</p>
            <h2>{{ resultTitle }}</h2>
          </div>
        </div>
    
        @if (loading) {
          <div>Loading profiles...</div>
        }
        @if (!loading && !filteredProfiles.length) {
          <div>No matching profiles found.</div>
        }
    
        @if (!loading && filteredProfiles.length) {
          <div class="grid profile-grid">
            @for (profile of filteredProfiles; track profile) {
              <article
                class="tile profile-tile profile-directory-card"
                [routerLink]="profilePreviewLink(profile)"
                style="cursor: pointer;"
              >
                <div class="directory-card-top">
                  <div class="directory-avatar" [class.has-photo]="hasProfilePhoto(profile) && !isPhotoFailed(profile.id)">
                    @if (hasProfilePhoto(profile) && !isPhotoFailed(profile.id)) {
                      <img
                        class="directory-avatar-image"
                        [src]="profile.profilePhoto || ''"
                        [alt]="profile.name + ' profile photo'"
                        loading="lazy"
                        (error)="markPhotoFailed(profile.id)"
                      />
                    } @else {
                      <span class="directory-avatar-fallback">{{ getProfileInitials(profile.name) }}</span>
                    }
                  </div>
                  <div class="directory-card-headline">
                    <div class="tile-title">{{ profile.name }}</div>
                    <div class="profile-meta">{{ profile.email }}</div>
                  </div>
                </div>
                @if (isFarmerProfile(profile)) {
                  <div class="profile-chip-row">
                    <span class="profile-chip">{{ profile.region }}</span>
                    @for (crop of profile.crops; track crop) {
                      <span class="profile-chip">{{ crop }}</span>
                    }
                  </div>
                  <div class="tile-desc">{{ profile.bio || 'No farm bio added yet.' }}</div>
                  @if (userRole === 'buyer') {
                    <div class="action-row" style="margin-top: 10px;">
                      <a class="button-link secondary" [routerLink]="['/farmers', profile.id]" (click)="$event.stopPropagation()">
                        View profile
                      </a>
                    </div>
                  }
                }
                @if (!isFarmerProfile(profile)) {
                  <div class="profile-chip-row">
                    <span class="profile-chip">Buyer</span>
                    @for (crop of profile.desiredCrops; track crop) {
                      <span class="profile-chip">{{ crop }}</span>
                    }
                  </div>
                  <div class="tile-desc">
                    {{ profile.desiredCrops.length ? 'Looking to contract for these crops.' : 'Available for new sourcing conversations and contract opportunities.' }}
                  </div>
                  @if (userRole === 'farmer') {
                    <div class="action-row" style="margin-top: 10px;">
                      <a class="button-link secondary" [routerLink]="['/buyers', profile.id]" (click)="$event.stopPropagation()">
                        View profile
                      </a>
                      <a class="button-link secondary" [routerLink]="['/my-contracts']" [queryParams]="{ buyerId: profile.id }" (click)="$event.stopPropagation()">
                        Initialize contract
                      </a>
                    </div>
                  }
                }
              </article>
            }
          </div>
        }
      </section>
    </div>
    `
})
export class SearchPage {
  loading = false;
  error = '';
  allProfiles: Array<PublicFarmerProfile | PublicBuyerProfile> = [];
  filteredProfiles: Array<PublicFarmerProfile | PublicBuyerProfile> = [];
  failedPhotoIds = new Set<string>();

  form = this.fb.group({
    q: [''],
    crop: [''],
    location: [''],
  });

  constructor(private fb: FormBuilder, private auth: AuthService) {
    this.loadProfiles();
  }

  get userRole() {
    return this.auth.getUser()?.role || 'buyer';
  }

  get pageTitle(): string {
    return this.userRole === 'buyer' ? 'Browse Farmer Profiles' : 'Browse Buyer Profiles';
  }

  get pageCopy(): string {
    return this.userRole === 'buyer'
      ? 'Review active farmer profiles by region, crops, and farm bio.'
      : 'Review buyer accounts available for sourcing and contract discussions.';
  }

  get searchPlaceholder(): string {
    return this.userRole === 'buyer'
      ? 'e.g. Coimbatore, rice, Arun'
      : 'e.g. Ravi, green harvest';
  }

  get searchHint(): string {
    return this.userRole === 'buyer'
      ? 'Search by farmer name, crop, or place.'
      : 'Search by buyer name or crop interest.';
  }

  get resultTitle(): string {
    return this.userRole === 'buyer' ? 'Available farmers' : 'Available buyers';
  }

  applyFilter() {
    const query = String(this.form.value.q || '')
      .trim()
      .toLowerCase();

    if (this.userRole === 'buyer') {
      const crop = String(this.form.value.crop || '').trim();
      const location = String(this.form.value.location || '').trim();
      if (crop || location) {
        this.loadProfiles({ crop, location }, query);
        return;
      }
    }

    this.filteredProfiles = this.filterProfiles(this.allProfiles, query);
  }

  isFarmerProfile(profile: PublicFarmerProfile | PublicBuyerProfile): profile is PublicFarmerProfile {
    return profile.role === 'farmer';
  }

  profilePreviewLink(profile: PublicFarmerProfile | PublicBuyerProfile): string[] {
    if (this.isFarmerProfile(profile)) {
      return ['/farmers', profile.id];
    }

    return ['/buyers', profile.id];
  }

  hasProfilePhoto(profile: PublicFarmerProfile | PublicBuyerProfile): boolean {
    return Boolean(profile.profilePhoto && profile.profilePhoto.trim());
  }

  isPhotoFailed(profileId: string): boolean {
    return this.failedPhotoIds.has(profileId);
  }

  markPhotoFailed(profileId: string) {
    this.failedPhotoIds.add(profileId);
  }

  getProfileInitials(name: string): string {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'U';
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'U';
  }

  private filterProfiles(
    source: Array<PublicFarmerProfile | PublicBuyerProfile>,
    textQuery: string
  ): Array<PublicFarmerProfile | PublicBuyerProfile> {
    if (!textQuery) {
      return [...source];
    }

    return source.filter((profile) => {
      const farmerTerms = this.isFarmerProfile(profile)
        ? [profile.region, profile.bio, ...(profile.crops || [])]
        : [...(profile.desiredCrops || [])];

      return [profile.name, profile.email, ...farmerTerms]
        .join(' ')
        .toLowerCase()
        .includes(textQuery);
    });
  }

  private loadProfiles(filter?: FarmerBrowseQuery, textQuery = '') {
    this.loading = true;
    this.error = '';
    this.failedPhotoIds.clear();

    if (this.userRole === 'buyer') {
      this.auth.browseFarmers(filter).subscribe({
        next: (data: { profiles: PublicFarmerProfile[] }) => {
          this.loading = false;
          this.allProfiles = data.profiles;
          this.filteredProfiles = this.filterProfiles(data.profiles, textQuery);
        },
        error: (err: { error?: { message?: string }; message?: string }) => {
          this.loading = false;
          this.error = err?.error?.message || err?.message || 'Failed to load profiles';
        }
      });
      return;
    }

    this.auth.browseBuyers().subscribe({
      next: (data: { profiles: PublicBuyerProfile[] }) => {
        this.loading = false;
        this.allProfiles = data.profiles;
        this.filteredProfiles = this.filterProfiles(data.profiles, textQuery);
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Failed to load profiles';
      }
    });
  }
}
