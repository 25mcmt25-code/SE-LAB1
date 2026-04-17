import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService, MarketplaceListing, ProductListingPayload } from '../../auth/auth.service';

@Component({
  selector: 'app-marketplace-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container page-stack">
      <section class="card">
        <div class="header">
          <h2>Marketplace</h2>
          <a routerLink="/home">Back</a>
        </div>

        <div class="friendly-hero marketplace-hero">
          <div class="friendly-picture" aria-hidden="true">
            <div class="visual-card-art market-art large-art"></div>
          </div>
          <div class="friendly-copy">
            <strong>{{ heading }}</strong>
            <p class="directory-copy">{{ headingCopy }}</p>
            <div class="visual-steps compact">
              <div class="visual-step"><span class="visual-step-icon field"></span><span>Add crop lot</span></div>
              <div class="visual-step"><span class="visual-step-icon list"></span><span>Review listings</span></div>
              <div class="visual-step"><span class="visual-step-icon deal"></span><span>Start deals</span></div>
            </div>
          </div>
        </div>

        @if (success) {
          <div class="notice success-banner">{{ success }}</div>
        }
        @if (error) {
          <div class="notice error-banner">{{ error }}</div>
        }
      </section>

      @if (isFarmer) {
        <section class="card">
          <form class="row" [formGroup]="listingForm" (ngSubmit)="submitProduct()">
            <div class="role-card-copy" style="font-weight: 700; color: #334155;">Add product listing</div>
            <div class="split-fields">
              <label>
                Crop name
                <input formControlName="cropName" placeholder="e.g. Paddy" />
              </label>
              <label>
                Variety (optional)
                <input formControlName="variety" placeholder="e.g. Ponni" />
              </label>
            </div>

            <div class="split-fields">
              <label>
                Quantity
                <input formControlName="quantity" type="number" inputmode="decimal" min="0.01" step="0.01" placeholder="50" />
              </label>
              <label>
                Unit
                <select formControlName="unit">
                  @for (unit of units; track unit) {
                    <option [value]="unit">{{ unit }}</option>
                  }
                </select>
              </label>
            </div>

            <div class="split-fields">
              <label>
                Price per unit (INR)
                <input formControlName="pricePerUnit" type="number" inputmode="decimal" min="0.01" step="0.01" placeholder="2400" />
              </label>
              <label>
                Location
                <input formControlName="location" placeholder="e.g. Coimbatore, Tamil Nadu" />
              </label>
            </div>

            <div class="split-fields">
              <label>
                Harvest date (optional)
                <input formControlName="harvestDate" type="date" />
              </label>
              <label>
                Available until (optional)
                <input formControlName="availableUntil" type="date" />
              </label>
            </div>

            <label>
              Description (optional)
              <textarea formControlName="description" rows="3" placeholder="Share quality details, moisture, packaging, and transport notes."></textarea>
            </label>

            <button type="submit" [disabled]="listingForm.invalid || submitting">
              {{ submitting ? 'Publishing...' : 'Publish Listing' }}
            </button>
          </form>
        </section>
      }

      <section class="card">
        <div class="section-header">
          <div>
            <p class="eyebrow">Active board</p>
            <h2>{{ listingTitle }}</h2>
          </div>
          <button type="button" (click)="loadListings()" [disabled]="loading">
            {{ loading ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>

        <form class="row" [formGroup]="filterForm" (ngSubmit)="applyFilter()">
          <label>
            Search listings
            <input formControlName="q" placeholder="Search by crop, location, or farmer name" />
            <span class="input-hint">Filter results without leaving this page.</span>
          </label>
          <button type="submit">Apply filter</button>
        </form>

        @if (loading) {
          <div style="margin-top: 14px;">Loading marketplace listings...</div>
        }

        @if (!loading && !filteredListings.length) {
          <div class="marketplace-empty-state">
            <strong>{{ emptyStateTitle }}</strong>
            <p>{{ emptyStateCopy }}</p>
          </div>
        }

        @if (!loading && filteredListings.length) {
          <div class="grid marketplace-grid">
            @for (listing of filteredListings; track listing.id) {
              <article class="tile marketplace-card">
                <div class="marketplace-card-top">
                  <div class="directory-avatar" [class.has-photo]="hasFarmerPhoto(listing) && !isPhotoFailed(listing.farmer.id)">
                    @if (hasFarmerPhoto(listing) && !isPhotoFailed(listing.farmer.id)) {
                      <img
                        class="directory-avatar-image"
                        [src]="listing.farmer.profilePhoto"
                        [alt]="listing.farmer.name + ' profile photo'"
                        loading="lazy"
                        (error)="markPhotoFailed(listing.farmer.id)"
                      />
                    } @else {
                      <span class="directory-avatar-fallback">{{ getFarmerInitials(listing.farmer.name) }}</span>
                    }
                  </div>
                  <div class="directory-card-headline">
                    <div class="tile-title">
                      {{ listing.cropName }}
                      @if (listing.variety) {
                        <span>({{ listing.variety }})</span>
                      }
                    </div>
                    <div class="profile-meta">{{ listing.farmer.name }} - {{ listing.location }}</div>
                  </div>
                </div>

                <div class="profile-chip-row">
                  <span class="profile-chip">{{ listing.quantity }} {{ listing.unit }}</span>
                  <span class="profile-chip">INR {{ listing.pricePerUnit }} / {{ listing.unit }}</span>
                </div>

                @if (listing.description) {
                  <div class="tile-desc">{{ listing.description }}</div>
                } @else {
                  <div class="tile-desc">No additional quality notes provided.</div>
                }

                <div class="marketplace-meta">
                  @if (listing.harvestDate) {
                    <span>Harvested: {{ listing.harvestDate | date: 'mediumDate' }}</span>
                  }
                  @if (listing.availableUntil) {
                    <span>Available until: {{ listing.availableUntil | date: 'mediumDate' }}</span>
                  }
                  @if (listing.createdAt) {
                    <span>Listed: {{ listing.createdAt | date: 'mediumDate' }}</span>
                  }
                </div>
              </article>
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class MarketplacePage {
  readonly units: ProductListingPayload['unit'][] = ['kg', 'quintal', 'tonne', 'bag'];

  loading = false;
  submitting = false;
  success = '';
  error = '';
  listings: MarketplaceListing[] = [];
  filteredListings: MarketplaceListing[] = [];
  failedPhotoIds = new Set<string>();

  filterForm = this.fb.group({
    q: [''],
  });

  listingForm = this.fb.group({
    cropName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    variety: ['', [Validators.maxLength(80)]],
    quantity: [1, [Validators.required, Validators.min(0.01), Validators.max(1000000)]],
    unit: ['kg' as ProductListingPayload['unit'], [Validators.required]],
    pricePerUnit: [1, [Validators.required, Validators.min(0.01), Validators.max(100000000)]],
    location: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    harvestDate: [''],
    availableUntil: [''],
    description: ['', [Validators.maxLength(500)]],
  });

  constructor(private fb: FormBuilder, private auth: AuthService) {
    this.loadListings();
  }

  get isFarmer(): boolean {
    return this.auth.getUser()?.role === 'farmer';
  }

  get heading(): string {
    return this.isFarmer ? 'List your produce for buyers' : 'Review active farmer listings';
  }

  get headingCopy(): string {
    return this.isFarmer
      ? 'Add crop quantity, pricing, and location to publish a listing in the live marketplace board.'
      : 'Explore currently active crop lots with location, quantity, and pricing details from farmers.';
  }

  get listingTitle(): string {
    return this.isFarmer ? 'All active marketplace listings' : 'Farmer listings available now';
  }

  get emptyStateTitle(): string {
    return this.filterQuery
      ? 'No listings matched your search'
      : 'No active listings yet';
  }

  get emptyStateCopy(): string {
    if (this.filterQuery) {
      return 'Try searching with a crop name, location, or farmer name.';
    }
    return this.isFarmer
      ? 'Publish your first listing above to make it visible in the marketplace.'
      : 'Farmers have not posted active product listings yet. Please check back soon.';
  }

  get filterQuery(): string {
    return String(this.filterForm.value.q || '').trim().toLowerCase();
  }

  submitProduct() {
    if (!this.isFarmer || this.listingForm.invalid) return;

    this.submitting = true;
    this.success = '';
    this.error = '';

    const payload: ProductListingPayload = {
      cropName: String(this.listingForm.value.cropName || '').trim(),
      variety: String(this.listingForm.value.variety || '').trim() || undefined,
      quantity: Number(this.listingForm.value.quantity || 0),
      unit: (this.listingForm.value.unit || 'kg') as ProductListingPayload['unit'],
      pricePerUnit: Number(this.listingForm.value.pricePerUnit || 0),
      location: String(this.listingForm.value.location || '').trim(),
      harvestDate: String(this.listingForm.value.harvestDate || '').trim() || undefined,
      availableUntil: String(this.listingForm.value.availableUntil || '').trim() || undefined,
      description: String(this.listingForm.value.description || '').trim() || undefined,
    };

    this.auth.submitProductListing(payload).subscribe({
      next: ({ message }) => {
        this.submitting = false;
        this.success = message;
        this.listingForm.patchValue({
          cropName: '',
          variety: '',
          quantity: 1,
          unit: 'kg',
          pricePerUnit: 1,
          location: '',
          harvestDate: '',
          availableUntil: '',
          description: '',
        });
        this.listingForm.markAsPristine();
        this.loadListings();
      },
      error: (err) => {
        this.submitting = false;
        this.error = err?.error?.message || err?.message || 'Failed to publish listing';
      },
    });
  }

  loadListings() {
    this.loading = true;
    this.error = '';

    this.auth.fetchMarketplaceListings().subscribe({
      next: ({ listings }) => {
        this.loading = false;
        this.listings = listings || [];
        this.failedPhotoIds.clear();
        this.applyFilter();
      },
      error: (err) => {
        this.loading = false;
        this.listings = [];
        this.filteredListings = [];
        this.error = err?.error?.message || err?.message || 'Failed to load marketplace listings';
      },
    });
  }

  applyFilter() {
    const query = this.filterQuery;
    if (!query) {
      this.filteredListings = [...this.listings];
      return;
    }

    this.filteredListings = this.listings.filter((listing) => {
      return [
        listing.cropName,
        listing.variety,
        listing.location,
        listing.description,
        listing.farmer?.name,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }

  hasFarmerPhoto(listing: MarketplaceListing): boolean {
    return Boolean(listing.farmer?.profilePhoto && listing.farmer.profilePhoto.trim());
  }

  isPhotoFailed(farmerId: string): boolean {
    return this.failedPhotoIds.has(farmerId);
  }

  markPhotoFailed(farmerId: string) {
    this.failedPhotoIds.add(farmerId);
  }

  getFarmerInitials(name: string): string {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'F';
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'F';
  }
}
