import { Component } from '@angular/core';

import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-reports-page',
    imports: [RouterLink],
    template: `
    <div class="container">
      <div class="card">
        <div class="header">
          <h2>Reports</h2>
          <a routerLink="/home">Back</a>
        </div>

        <div class="row">
          <div>This page is a placeholder for reports.</div>
          <div>You can add summaries like:</div>
          <div>- Total contracts</div>
          <div>- Active listings</div>
          <div>- Farmer/buyer activity</div>
        </div>
      </div>
    </div>
  `
})
export class ReportsPage {}
