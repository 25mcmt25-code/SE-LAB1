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
  saving = false;
  error = '';
  message = '';
  setupPending = false;

  form = this.fb.group({
    region: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    crops: [''],
    bio: [''],
    upiId: [''],
    accountHolderName: [''],
    accountNumber: [''],
    ifsc: [''],
    bankName: ['']
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.setupPending = this.route.snapshot.queryParamMap.get('setup') === 'pending';

    this.auth.getMyFarmerProfile().subscribe({
      next: (data) => {
        if (!data.profile) return;
        this.form.patchValue({
          region: data.profile.region,
          crops: (data.profile.crops || []).join(', '),
          bio: data.profile.bio || '',
          upiId: data.profile.upiId || '',
          accountHolderName: data.profile.bank?.accountHolderName || '',
          accountNumber: data.profile.bank?.accountNumber || '',
          ifsc: data.profile.bank?.ifsc || '',
          bankName: data.profile.bank?.bankName || ''
        });
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
        this.saving = false;
        this.setupPending = false;
        this.message = 'Profile saved successfully';
      },
      error: (err) => {
        this.saving = false;
        const msg = err?.error?.message || err?.message || 'Failed to save profile';
        this.error = msg === 'Only farmers can update farmer profiles' ? 'Only farmers can create a farmer profile.' : msg;
      }
    });
  }
}
