import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService, PublicBuyerProfileDetail } from '../../auth/auth.service';

@Component({
  selector: 'app-buyer-view-page',
  imports: [RouterLink],
  template: `
    <div class="container page-stack">
      <section class="card">
        <div class="header">
          <h2>Buyer Profile</h2>
          <a routerLink="/search">Back</a>
        </div>

        @if (error) {
          <div class="notice error-banner">{{ error }}</div>
        }
        @if (loading) {
          <div>Loading buyer profile...</div>
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
              <div class="profile-meta">Buyer account</div>
            </div>
          </div>

          <div class="profile-chip-row" style="margin-bottom: 12px;">
            <span class="profile-chip">Buyer</span>
            @if (profile.desiredCrops.length) {
              @for (crop of profile.desiredCrops; track crop) {
                <span class="profile-chip">{{ crop }}</span>
              }
            } @else {
              <span class="profile-chip">Open to all crops</span>
            }
          </div>

          <div class="tile-desc">
            {{ profile.desiredCrops.length
              ? 'Buyer is currently interested in the listed crops.'
              : 'Buyer has not listed specific crop preferences yet.' }}
          </div>

          @if (isFarmer) {
            <div class="action-row" style="margin-top: 14px;">
              <a class="button-link primary" [routerLink]="['/my-contracts']" [queryParams]="{ buyerId: profile.id }">
                Initialize contract
              </a>
            </div>
          }
        }
      </section>
    </div>
  `,
})
export class BuyerViewPage implements OnInit {
  loading = false;
  error = '';
  photoFailed = false;
  profile: PublicBuyerProfileDetail | null = null;

  constructor(private auth: AuthService, private route: ActivatedRoute) {}

  ngOnInit() {
    const buyerId = String(this.route.snapshot.paramMap.get('id') || '').trim();
    if (!buyerId) {
      this.error = 'Buyer id is missing';
      return;
    }

    this.loading = true;
    this.auth.fetchBuyerProfile(buyerId).subscribe({
      next: ({ profile }) => {
        this.loading = false;
        this.profile = profile;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Failed to load buyer profile';
      },
    });
  }

  get isFarmer(): boolean {
    return this.auth.getUser()?.role === 'farmer';
  }

  get showProfilePhoto(): boolean {
    return Boolean(this.profile?.profilePhoto) && !this.photoFailed;
  }

  get profileInitials(): string {
    const name = String(this.profile?.name || '').trim();
    if (!name) return 'B';
    const parts = name.split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'B';
  }
}

