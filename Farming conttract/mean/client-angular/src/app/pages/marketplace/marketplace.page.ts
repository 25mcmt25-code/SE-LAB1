import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-marketplace-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="card">
        <div class="header">
          <h2>Marketplace</h2>
          <a routerLink="/home">Back</a>
        </div>
        <div>This page is a placeholder for the Marketplace use case.</div>
      </div>
    </div>
  `
})
export class MarketplacePage {}
