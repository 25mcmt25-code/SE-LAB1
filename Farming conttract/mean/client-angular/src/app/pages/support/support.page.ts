import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-support-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="card">
        <div class="header">
          <h2>Support</h2>
          <a routerLink="/home">Back</a>
        </div>
        <div>This page is a placeholder for Support / Help / FAQ use cases.</div>
      </div>
    </div>
  `
})
export class SupportPage {}
