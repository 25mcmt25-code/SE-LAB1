import { Component } from '@angular/core';

import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { AuthService } from '../auth/auth.service';

@Component({
    selector: 'app-auth-shell',
    imports: [RouterOutlet, RouterLink],
    template: `
    <div class="topbar">
      <div class="topbar-inner">
        <a class="brand" routerLink="/home">Assured Contract Farming</a>

        <nav class="quick-nav" aria-label="Main navigation">
          <a class="nav-pill" routerLink="/home">
            <span class="nav-pill-icon home"></span>
            <span>Home</span>
          </a>
          <a class="nav-pill" routerLink="/search">
            <span class="nav-pill-icon browse"></span>
            <span>{{ browseLabel }}</span>
          </a>
          @if (isFarmer) {
            <a class="nav-pill" routerLink="/farmer-profile">
              <span class="nav-pill-icon profile"></span>
              <span>My Profile</span>
            </a>
          }
        </nav>

        <div class="spacer"></div>

        <div class="profile">
          <button class="profile-btn" type="button" (click)="toggleMenu()" aria-label="Profile menu">
            <span class="profile-dot"></span>
          </button>
    
          @if (menuOpen) {
            <div class="menu">
              <a class="menu-item" routerLink="/home" (click)="closeMenu()">Home</a>
              <a class="menu-item" routerLink="/search" (click)="closeMenu()">{{ browseLabel }}</a>
              <a class="menu-item" routerLink="/reports" (click)="closeMenu()">Reports</a>
              <a class="menu-item" routerLink="/support" (click)="closeMenu()">Support</a>
              @if (isFarmer) {
                <a class="menu-item" routerLink="/farmer-profile" (click)="closeMenu()">My Profile</a>
              }
              <button class="menu-item danger" type="button" (click)="logout()">Logout</button>
            </div>
          }
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

  get browseLabel(): string {
    return this.isFarmer ? 'Browse Buyers' : 'Browse Farmers';
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
