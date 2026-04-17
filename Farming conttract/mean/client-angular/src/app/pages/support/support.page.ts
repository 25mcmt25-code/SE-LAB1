import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../auth/auth.service';

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface SupportCategory {
  value: string;
  label: string;
}

@Component({
    selector: 'app-support-page',
    imports: [ReactiveFormsModule, RouterLink],
    template: `
    <div class="container page-stack">
      <section class="card">
        <div class="header">
          <h2>Support Center</h2>
          <a routerLink="/home">Back</a>
        </div>

        <div class="friendly-hero directory-hero">
          <div class="friendly-picture" aria-hidden="true">
            <div class="visual-card-art support-art large-art"></div>
          </div>
          <div class="friendly-copy">
            <strong>Get Help & Support</strong>
            <p class="directory-copy">Need assistance? Create a support ticket and our team will help you resolve any issues.</p>
          </div>
        </div>

        <form class="row" [formGroup]="ticketForm" (ngSubmit)="createTicket()">
          <div class="role-card-copy" style="font-weight: 700; color: #334155; margin-bottom: 16px;">
            Create Support Ticket
          </div>

          <label>
            Subject
            <input formControlName="subject" placeholder="Brief description of your issue" />
          </label>

          <label>
            Category
            <select formControlName="category">
              <option value="">Select a category</option>
              @for (category of categories; track category.value) {
                <option [value]="category.value">{{ category.label }}</option>
              }
            </select>
          </label>

          <label>
            Priority
            <select formControlName="priority">
              <option value="low">Low - General inquiry</option>
              <option value="medium">Medium - Issue affecting functionality</option>
              <option value="high">High - Major issue</option>
              <option value="urgent">Urgent - Critical problem</option>
            </select>
          </label>

          <label>
            Description
            <textarea
              formControlName="description"
              rows="6"
              placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable."
            ></textarea>
          </label>

          <button type="submit" [disabled]="ticketForm.invalid || creating">
            {{ creating ? 'Creating Ticket...' : 'Create Support Ticket' }}
          </button>
        </form>

        @if (success) {
          <div class="notice success-banner">{{ success }}</div>
        }
        @if (error) {
          <div class="notice error-banner">{{ error }}</div>
        }
      </section>

      <section class="card">
        <div class="header">
          <h3>Your Support Tickets</h3>
          <button type="button" class="secondary-action" (click)="loadTickets()" [disabled]="loadingTickets">
            {{ loadingTickets ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>

        @if (loadingTickets) {
          <div class="input-hint">Loading tickets...</div>
        }

        @if (!loadingTickets && !tickets.length) {
          <div class="marketplace-empty-state">
            <strong>No support tickets yet.</strong>
            <p>Use the form above to create your first support ticket.</p>
          </div>
        }

        @if (tickets.length) {
          <div class="grid ticket-grid">
            @for (ticket of tickets; track ticket.id) {
              <article class="tile ticket-card">
                <div class="ticket-header">
                  <div>
                    <div class="tile-title">{{ ticket.subject }}</div>
                    <div class="ticket-meta">
                      <span>{{ getCategoryLabel(ticket.category) }}</span>
                      <span>|</span>
                      <span>Created: {{ formatDate(ticket.createdAt) }}</span>
                    </div>
                  </div>
                  <div class="ticket-status">
                    <span class="profile-chip" [class]="'priority-' + ticket.priority">
                      {{ ticket.priority }}
                    </span>
                    <span class="profile-chip" [class]="'status-' + ticket.status">
                      {{ getStatusLabel(ticket.status) }}
                    </span>
                  </div>
                </div>

                <div class="action-row">
                  <button
                    type="button"
                    (click)="viewTicket(ticket.id)"
                    [disabled]="viewingTicketId === ticket.id"
                  >
                    {{ viewingTicketId === ticket.id ? 'Loading...' : 'View Details' }}
                  </button>
                </div>
              </article>
            }
          </div>
        }
      </section>

      @if (currentTicket) {
        <section class="card">
          <div class="header">
            <h3>{{ currentTicket.subject }}</h3>
            <button type="button" class="secondary-action" (click)="closeTicket()">Close</button>
          </div>

          <div class="ticket-details">
            <div class="detail-row">
              <strong>Category:</strong> {{ getCategoryLabel(currentTicket.category) }}
            </div>
            <div class="detail-row">
              <strong>Priority:</strong>
              <span class="priority-chip" [class]="'priority-' + currentTicket.priority">
                {{ currentTicket.priority }}
              </span>
            </div>
            <div class="detail-row">
              <strong>Status:</strong>
              <span class="status-chip" [class]="'status-' + currentTicket.status">
                {{ getStatusLabel(currentTicket.status) }}
              </span>
            </div>
            <div class="detail-row">
              <strong>Created:</strong> {{ formatDate(currentTicket.createdAt) }}
            </div>
            <div class="detail-row">
              <strong>Last Updated:</strong> {{ formatDate(currentTicket.updatedAt) }}
            </div>

            @if (currentTicket.description) {
              <div class="ticket-description">
                <strong>Description:</strong>
                <p>{{ currentTicket.description }}</p>
              </div>
            }

            @if (currentTicket.resolution) {
              <div class="ticket-resolution">
                <strong>Resolution:</strong>
                <p>{{ currentTicket.resolution }}</p>
              </div>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .ticket-grid {
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 16px;
    }

    .ticket-card {
      padding: 16px;
    }

    .ticket-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .ticket-meta {
      font-size: 14px;
      color: #64748b;
      margin-top: 4px;
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .ticket-status {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
    }

    .priority-low { background: #f3f4f6; color: #374151; }
    .priority-medium { background: #fef3c7; color: #92400e; }
    .priority-high { background: #fee2e2; color: #dc2626; }
    .priority-urgent { background: #fee2e2; color: #7f1d1d; font-weight: bold; }

    .status-open { background: #dbeafe; color: #1e40af; }
    .status-in_progress { background: #fef3c7; color: #92400e; }
    .status-resolved { background: #d1fae5; color: #065f46; }
    .status-closed { background: #f3f4f6; color: #374151; }

    .ticket-details {
      margin-top: 16px;
    }

    .detail-row {
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .detail-row strong {
      min-width: 120px;
    }

    .ticket-description,
    .ticket-resolution {
      margin-top: 16px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
    }

    .ticket-description p,
    .ticket-resolution p {
      margin: 8px 0 0 0;
      line-height: 1.5;
    }

    .priority-chip,
    .status-chip {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }
  `]
})
export class SupportPage implements OnInit {
  loadingTickets = false;
  creating = false;
  viewingTicketId: string | null = null;
  success = '';
  error = '';
  tickets: SupportTicket[] = [];
  currentTicket: any = null;

  ticketForm = this.fb.group({
    subject: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
    category: ['', Validators.required],
    priority: ['medium', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
  });

  categories: SupportCategory[] = [
    { value: 'technical', label: 'Technical Issue' },
    { value: 'account', label: 'Account Problem' },
    { value: 'contract', label: 'Contract Issue' },
    { value: 'payment', label: 'Payment Problem' },
    { value: 'other', label: 'Other' },
  ];

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  ngOnInit() {
    this.loadTickets();
  }

  createTicket() {
    if (this.ticketForm.invalid) return;

    this.creating = true;
    this.success = '';
    this.error = '';

    const ticketPayload = this.ticketForm.value as {
      subject: string;
      category: string;
      priority: string;
      description: string;
    };

    this.auth.createSupportTicket(ticketPayload).subscribe({
      next: (response) => {
        this.creating = false;
        this.success = 'Support ticket created successfully! Our team will respond within 24 hours.';
        this.ticketForm.reset();
        this.ticketForm.patchValue({ priority: 'medium' }); // Reset to default
        this.loadTickets(); // Refresh the tickets list
      },
      error: (err) => {
        this.creating = false;
        this.error = err?.error?.message || err?.message || 'Failed to create support ticket';
      },
    });
  }

  loadTickets() {
    this.loadingTickets = true;
    this.auth.getUserSupportTickets().subscribe({
      next: (response) => {
        this.loadingTickets = false;
        this.tickets = response.tickets || [];
      },
      error: (err) => {
        this.loadingTickets = false;
        this.error = err?.error?.message || err?.message || 'Failed to load support tickets';
      },
    });
  }

  viewTicket(ticketId: string) {
    this.viewingTicketId = ticketId;
    this.auth.getSupportTicket(ticketId).subscribe({
      next: (response) => {
        this.viewingTicketId = null;
        this.currentTicket = response.ticket;
        this.error = '';
      },
      error: (err) => {
        this.viewingTicketId = null;
        this.error = err?.error?.message || err?.message || 'Failed to load ticket details';
      },
    });
  }

  closeTicket() {
    this.currentTicket = null;
  }

  getCategoryLabel(category: string): string {
    const cat = this.categories.find(c => c.value === category);
    return cat?.label || category;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      open: 'Open',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed',
    };
    return labels[status] || status;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}

