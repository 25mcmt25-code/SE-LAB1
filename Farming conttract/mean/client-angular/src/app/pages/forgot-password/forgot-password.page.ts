import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="card">
        <div class="header">
          <h2>Forgot Password</h2>
        </div>

        <form class="row" [formGroup]="form" (ngSubmit)="onSubmit()">
          <label>
            Email
            <input type="email" formControlName="email" />
          </label>

          <div class="error" *ngIf="error">{{ error }}</div>
          <div *ngIf="message">{{ message }}</div>

          <button type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Requesting...' : 'Request reset token' }}
          </button>
        </form>

        <div *ngIf="resetToken" style="margin-top: 12px">
          <div>Reset token (demo):</div>
          <pre style="white-space: pre-wrap">{{ resetToken }}</pre>
          <p>
            Go to <a routerLink="/reset-password">Reset Password</a>
          </p>
        </div>

        <p style="margin-top: 12px">
          <a routerLink="/login">Back to login</a>
        </p>
      </div>
    </div>
  `
})
export class ForgotPasswordPage {
  loading = false;
  error = '';
  message = '';
  resetToken = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.message = '';
    this.resetToken = '';

    const { email } = this.form.value;
    this.auth.forgotPassword({ email: email! }).subscribe({
      next: (data) => {
        this.loading = false;
        this.message = data.message || 'If the email exists, a reset link will be generated.';
        this.resetToken = data.resetToken || '';
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Request failed';
      }
    });
  }
}
