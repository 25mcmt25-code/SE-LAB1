import { Component } from '@angular/core';

import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-my-contracts-page',
    imports: [RouterLink],
    template: `
    <div class="container">
      <div class="card">
        <div class="header">
          <h2>My Contracts</h2>
          <a routerLink="/home">Back</a>
        </div>
        <div>This page is a placeholder for the My Contracts use case.</div>
      </div>
    </div>
  `
})
export class MyContractsPage {}
