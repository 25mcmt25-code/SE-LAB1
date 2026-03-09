import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService, UserRole } from '../../auth/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="card">
        <div class="header">
          <h2>Register</h2>
        </div>

        <form class="row" [formGroup]="form" (ngSubmit)="onSubmit()">
          <label>
            Full name
            <input formControlName="name" />
          </label>

          <label>
            Email
            <input type="email" formControlName="email" />
          </label>

          <label>
            Password (min 8 chars)
            <input type="password" formControlName="password" />
          </label>

          <label>
            Role
            <select formControlName="role">
              <option value="farmer">Farmer</option>
              <option value="buyer">Buyer</option>
            </select>
          </label>

          <div *ngIf="isFarmer" class="row">
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
          </div>

          <div class="error" *ngIf="error">{{ error }}</div>

          <button type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Creating...' : 'Create account' }}
          </button>
        </form>

        <p>
          Already have an account? <a routerLink="/login">Login</a>
        </p>
      </div>
    </div>
  `
})
export class RegisterPage {
  loading = false;
  error = '';

  get isFarmer(): boolean {
    return this.form.value.role === 'farmer';
  }

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['farmer' as UserRole, [Validators.required]],
    region: [''],
    crops: [''],
    bio: [''],
    upiId: [''],
    accountHolderName: [''],
    accountNumber: [''],
    ifsc: [''],
    bankName: ['']
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    const { name, email, password, role } = this.form.value;

    this.auth.register({ name: name!, email: email!, password: password!, role: role! }).subscribe({
      next: () => {
        if (role !== 'farmer') {
          this.loading = false;
          this.router.navigate(['/home'], { queryParams: { msg: 'register' } });
          return;
        }

        const region = String(this.form.value.region || '').trim();
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

        // Save farmer profile details right after registration (token already stored by AuthService)
        this.auth.saveMyFarmerProfile({ region, crops, bio, upiId, bank }).subscribe({
          next: () => {
            this.loading = false;
            this.router.navigate(['/home'], { queryParams: { msg: 'register' } });
          },
          error: () => {
            // Even if profile save fails, user account is created; still allow navigation.
            this.loading = false;
            this.router.navigate(['/home'], { queryParams: { msg: 'register' } });
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Registration failed';
      }
    });
  }
}
