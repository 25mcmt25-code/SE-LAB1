import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <div class="topbar">
      <div class="topbar-inner">
        <a class="brand" routerLink="/home">Assured Contract Farming</a>

        <div class="spacer"></div>

        <div class="profile">
          <button class="profile-btn" type="button" (click)="toggleMenu()" aria-label="Profile menu">
            <span class="profile-dot"></span>
          </button>

          <div class="menu" *ngIf="menuOpen">
            <a class="menu-item" routerLink="/home" (click)="closeMenu()">Home</a>
            <a class="menu-item" routerLink="/reports" (click)="closeMenu()">Reports</a>
            <a class="menu-item" routerLink="/support" (click)="closeMenu()">Support</a>

            <a *ngIf="isFarmer" class="menu-item" routerLink="/farmer-profile" (click)="closeMenu()">My Profile</a>

            <button class="menu-item danger" type="button" (click)="logout()">Logout</button>
          </div>
        </div>
      </div>
    </div>

    <router-outlet />
  `
})
export class AuthShellComponent {
  menuOpen = false;

  constructor(private auth: AuthService, private router: Router) {}

  get isFarmer(): boolean {
    return this.auth.getUser()?.role === 'farmer';
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  logout() {
    this.closeMenu();
    this.auth.clearSession();
    this.router.navigateByUrl('/login');
  }
}
