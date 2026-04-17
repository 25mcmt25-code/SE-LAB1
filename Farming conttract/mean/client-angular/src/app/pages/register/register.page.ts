import { Component } from '@angular/core';

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

          <div class="notice success-banner">
            Create your account first. We will ask for profile photo, crop details, and payment setup inside My Profile.
          </div>
    
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
    role: ['farmer' as UserRole, [Validators.required]]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  setRole(role: UserRole) {
    this.form.patchValue({ role });
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
      role: role!
    }).subscribe({
      next: () => {
        this.loading = false;
        const profileRoute = role === 'farmer' ? '/farmer-profile' : '/dashboard';
        this.router.navigate([profileRoute], { queryParams: { setup: 'pending', msg: 'register' } });
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Registration failed';
      }
    });
  }
}
