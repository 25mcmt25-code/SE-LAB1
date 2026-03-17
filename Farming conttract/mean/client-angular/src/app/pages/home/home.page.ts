import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService, AuthUser, FarmerProfile } from '../../auth/auth.service';

@Component({
    selector: 'app-home-page',
    imports: [CommonModule, RouterLink],
    template: `
    <div class="container page-stack">
      <section class="hero card">
        <div class="hero-copy">
          <p class="eyebrow">Application workspace</p>
          <h1>{{ greetingTitle }}</h1>
          <p class="hero-text">
            {{ heroText }}
          </p>
          <div class="visual-steps">
            <div class="visual-step">
              <span class="visual-step-icon field"></span>
              <span>Fill profile</span>
            </div>
            <div class="visual-step">
              <span class="visual-step-icon list"></span>
              <span>See buyers</span>
            </div>
            <div class="visual-step">
              <span class="visual-step-icon deal"></span>
              <span>Start contracts</span>
            </div>
          </div>
        </div>
        <div class="status-panel illustrated-panel">
          <div class="farm-picture" aria-hidden="true">
            <svg viewBox="0 0 220 170" class="farm-svg">
              <rect x="20" y="108" width="180" height="42" rx="10" class="soil-band"></rect>
              <path d="M18 112 C60 92, 100 92, 202 112" class="field-line"></path>
              <path d="M18 126 C70 108, 110 108, 202 126" class="field-line light"></path>
              <path d="M18 140 C78 124, 128 124, 202 140" class="field-line"></path>
              <circle cx="168" cy="42" r="18" class="sun-shape"></circle>
              <path d="M44 108 V78" class="crop-stem"></path>
              <path d="M44 88 C31 82, 30 72, 42 67" class="crop-leaf"></path>
              <path d="M44 95 C56 88, 58 78, 47 72" class="crop-leaf"></path>
              <path d="M88 108 V68" class="crop-stem"></path>
              <path d="M88 77 C74 69, 73 58, 86 52" class="crop-leaf"></path>
              <path d="M88 86 C102 76, 102 64, 91 58" class="crop-leaf"></path>
              <path d="M128 108 V84" class="crop-stem"></path>
              <path d="M128 92 C116 86, 116 76, 126 72" class="crop-leaf"></path>
              <path d="M128 97 C140 90, 141 80, 130 75" class="crop-leaf"></path>
              <rect x="144" y="82" width="42" height="28" rx="6" class="barn-body"></rect>
              <path d="M140 82 L165 62 L190 82" class="barn-roof"></path>
              <rect x="160" y="92" width="10" height="18" rx="3" class="barn-door"></rect>
            </svg>
          </div>
          <div class="status-line">
            <span class="status-label">Account</span>
            <strong>{{ user?.name }}</strong>
          </div>
          <div class="status-line">
            <span class="status-label">Role</span>
            <strong>{{ user?.role | titlecase }}</strong>
          </div>
          <div class="status-line">
            <span class="status-label">Email</span>
            <strong>{{ user?.email }}</strong>
          </div>
        </div>
      </section>
    
      @if (success) {
        <div class="notice success-banner">{{ success }}</div>
      }
      @if (error) {
        <div class="notice error-banner">{{ error }}</div>
      }
    
      <section class="card">
        <div class="section-header">
          <div>
            <p class="eyebrow">Quick actions</p>
            <h2>Tap a picture to continue</h2>
          </div>
        </div>

        <div class="visual-action-grid">
          @if (isFarmer) {
            <a class="visual-action-card" routerLink="/farmer-profile">
              <span class="visual-card-art profile-art"></span>
              <span class="visual-card-title">{{ hasProfile ? 'Update My Farm' : 'Create My Farm' }}</span>
              <span class="visual-card-copy">{{ profileHint }}</span>
            </a>
          }
          <a class="visual-action-card" routerLink="/search">
            <span class="visual-card-art search-art"></span>
            <span class="visual-card-title">{{ browseButtonLabel }}</span>
            <span class="visual-card-copy">{{ browseHint }}</span>
          </a>
          @if (isFarmer) {
            <a class="visual-action-card" routerLink="/farmer-profile">
              <span class="visual-card-art payment-art"></span>
              <span class="visual-card-title">Add Payment Details</span>
              <span class="visual-card-copy">{{ paymentHint }}</span>
            </a>
          }
          @if (!isFarmer) {
            <a class="visual-action-card" routerLink="/dashboard">
              <span class="visual-card-art payment-art"></span>
              <span class="visual-card-title">Open My Dashboard</span>
              <span class="visual-card-copy">See your buyer account and preferred crops in one place.</span>
            </a>
          }
        </div>

        <div class="grid summary-grid">
          <article class="metric-card">
            <span class="metric-label">Farmer profile</span>
            <strong>{{ profileStatus }}</strong>
            <p>{{ profileHint }}</p>
          </article>

          <article class="metric-card">
            <span class="metric-label">Payment details</span>
            <strong>{{ paymentStatus }}</strong>
            <p>{{ paymentHint }}</p>
          </article>

          <article class="metric-card">
            <span class="metric-label">{{ browseMetricLabel }}</span>
            <strong>Available</strong>
            <p>{{ browseHint }}</p>
          </article>
        </div>
      </section>
    
    </div>
    `
})
export class HomePage implements OnInit {
  success = '';
  error = '';
  user: AuthUser | null = null;
  profile: FarmerProfile | null = null;
  profileLoaded = false;

  constructor(private auth: AuthService, private router: Router, private route: ActivatedRoute) {
    const msg = this.route.snapshot.queryParamMap.get('msg');
    if (msg === 'login') this.success = 'Login successful';
    if (msg === 'register') this.success = 'Account created successfully';
  }

  ngOnInit() {
    this.user = this.auth.getUser();

    if (this.isFarmer) {
      this.auth.getMyFarmerProfile().subscribe({
        next: (data) => {
          this.profile = data.profile;
          this.profileLoaded = true;
        },
        error: (err) => {
          this.profileLoaded = true;
          this.error = err?.error?.message || err?.message || 'Failed to load farmer profile status';
        }
      });
    }
  }

  get isFarmer(): boolean {
    return this.user?.role === 'farmer';
  }

  get hasProfile(): boolean {
    return !!this.profile?.region;
  }

  get hasPaymentDetails(): boolean {
    return !!(
      this.profile?.upiId ||
      this.profile?.bank?.accountHolderName ||
      this.profile?.bank?.accountNumber ||
      this.profile?.bank?.ifsc ||
      this.profile?.bank?.bankName
    );
  }

  get greetingTitle(): string {
    if (!this.user) return 'Assured Contract Farming';
    return `Welcome back, ${this.user.name}`;
  }

  get heroText(): string {
    return this.isFarmer
      ? 'Use the big picture buttons below to open your profile, see buyers, and finish payment details without reading long menus.'
      : 'Use the big picture buttons below to open your dashboard, see farmers, and manage your saved payment details without reading long menus.';
  }

  get profileStatus(): string {
    if (!this.isFarmer) return 'Buyer account';
    if (!this.profileLoaded) return 'Checking';
    return this.hasProfile ? 'Configured' : 'Pending';
  }

  get profileHint(): string {
    if (!this.isFarmer) return 'Buyer accounts do not require a farmer production profile.';
    if (!this.profileLoaded) return 'Loading farmer profile details.';
    if (this.hasProfile) {
      return `Region: ${this.profile?.region}. Crops listed: ${(this.profile?.crops || []).length}.`;
    }
    return 'Create your region, crop list, and farm bio so buyers can review your details later.';
  }

  get paymentStatus(): string {
    if (!this.isFarmer) return 'Not required';
    if (!this.profileLoaded) return 'Checking';
    return this.hasPaymentDetails ? 'Added' : 'Pending';
  }

  get paymentHint(): string {
    if (!this.isFarmer) return 'Payment setup is only required for farmer accounts.';
    if (!this.profileLoaded) return 'Loading payment setup details.';
    return this.hasPaymentDetails
      ? 'UPI or bank information is available for secure buyer payments.'
      : 'Add UPI or bank account details so buyers can pay you securely.';
  }

  get browseMetricLabel(): string {
    return this.isFarmer ? 'Buyer directory' : 'Farmer directory';
  }

  get browseHint(): string {
    return this.isFarmer
      ? 'Browse buyer accounts to identify potential sourcing and contract partners.'
      : 'Browse farmer profiles with region, crop, and farm bio details.';
  }

  get browseButtonLabel(): string {
    return this.isFarmer ? 'Browse buyer profiles' : 'Browse farmer profiles';
  }

  logout() {
    this.auth.clearSession();
    this.router.navigateByUrl('/login');
  }
}
