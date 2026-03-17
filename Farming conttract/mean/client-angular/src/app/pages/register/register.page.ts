import { Component, OnInit } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService, UserRole } from '../../auth/auth.service';

@Component({
    selector: 'app-register-page',
    imports: [ReactiveFormsModule, RouterLink],
    template: `
    <div class="container">
      <div class="card">
        <div class="header">
          <h2>Register</h2>
        </div>

        <div class="friendly-hero">
          <div class="friendly-picture" aria-hidden="true">
            <svg viewBox="0 0 220 150" class="register-svg">
              <rect x="18" y="92" width="184" height="36" rx="10" class="soil-band"></rect>
              <path d="M30 92 V66" class="crop-stem"></path>
              <path d="M30 76 C20 70, 19 62, 29 57" class="crop-leaf"></path>
              <path d="M30 81 C41 74, 42 66, 32 61" class="crop-leaf"></path>
              <path d="M72 92 V58" class="crop-stem"></path>
              <path d="M72 68 C60 60, 60 50, 71 44" class="crop-leaf"></path>
              <path d="M72 76 C84 68, 84 58, 74 52" class="crop-leaf"></path>
              <path d="M116 92 V72" class="crop-stem"></path>
              <path d="M116 80 C106 74, 106 66, 115 62" class="crop-leaf"></path>
              <path d="M116 84 C126 78, 126 70, 117 66" class="crop-leaf"></path>
              <rect x="144" y="52" width="42" height="38" rx="8" class="barn-body"></rect>
              <path d="M140 52 L165 30 L190 52" class="barn-roof"></path>
              <circle cx="170" cy="34" r="14" class="sun-shape"></circle>
            </svg>
          </div>
          <div class="friendly-copy">
            <strong>Create account in 3 easy steps</strong>
            <div class="visual-steps compact">
              <div class="visual-step"><span class="visual-step-icon list"></span><span>Choose role</span></div>
              <div class="visual-step"><span class="visual-step-icon field"></span><span>Fill details</span></div>
              <div class="visual-step"><span class="visual-step-icon deal"></span><span>Save</span></div>
            </div>
          </div>
        </div>
    
        <form class="row" [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="role-picker">
            <button type="button" class="role-card" [class.active]="isFarmer" (click)="setRole('farmer')">
              <span class="role-card-art profile-art"></span>
              <span class="role-card-title">Farmer</span>
              <span class="role-card-copy">Sell crops and receive payments.</span>
            </button>
            <button type="button" class="role-card" [class.active]="!isFarmer" (click)="setRole('buyer')">
              <span class="role-card-art search-art"></span>
              <span class="role-card-title">Buyer</span>
              <span class="role-card-copy">Find farmers and request crops.</span>
            </button>
          </div>

          <label>
            Full name
            <input formControlName="name" />
            <span class="input-hint">Use your real name or business name.</span>
          </label>
    
          <label>
            Email
            <input type="email" formControlName="email" />
            <span class="input-hint">This will be used to log in later.</span>
          </label>
    
          <label>
            Password (min 8 chars)
            <input type="password" formControlName="password" />
            <span class="input-hint">Keep this secret.</span>
          </label>
    
          <label>
            Role
            <select formControlName="role">
              <option value="farmer">Farmer</option>
              <option value="buyer">Buyer</option>
            </select>
          </label>
    
          @if (isFarmer) {
            <div class="row">
              <label>
                Region
                <input formControlName="region" placeholder="e.g. Tamil Nadu, Coimbatore" />
                <span class="input-hint">Tell buyers where your farm is.</span>
              </label>
              <label>
                Crops (comma separated)
                <input formControlName="crops" placeholder="e.g. rice, wheat, sugarcane" />
                <span class="input-hint">Write the crop names you grow.</span>
              </label>
              <label>
                Short bio (optional)
                <input formControlName="bio" placeholder="About your farm..." />
                <span class="input-hint">A short sentence is enough.</span>
              </label>
              <label>
                UPI ID (optional)
                <input formControlName="upiId" placeholder="e.g. name@upi" />
                <span class="input-hint">Add payment details if you have them.</span>
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
          }

          @if (!isFarmer) {
            <div class="row">
              <label>
                Preferred contract crops
                <input formControlName="desiredCrops" placeholder="e.g. rice, maize, turmeric" />
                <span class="input-hint">Write the crops you want to buy on contract.</span>
              </label>
              <div class="role-card-copy" style="font-weight: 700; color: #334155;">Save buyer payment card</div>
              <label>
                Card holder name
                <input formControlName="cardHolderName" placeholder="Name on card" />
              </label>
              <label>
                Card number
                <input formControlName="cardNumber" inputmode="numeric" placeholder="1234123412341234" />
                <span class="input-hint">Optional. Only the last 4 digits are saved.</span>
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
            </div>
          }
    
          @if (error) {
            <div class="error">{{ error }}</div>
          }
    
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
export class RegisterPage implements OnInit {
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
    desiredCrops: [''],
    cardHolderName: [''],
    cardNumber: [''],
    expiryMonth: [''],
    expiryYear: [''],
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

  ngOnInit() {
    this.applyRoleValidators(this.form.value.role as UserRole);
    this.form.controls.role.valueChanges.subscribe((role) => {
      this.applyRoleValidators((role || 'farmer') as UserRole);
    });
  }

  setRole(role: UserRole) {
    this.form.patchValue({ role });
  }

  private applyRoleValidators(role: UserRole) {
    if (role === 'farmer') {
      this.form.controls.region.setValidators([Validators.required, Validators.minLength(2)]);
      this.form.controls.crops.setValidators([Validators.required]);
      this.form.controls.desiredCrops.clearValidators();
      this.form.controls.cardHolderName.clearValidators();
      this.form.controls.cardNumber.clearValidators();
      this.form.controls.expiryMonth.clearValidators();
      this.form.controls.expiryYear.clearValidators();
      this.form.patchValue({ desiredCrops: '' });
    } else {
      this.form.controls.region.clearValidators();
      this.form.controls.crops.clearValidators();
      this.form.controls.desiredCrops.setValidators([Validators.required]);
      this.form.controls.cardHolderName.clearValidators();
      this.form.controls.cardNumber.clearValidators();
      this.form.controls.expiryMonth.clearValidators();
      this.form.controls.expiryYear.clearValidators();
      this.form.patchValue({
        region: '',
        crops: '',
        bio: '',
        upiId: '',
        accountHolderName: '',
        accountNumber: '',
        ifsc: '',
        bankName: ''
      });
    }

    this.form.controls.region.updateValueAndValidity();
    this.form.controls.crops.updateValueAndValidity();
    this.form.controls.desiredCrops.updateValueAndValidity();
    this.form.controls.cardHolderName.updateValueAndValidity();
    this.form.controls.cardNumber.updateValueAndValidity();
    this.form.controls.expiryMonth.updateValueAndValidity();
    this.form.controls.expiryYear.updateValueAndValidity();
  }

  private buildFarmerProfilePayload() {
    return {
      region: String(this.form.value.region || '').trim(),
      crops: String(this.form.value.crops || '')
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      bio: String(this.form.value.bio || '').trim(),
      upiId: String(this.form.value.upiId || '').trim(),
      bank: {
        accountHolderName: String(this.form.value.accountHolderName || '').trim(),
        accountNumber: String(this.form.value.accountNumber || '').trim(),
        ifsc: String(this.form.value.ifsc || '').trim(),
        bankName: String(this.form.value.bankName || '').trim(),
      }
    };
  }

  private buildBuyerDesiredCrops(): string[] {
    return String(this.form.value.desiredCrops || '')
      .split(',')
      .map((crop) => crop.trim())
      .filter(Boolean);
  }

  private buildBuyerCardPayload() {
    const cardHolderName = String(this.form.value.cardHolderName || '').trim();
    const cardNumber = String(this.form.value.cardNumber || '').replace(/\D/g, '');
    const expiryMonth = String(this.form.value.expiryMonth || '').trim();
    const expiryYear = String(this.form.value.expiryYear || '').trim();

    if (!cardHolderName || !cardNumber || !expiryMonth || !expiryYear) {
      return null;
    }

    return {
      cardHolderName,
      cardNumber,
      expiryMonth,
      expiryYear,
    };
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    const { name, email, password, role } = this.form.value;

    this.auth.register({
      name: name!,
      email: email!,
      password: password!,
      role: role!,
      desiredCrops: role === 'buyer' ? this.buildBuyerDesiredCrops() : [],
      savedCard: role === 'buyer' ? this.buildBuyerCardPayload() || undefined : undefined,
    }).subscribe({
      next: () => {
        if (role !== 'farmer') {
          this.loading = false;
          this.router.navigate(['/home'], { queryParams: { msg: 'register' } });
          return;
        }

        this.auth.saveMyFarmerProfile(this.buildFarmerProfilePayload()).subscribe({
          next: () => {
            this.loading = false;
            this.router.navigate(['/home'], { queryParams: { msg: 'register' } });
          },
          error: () => {
            this.loading = false;
            this.router.navigate(['/farmer-profile'], { queryParams: { setup: 'pending' } });
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
