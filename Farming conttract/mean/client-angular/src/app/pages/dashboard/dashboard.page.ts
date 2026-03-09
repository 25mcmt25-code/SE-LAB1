import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService, AuthUser } from '../../auth/auth.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <div class="card">
        <div class="header">
          <h2>Dashboard</h2>
          <button (click)="logout()">Logout</button>
        </div>

        <div *ngIf="success" style="margin-bottom: 12px">{{ success }}</div>
      </div>
    </div>
  `
})
export class DashboardPage {
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
