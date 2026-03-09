import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="card">
        <div class="header">
          <h2>Search</h2>
          <a routerLink="/home">Back</a>
        </div>

        <form class="row" [formGroup]="form" (ngSubmit)="onSearch()">
          <label>
            Search term
            <input formControlName="q" placeholder="e.g. rice, wheat, contract id" />
          </label>
          <button type="submit">Search</button>
        </form>

        <div style="margin-top: 12px">{{ result }}</div>
      </div>
    </div>
  `
})
export class SearchPage {
  result = 'Enter a query and click Search.';

  form = this.fb.group({
    q: ['']
  });

  constructor(private fb: FormBuilder) {}

  onSearch() {
    const q = (this.form.value.q || '').trim();
    this.result = q ? `Search placeholder: "${q}"` : 'Please enter a query.';
  }
}
