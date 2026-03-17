import { Component } from '@angular/core';

import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService, PublicBuyerProfile, PublicFarmerProfile } from '../../auth/auth.service';

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
              <article class="tile profile-tile profile-directory-card">
                <div class="directory-card-top">
                  <div class="visual-card-art directory-person-art" [class.profile-art]="isFarmerProfile(profile)" [class.search-art]="!isFarmerProfile(profile)"></div>
                  <div>
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

  form = this.fb.group({
    q: ['']
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

    if (!query) {
      this.filteredProfiles = [...this.allProfiles];
      return;
    }

    this.filteredProfiles = this.allProfiles.filter((profile) => {
      const farmerTerms = this.isFarmerProfile(profile)
        ? [profile.region, profile.bio, ...(profile.crops || [])]
        : [...(profile.desiredCrops || [])];

      return [profile.name, profile.email, ...farmerTerms]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }

  isFarmerProfile(profile: PublicFarmerProfile | PublicBuyerProfile): profile is PublicFarmerProfile {
    return profile.role === 'farmer';
  }

  private loadProfiles() {
    this.loading = true;
    this.error = '';

    if (this.userRole === 'buyer') {
      this.auth.browseFarmers().subscribe({
        next: (data: { profiles: PublicFarmerProfile[] }) => {
          this.loading = false;
          this.allProfiles = data.profiles;
          this.filteredProfiles = [...data.profiles];
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
        this.filteredProfiles = [...data.profiles];
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Failed to load profiles';
      }
    });
  }
}
