import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService, FarmerProfile } from '../../auth/auth.service';

@Component({
  selector: 'app-farmer-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="card">
        <div class="header">
          <h2>Farmer Profile</h2>
          <a routerLink="/home">Back</a>
        </div>

        <div *ngIf="message" style="margin-bottom: 12px">{{ message }}</div>
        <div class="error" *ngIf="error" style="margin-bottom: 12px">{{ error }}</div>

        <form class="row" [formGroup]="form" (ngSubmit)="onSave()">
          <label>
            Region
            <input formControlName="region" placeholder="e.g. Tamil Nadu, Coimbatore" />
          </label>

          <label>
            Crops (comma separated)
            <input formControlName="crops" placeholder="e.g. rice, wheat, sugarcane" />
          </label>

          <label>
            Short bio (optional)
            <input formControlName="bio" placeholder="About your farm..." />
          </label>

          <label>
            UPI ID (optional)
            <input formControlName="upiId" placeholder="e.g. name@upi" />
          </label>

          <div class="row">
            <div style="font-weight: 600">Bank details (optional)</div>
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
      </div>
    </div>
  `
})
export class FarmerProfilePage implements OnInit {
  saving = false;
  error = '';
  message = '';

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

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  ngOnInit() {
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
