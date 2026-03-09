import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="card">
        <div class="header">
          <h2>Reset Password</h2>
        </div>

        <form class="row" [formGroup]="form" (ngSubmit)="onSubmit()">
          <label>
            Email
            <input type="email" formControlName="email" />
          </label>

          <label>
            Reset token
            <input formControlName="resetToken" />
          </label>

          <label>
            New password (min 8 chars)
            <input type="password" formControlName="newPassword" />
          </label>

          <div class="error" *ngIf="error">{{ error }}</div>
          <div *ngIf="message">{{ message }}</div>

          <button type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Resetting...' : 'Reset password' }}
          </button>
        </form>

        <p style="margin-top: 12px">
          <a routerLink="/login">Back to login</a>
        </p>
      </div>
    </div>
  `
})
export class ResetPasswordPage {
  loading = false;
  error = '';
  message = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    resetToken: ['', [Validators.required, Validators.minLength(10)]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.message = '';

    const { email, resetToken, newPassword } = this.form.value;

    this.auth.resetPassword({ email: email!, resetToken: resetToken!, newPassword: newPassword! }).subscribe({
      next: (resp) => {
        this.loading = false;
        this.message = resp.message || 'Password reset successful';
        this.router.navigateByUrl('/home');
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Reset failed';
      }
    });
  }
}
