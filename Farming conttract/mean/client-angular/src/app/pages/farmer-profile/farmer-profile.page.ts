import { Component, OnInit } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService, FarmerProfile } from '../../auth/auth.service';

@Component({
    selector: 'app-farmer-profile-page',
    imports: [ReactiveFormsModule, RouterLink],
    template: `
    <div class="container page-stack">
      <section class="card">
        <div class="header">
          <h2>Farmer Profile</h2>
          <a routerLink="/home">Back</a>
        </div>

        <div class="friendly-hero">
          <div class="friendly-picture" aria-hidden="true">
            <svg viewBox="0 0 220 150" class="register-svg">
              <rect x="18" y="96" width="184" height="34" rx="10" class="soil-band"></rect>
              <path d="M34 96 V60" class="crop-stem"></path>
              <path d="M34 72 C22 64, 22 54, 33 49" class="crop-leaf"></path>
              <path d="M34 80 C47 72, 47 62, 36 57" class="crop-leaf"></path>
              <path d="M90 96 V54" class="crop-stem"></path>
              <path d="M90 66 C76 57, 76 47, 88 41" class="crop-leaf"></path>
              <path d="M90 76 C104 66, 104 55, 92 50" class="crop-leaf"></path>
              <path d="M148 96 V70" class="crop-stem"></path>
              <path d="M148 80 C138 73, 138 64, 147 60" class="crop-leaf"></path>
              <path d="M148 85 C159 78, 159 69, 149 64" class="crop-leaf"></path>
              <circle cx="174" cy="34" r="16" class="sun-shape"></circle>
            </svg>
          </div>
          <div class="friendly-copy">
            <strong>Complete your farm card</strong>
            <div class="visual-steps compact">
              <div class="visual-step"><span class="visual-step-icon field"></span><span>Add region</span></div>
              <div class="visual-step"><span class="visual-step-icon list"></span><span>Add crops</span></div>
              <div class="visual-step"><span class="visual-step-icon deal"></span><span>Save details</span></div>
            </div>
          </div>
        </div>

        @if (message) {
          <div class="notice success-banner">{{ message }}</div>
        }
        @if (error) {
          <div class="notice error-banner">{{ error }}</div>
        }
        @if (setupPending) {
          <div class="notice success-banner">
            Your account was created. Finish the farmer profile and payment details here to complete Sprint 2 setup.
          </div>
        }
      </section>

      <section class="card">
        <form class="row" [formGroup]="form" (ngSubmit)="onSave()">
          <label>
            Region
            <input formControlName="region" placeholder="e.g. Tamil Nadu, Coimbatore" />
            <span class="input-hint">Write the village, district, or state buyers know.</span>
          </label>

          <label>
            Crops (comma separated)
            <input formControlName="crops" placeholder="e.g. rice, wheat, sugarcane" />
            <span class="input-hint">Separate crop names with commas.</span>
          </label>

          <label>
            Short bio (optional)
            <textarea formControlName="bio" rows="4" placeholder="About your farm..."></textarea>
            <span class="input-hint">One or two lines are enough.</span>
          </label>

          <label>
            Profile photo (JPEG or PNG)
            <input type="file" accept="image/jpeg,image/png" (change)="onProfilePhotoFileSelected($event)" />
            <span class="input-hint">Upload JPG/PNG up to 2 MB so buyers can identify you quickly.</span>
          </label>
          @if (profilePhotoPreview && !photoPreviewFailed) {
            <div class="profile-photo-preview-wrap">
              <img
                class="profile-photo-preview"
                [src]="profilePhotoPreview"
                alt="Farmer profile photo preview"
                (error)="markPhotoPreviewFailed()"
              />
            </div>
            <button type="button" (click)="removeProfilePhoto()">Remove photo</button>
          }
          @if (profilePhotoPreview && photoPreviewFailed) {
            <div class="input-hint">Image preview is unavailable. Please upload a valid JPEG or PNG.</div>
          }

          <label>
            UPI ID (optional)
            <input formControlName="upiId" placeholder="e.g. name@upi" />
            <span class="input-hint">Add this if you want fast payment.</span>
          </label>

          <div class="row farm-form-panel">
            <div class="role-card-copy" style="font-weight: 700; color: #334155;">Bank details (optional)</div>
            <label>
              Account holder name
              <input formControlName="accountHolderName" placeholder="Account holder name" />
            </label>
            <label>
              Account number
              <input formControlName="accountNumber" placeholder="Account number" />
            </label>
            <label>
              IFSC
              <input formControlName="ifsc" placeholder="IFSC" />
            </label>
            <label>
              Bank name
              <input formControlName="bankName" placeholder="Bank name" />
            </label>
          </div>
    
          <button type="submit" [disabled]="form.invalid || saving">
            {{ saving ? 'Saving...' : 'Save profile' }}
          </button>
        </form>
      </section>
    </div>
    `
})
export class FarmerProfilePage implements OnInit {
  private readonly maxPhotoBytes = 2 * 1024 * 1024;
  private readonly profilePhotoPattern = /^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+$/;

  saving = false;
  error = '';
  message = '';
  setupPending = false;
  photoPreviewFailed = false;

  form = this.fb.group({
    region: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    crops: [''],
    bio: [''],
    profilePhoto: ['', [Validators.maxLength(3000000), Validators.pattern(/^$|^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+$/)]],
    upiId: [''],
    accountHolderName: [''],
    accountNumber: [''],
    ifsc: [''],
    bankName: ['']
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private route: ActivatedRoute) {}

  get profilePhotoPreview(): string {
    return String(this.form.value.profilePhoto || '').trim();
  }

  ngOnInit() {
    this.setupPending = this.route.snapshot.queryParamMap.get('setup') === 'pending';

    this.auth.getMyFarmerProfile().subscribe({
      next: (data) => {
        if (!data.profile) return;
        this.form.patchValue({
          region: data.profile.region,
          crops: (data.profile.crops || []).join(', '),
          bio: data.profile.bio || '',
          profilePhoto: this.normalizeProfilePhoto(data.profile.profilePhoto),
          upiId: data.profile.upiId || '',
          accountHolderName: data.profile.bank?.accountHolderName || '',
          accountNumber: data.profile.bank?.accountNumber || '',
          ifsc: data.profile.bank?.ifsc || '',
          bankName: data.profile.bank?.bankName || ''
        });
        this.photoPreviewFailed = false;
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Failed to load profile';
        this.error = msg === 'Only farmers can access farmer profiles' ? 'Only farmers can create a farmer profile.' : msg;
      }
    });
  }

  onSave() {
    if (this.form.invalid) return;
    this.saving = true;
    this.error = '';
    this.message = '';

    const region = (this.form.value.region || '').trim();
    const crops = String(this.form.value.crops || '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    const bio = String(this.form.value.bio || '').trim();
    const profilePhoto = String(this.form.value.profilePhoto || '').trim();
    const upiId = String(this.form.value.upiId || '').trim();

    const bank = {
      accountHolderName: String(this.form.value.accountHolderName || '').trim(),
      accountNumber: String(this.form.value.accountNumber || '').trim(),
      ifsc: String(this.form.value.ifsc || '').trim(),
      bankName: String(this.form.value.bankName || '').trim(),
    };

    const payload: FarmerProfile = { region, crops, bio, upiId, bank };

    this.auth.saveMyFarmerProfile(payload).subscribe({
      next: () => {
        this.auth.updateMyProfilePhoto({ profilePhoto }).subscribe({
          next: () => {
            this.saving = false;
            this.setupPending = false;
            this.photoPreviewFailed = false;
            this.message = 'Profile saved successfully';
          },
          error: (err) => {
            this.saving = false;
            this.error = err?.error?.message || err?.message || 'Profile details saved, but failed to save profile photo';
          }
        });
      },
      error: (err) => {
        this.saving = false;
        const msg = err?.error?.message || err?.message || 'Failed to save profile';
        this.error = msg === 'Only farmers can update farmer profiles' ? 'Only farmers can create a farmer profile.' : msg;
      }
    });
  }

  markPhotoPreviewFailed() {
    this.photoPreviewFailed = true;
  }

  onProfilePhotoFileSelected(event: Event) {
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
      this.form.patchValue({ profilePhoto: result });
      this.error = '';
      this.photoPreviewFailed = false;
    };
    reader.onerror = () => {
      this.error = 'Unable to read selected image file.';
    };
    reader.readAsDataURL(file);
  }

  removeProfilePhoto() {
    this.form.patchValue({ profilePhoto: '' });
    this.photoPreviewFailed = false;
    this.error = '';
  }

  private isSupportedPhotoFile(file: File): boolean {
    return file.type === 'image/jpeg' || file.type === 'image/png';
  }

  private normalizeProfilePhoto(profilePhoto: string | undefined): string {
    const value = String(profilePhoto || '').trim();
    return this.profilePhotoPattern.test(value) ? value : '';
  }
}
