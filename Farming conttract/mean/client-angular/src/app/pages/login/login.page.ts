import { Component } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../auth/auth.service';

@Component({
    selector: 'app-login-page',
    imports: [ReactiveFormsModule, RouterLink],
    template: `
    <div class="container">
      <div class="card">
        <div class="header">
          <h2>Login</h2>
        </div>
    
        <form class="row" [formGroup]="form" (ngSubmit)="onSubmit()">
          <label>
            Email
            <input type="email" formControlName="email" />
          </label>
    
          <label>
            Password
            <input type="password" formControlName="password" />
          </label>
    
          @if (error) {
            <div class="error">{{ error }}</div>
          }
    
          <button type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Signing in...' : 'Login' }}
          </button>
        </form>
    
        <p>
          <a routerLink="/forgot-password">Forgot password?</a>
        </p>
        <p>
          New here? <a routerLink="/register">Create an account</a>
        </p>
      </div>
    </div>
    `
})
export class LoginPage {
  loading = false;
  error = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    const { email, password } = this.form.value;
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/home'], { queryParams: { msg: 'login' } });
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Login failed';
      }
    });
  }
}
