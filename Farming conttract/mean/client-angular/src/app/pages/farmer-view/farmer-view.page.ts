import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService, PublicFarmerProfileDetail } from '../../auth/auth.service';

@Component({
    selector: 'app-farmer-view-page',
    imports: [RouterLink],
    template: `
    <div class="container page-stack">
      <section class="card">
        <div class="header">
          <h2>Farmer Profile</h2>
          <a routerLink="/search">Back</a>
        </div>

        @if (error) {
          <div class="notice error-banner">{{ error }}</div>
        }
        @if (loading) {
          <div>Loading farmer profile...</div>
        }

        @if (!loading && profile) {
          <div class="directory-card-top" style="margin-bottom: 14px;">
            <div class="directory-avatar" [class.has-photo]="showProfilePhoto">
              @if (showProfilePhoto) {
                <img
                  class="directory-avatar-image"
                  [src]="profile.profilePhoto || ''"
                  [alt]="profile.name + ' profile photo'"
                  (error)="photoFailed = true"
                />
              } @else {
                <span class="directory-avatar-fallback">{{ profileInitials }}</span>
              }
            </div>
            <div class="directory-card-headline">
              <div class="tile-title">{{ profile.name }}</div>
              <div class="profile-meta">{{ profile.email }}</div>
              <div class="profile-meta">{{ profile.region }}</div>
            </div>
          </div>

          <div class="profile-chip-row" style="margin-bottom: 12px;">
            @for (crop of profile.crops; track crop) {
              <span class="profile-chip">{{ crop }}</span>
            }
          </div>

          <div class="tile-desc">{{ profile.bio || 'No farm bio added yet.' }}</div>

          @if (isBuyer) {
            <div class="action-row" style="margin-top: 14px;">
              <a class="button-link primary" [routerLink]="['/my-contracts']" [queryParams]="{ farmerId: profile.id }">
                Create contract request
              </a>
            </div>
          }
        }
      </section>
    </div>
  `
})
export class FarmerViewPage implements OnInit {
  loading = false;
  error = '';
  photoFailed = false;
  profile: PublicFarmerProfileDetail | null = null;

  constructor(private auth: AuthService, private route: ActivatedRoute) {}

  ngOnInit() {
    const farmerId = String(this.route.snapshot.paramMap.get('id') || '').trim();
    if (!farmerId) {
      this.error = 'Farmer id is missing';
      return;
    }

    this.loading = true;
    this.auth.fetchFarmerProfile(farmerId).subscribe({
      next: ({ profile }) => {
        this.loading = false;
        this.profile = profile;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Failed to load farmer profile';
      },
    });
  }

  get isBuyer(): boolean {
    return this.auth.getUser()?.role === 'buyer';
  }

  get showProfilePhoto(): boolean {
    return Boolean(this.profile?.profilePhoto) && !this.photoFailed;
  }

  get profileInitials(): string {
    const name = String(this.profile?.name || '').trim();
    if (!name) return 'F';
    const parts = name.split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'F';
  }
}

