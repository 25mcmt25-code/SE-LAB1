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
      </section>

      <section class="card">
        <div class="row">
          <div class="metric-card">
            <span class="metric-label">Account</span>
            <strong>{{ user?.name }}</strong>
            <p>{{ user?.email }}</p>
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
  success = '';
  error = '';
  saving = false;
  user: AuthUser | null = null;

  cardForm = this.fb.group({
    cardHolderName: ['', [Validators.required, Validators.minLength(2)]],
    cardNumber: ['', [Validators.required, Validators.pattern(/^\d{12,19}$/)]],
    expiryMonth: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])$/)]],
    expiryYear: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
  });

  constructor(private auth: AuthService, private fb: FormBuilder, private router: Router, private route: ActivatedRoute) {
    const msg = this.route.snapshot.queryParamMap.get('msg');
    if (msg === 'login') this.success = 'Login successful';
    if (msg === 'register') this.success = 'Account created successfully';
  }

  ngOnInit() {
    this.loadUser();
  }

  get isBuyer(): boolean {
    return this.user?.role === 'buyer';
  }

  get cardSummaryTitle(): string {
    if (!this.user?.savedCard) return 'No card saved';
    return `${this.user.savedCard.cardBrand} ending ${this.user.savedCard.last4}`;
  }

  get cardSummaryHint(): string {
    if (!this.user?.savedCard) return 'Add a buyer payment card for faster checkout later.';
    return `${this.user.savedCard.cardHolderName} | expires ${this.user.savedCard.expiryMonth}/${this.user.savedCard.expiryYear}`;
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

  private loadUser() {
    this.auth.me().subscribe({
      next: ({ user }) => {
        this.user = user;
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

  logout() {
    this.auth.clearSession();
    this.router.navigateByUrl('/login');
  }
}
