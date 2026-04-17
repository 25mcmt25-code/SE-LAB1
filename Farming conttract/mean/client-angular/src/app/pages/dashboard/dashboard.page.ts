import { Component, OnInit } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService, AuthUser } from '../../auth/auth.service';

@Component({
    selector: 'app-dashboard-page',
    imports: [ReactiveFormsModule, RouterLink],
    template: `
    <div class="container page-stack">
      <section class="card">
        <div class="header">
          <h2>Dashboard</h2>
          <a routerLink="/home">Back</a>
        </div>

        <div class="friendly-hero">
          <div class="friendly-picture" aria-hidden="true">
            <div class="visual-card-art payment-art large-art"></div>
          </div>
          <div class="friendly-copy">
            <strong>Buyer account and payment details</strong>
            <div class="visual-steps compact">
              <div class="visual-step"><span class="visual-step-icon list"></span><span>See account</span></div>
              <div class="visual-step"><span class="visual-step-icon deal"></span><span>Save card</span></div>
              <div class="visual-step"><span class="visual-step-icon field"></span><span>Buy faster</span></div>
            </div>
          </div>
        </div>

        @if (success) {
          <div class="notice success-banner">{{ success }}</div>
        }
        @if (error) {
          <div class="notice error-banner">{{ error }}</div>
        }
        @if (setupPending) {
          <div class="notice success-banner">
            Your account is created. Complete buyer profile, profile photo, crop preferences, and payment details in My Profile.
          </div>
        }
      </section>

      <section class="card">
        <div class="row">
          <div class="metric-card">
            <span class="metric-label">Account</span>
            <strong>{{ user?.name }}</strong>
            <p>{{ user?.email }}</p>
            @if (isBuyer && profilePhotoPreview && !photoPreviewFailed) {
              <div class="profile-photo-preview-wrap account-photo-wrap">
                <img
                  class="profile-photo-preview account-profile-photo"
                  [src]="profilePhotoPreview"
                  alt="Buyer profile photo"
                />
              </div>
            }
          </div>

          @if (isBuyer) {
            <div class="metric-card">
              <span class="metric-label">Saved card</span>
              <strong>{{ cardSummaryTitle }}</strong>
              <p>{{ cardSummaryHint }}</p>
            </div>
          }
        </div>
      </section>

      @if (isBuyer) {
        <section class="card">
          <form class="row" [formGroup]="profileForm" (ngSubmit)="saveBuyerProfile()">
            <div class="role-card-copy" style="font-weight: 700; color: #334155;">Update buyer profile</div>
            <label>
              Full name
              <input formControlName="name" placeholder="Your full name or business name" />
            </label>
            <label>
              Preferred contract crops (comma separated)
              <input formControlName="desiredCrops" placeholder="e.g. rice, maize, turmeric" />
              <span class="input-hint">These crops appear when farmers browse buyers.</span>
            </label>

            <button type="submit" [disabled]="profileForm.invalid || profileSaving">
              {{ profileSaving ? 'Saving...' : 'Update profile' }}
            </button>
          </form>
        </section>

        <section class="card">
          <form class="row" [formGroup]="photoForm" (ngSubmit)="saveProfilePhoto()">
            <div class="role-card-copy" style="font-weight: 700; color: #334155;">Profile photo</div>
            <label>
              Upload photo (JPEG or PNG)
              <input type="file" accept="image/jpeg,image/png" (change)="onPhotoFileSelected($event)" />
              <span class="input-hint">Upload JPG/PNG up to 2 MB. Remove photo if needed.</span>
            </label>
            @if (profilePhotoPreview && !photoPreviewFailed) {
              <div class="profile-photo-preview-wrap">
                <img
                  class="profile-photo-preview"
                  [src]="profilePhotoPreview"
                  alt="Buyer profile photo preview"
                  (error)="markPhotoPreviewFailed()"
                />
              </div>
              <button type="button" (click)="removeProfilePhoto()">Remove photo</button>
            }
            @if (profilePhotoPreview && photoPreviewFailed) {
              <div class="input-hint">Image preview is unavailable. Please upload a valid JPEG or PNG.</div>
            }

            <button type="submit" [disabled]="photoForm.invalid || photoSaving">
              {{ photoSaving ? 'Saving...' : 'Save photo' }}
            </button>
          </form>
        </section>

        <section class="card">
          <form class="row" [formGroup]="cardForm" (ngSubmit)="saveBuyerCard()">
            <div class="role-card-copy" style="font-weight: 700; color: #334155;">Save payment card</div>
            <label>
              Card holder name
              <input formControlName="cardHolderName" placeholder="Name on card" />
              <span class="input-hint">Use the same name shown on the bank card.</span>
            </label>
            <label>
              Card number
              <input formControlName="cardNumber" inputmode="numeric" placeholder="1234123412341234" />
              <span class="input-hint">Only the last 4 digits are kept after save.</span>
            </label>
            <div class="split-fields">
              <label>
                Expiry month
                <input formControlName="expiryMonth" inputmode="numeric" placeholder="MM" />
              </label>
              <label>
                Expiry year
                <input formControlName="expiryYear" inputmode="numeric" placeholder="YYYY" />
              </label>
            </div>

            <button type="submit" [disabled]="cardForm.invalid || saving">
              {{ saving ? 'Saving...' : 'Save card' }}
            </button>
          </form>
        </section>
      }
    </div>
    `
})
export class DashboardPage implements OnInit {
  private readonly maxPhotoBytes = 2 * 1024 * 1024;
  private readonly profilePhotoPattern = /^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+$/;

  success = '';
  error = '';
  setupPending = false;
  saving = false;
  profileSaving = false;
  photoSaving = false;
  photoPreviewFailed = false;
  user: AuthUser | null = null;

  profileForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    desiredCrops: [''],
  });

  cardForm = this.fb.group({
    cardHolderName: ['', [Validators.required, Validators.minLength(2)]],
    cardNumber: ['', [Validators.required, Validators.pattern(/^\d{12,19}$/)]],
    expiryMonth: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])$/)]],
    expiryYear: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
  });

  photoForm = this.fb.group({
    profilePhoto: ['', [Validators.maxLength(3000000), Validators.pattern(/^$|^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+$/)]],
  });

  constructor(private auth: AuthService, private fb: FormBuilder, private router: Router, private route: ActivatedRoute) {
    const msg = this.route.snapshot.queryParamMap.get('msg');
    this.setupPending = this.route.snapshot.queryParamMap.get('setup') === 'pending';
    if (msg === 'login') this.success = 'Login successful';
    if (msg === 'register') this.success = 'Account created successfully';
  }

  ngOnInit() {
    this.loadUser();
  }

  get isBuyer(): boolean {
    return this.user?.role === 'buyer';
  }

  get profilePhotoPreview(): string {
    return String(this.photoForm.value.profilePhoto || '').trim();
  }

  get cardSummaryTitle(): string {
    if (!this.user?.savedCard) return 'No card saved';
    return `${this.user.savedCard.cardBrand} ending ${this.user.savedCard.last4}`;
  }

  get cardSummaryHint(): string {
    if (!this.user?.savedCard) return 'Add a buyer payment card for faster checkout later.';
    return `${this.user.savedCard.cardHolderName} | expires ${this.user.savedCard.expiryMonth}/${this.user.savedCard.expiryYear}`;
  }

  saveBuyerProfile() {
    if (this.profileForm.invalid || !this.isBuyer) return;

    this.profileSaving = true;
    this.error = '';
    this.success = '';

    const name = String(this.profileForm.value.name || '').trim();
    const desiredCrops = String(this.profileForm.value.desiredCrops || '')
      .split(',')
      .map((crop) => crop.trim())
      .filter(Boolean);

    this.auth.updateBuyerProfile({ name, desiredCrops }).subscribe({
      next: ({ message, user }) => {
        this.profileSaving = false;
        this.setupPending = false;
        this.success = message;
        this.user = user;
        this.profileForm.patchValue({
          name: user.name,
          desiredCrops: (user.desiredCrops || []).join(', '),
        });
      },
      error: (err) => {
        this.profileSaving = false;
        this.error = err?.error?.message || err?.message || 'Failed to update buyer profile';
      }
    });
  }

  saveBuyerCard() {
    if (this.cardForm.invalid || !this.isBuyer) return;

    this.saving = true;
    this.error = '';
    this.success = '';

    this.auth.saveBuyerPaymentCard({
      cardHolderName: String(this.cardForm.value.cardHolderName || '').trim(),
      cardNumber: String(this.cardForm.value.cardNumber || '').replace(/\D/g, ''),
      expiryMonth: String(this.cardForm.value.expiryMonth || '').trim(),
      expiryYear: String(this.cardForm.value.expiryYear || '').trim(),
    }).subscribe({
      next: ({ message, user }) => {
        this.saving = false;
        this.setupPending = false;
        this.success = message;
        this.user = user;
        this.cardForm.patchValue({ cardNumber: '' });
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message || err?.message || 'Failed to save buyer card';
      }
    });
  }

  saveProfilePhoto() {
    if (!this.isBuyer || this.photoForm.invalid) return;

    this.photoSaving = true;
    this.error = '';
    this.success = '';

    this.auth.updateMyProfilePhoto({
      profilePhoto: String(this.photoForm.value.profilePhoto || '').trim(),
    }).subscribe({
      next: ({ message, user }) => {
        this.photoSaving = false;
        this.setupPending = false;
        this.success = message;
        this.user = user;
        this.photoForm.patchValue({ profilePhoto: user.profilePhoto || '' });
        this.photoPreviewFailed = false;
      },
      error: (err) => {
        this.photoSaving = false;
        this.error = err?.error?.message || err?.message || 'Failed to save profile photo';
      }
    });
  }

  markPhotoPreviewFailed() {
    this.photoPreviewFailed = true;
  }

  onPhotoFileSelected(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;

    if (!this.isSupportedPhotoFile(file)) {
      this.error = 'Profile photo must be JPEG or PNG format.';
      if (input) input.value = '';
      return;
    }

    if (file.size > this.maxPhotoBytes) {
      this.error = 'Profile photo must be 2 MB or smaller.';
      if (input) input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result.trim() : '';
      if (!this.profilePhotoPattern.test(result)) {
        this.error = 'Profile photo must be JPEG or PNG format.';
        return;
      }
      this.photoForm.patchValue({ profilePhoto: result });
      this.error = '';
      this.photoPreviewFailed = false;
    };
    reader.onerror = () => {
      this.error = 'Unable to read selected image file.';
    };
    reader.readAsDataURL(file);
  }

  removeProfilePhoto() {
    this.photoForm.patchValue({ profilePhoto: '' });
    this.photoPreviewFailed = false;
    this.error = '';
  }

  private loadUser() {
    this.auth.me().subscribe({
      next: ({ user }) => {
        this.user = user;
        this.profileForm.patchValue({
          name: user.name,
          desiredCrops: (user.desiredCrops || []).join(', '),
        });
        this.photoForm.patchValue({ profilePhoto: this.normalizeProfilePhoto(user.profilePhoto) });
        this.photoPreviewFailed = false;
        if (user.savedCard) {
          this.cardForm.patchValue({
            cardHolderName: user.savedCard.cardHolderName,
            expiryMonth: user.savedCard.expiryMonth,
            expiryYear: user.savedCard.expiryYear,
          });
        }
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Failed to load account details';
      }
    });
  }

  private isSupportedPhotoFile(file: File): boolean {
    return file.type === 'image/jpeg' || file.type === 'image/png';
  }

  private normalizeProfilePhoto(profilePhoto: string | undefined): string {
    const value = String(profilePhoto || '').trim();
    return this.profilePhotoPattern.test(value) ? value : '';
  }

  logout() {
    this.auth.clearSession();
    this.router.navigateByUrl('/login');
  }
}
