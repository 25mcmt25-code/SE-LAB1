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
          <a class="nav-pill" routerLink="/marketplace">
            <span class="nav-pill-icon market"></span>
            <span>Marketplace</span>
          </a>
          <a class="nav-pill" routerLink="/my-contracts">
            <span class="nav-pill-icon market"></span>
            <span>Contracts</span>
          </a>
          <a class="nav-pill" routerLink="/search">
            <span class="nav-pill-icon browse"></span>
            <span>{{ browseLabel }}</span>
          </a>
          <a class="nav-pill" [routerLink]="profileRoute">
            <span class="nav-pill-icon profile"></span>
            <span>My Profile</span>
          </a>
        </nav>

        <div class="spacer"></div>

        <div class="profile">
          <button class="profile-btn" type="button" (click)="toggleMenu()" aria-label="Profile menu">
            @if (showProfilePhoto) {
              <img
                class="profile-btn-photo"
                [src]="profilePhoto"
                alt="Your profile photo"
                (error)="onProfilePhotoError()"
              />
            } @else {
              <span class="profile-avatar-fallback">{{ profileInitials }}</span>
            }
          </button>
    
          @if (menuOpen) {
            <div class="menu">
              <a class="menu-item" routerLink="/home" (click)="closeMenu()">Home</a>
              <a class="menu-item" routerLink="/marketplace" (click)="closeMenu()">Marketplace</a>
              <a class="menu-item" routerLink="/my-contracts" (click)="closeMenu()">My Contracts</a>
              <a class="menu-item" routerLink="/search" (click)="closeMenu()">{{ browseLabel }}</a>
              <a class="menu-item" routerLink="/reports" (click)="closeMenu()">Reports</a>
              <a class="menu-item" routerLink="/support" (click)="closeMenu()">Support</a>
              <a class="menu-item" [routerLink]="profileRoute" (click)="closeMenu()">My Profile</a>
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
  photoLoadFailedFor = '';

  constructor(private auth: AuthService, private router: Router) {}

  get isFarmer(): boolean {
    return this.auth.getUser()?.role === 'farmer';
  }

  get browseLabel(): string {
    return this.isFarmer ? 'Browse Buyers' : 'Browse Farmers';
  }

  get profileRoute(): string {
    return this.isFarmer ? '/farmer-profile' : '/dashboard';
  }

  get profilePhoto(): string {
    return String(this.auth.getUser()?.profilePhoto || '').trim();
  }

  get profileInitials(): string {
    const name = String(this.auth.getUser()?.name || '').trim();
    if (!name) return 'U';
    const parts = name.split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'U';
  }

  get showProfilePhoto(): boolean {
    const photo = this.profilePhoto;
    return Boolean(photo) && this.photoLoadFailedFor !== photo;
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

  onProfilePhotoError() {
    this.photoLoadFailedFor = this.profilePhoto;
  }
}
