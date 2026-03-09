import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="card">
        <div class="header">
          <h2>Home</h2>
          <button (click)="logout()">Logout</button>
        </div>

        <div *ngIf="success" style="margin-bottom: 12px">{{ success }}</div>

        <div class="grid">
          <a class="tile" routerLink="/search">
            <div class="tile-title">Search</div>
            <div class="tile-desc">Search crops, contracts, or listings</div>
          </a>

          <a class="tile" routerLink="/my-contracts">
            <div class="tile-title">My Contracts</div>
            <div class="tile-desc">View created and accepted contracts</div>
          </a>

          <a class="tile" routerLink="/marketplace">
            <div class="tile-title">Marketplace</div>
            <div class="tile-desc">Browse available produce and offers</div>
          </a>

          <a class="tile" routerLink="/support">
            <div class="tile-title">Support</div>
            <div class="tile-desc">Help and FAQs</div>
          </a>

          <a class="tile" routerLink="/reports">
            <div class="tile-title">Reports</div>
            <div class="tile-desc">View system summaries and analytics</div>
          </a>
        </div>
      </div>
    </div>
  `
})
export class HomePage {
  success = '';

  constructor(private auth: AuthService, private router: Router, private route: ActivatedRoute) {
    const msg = this.route.snapshot.queryParamMap.get('msg');
    if (msg === 'login') this.success = 'Login successful';
    if (msg === 'register') this.success = 'Account created successfully';
  }

  logout() {
    this.auth.clearSession();
    this.router.navigateByUrl('/login');
  }
}
