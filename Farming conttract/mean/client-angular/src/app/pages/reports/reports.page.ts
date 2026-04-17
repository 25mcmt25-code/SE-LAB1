import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../auth/auth.service';

interface ReportType {
  value: string;
  label: string;
  description: string;
}

interface GeneratedReport {
  id: string;
  reportType: string;
  title: string;
  generatedAt: string;
  expiresAt: string;
}

@Component({
    selector: 'app-reports-page',
    imports: [ReactiveFormsModule, RouterLink],
    template: `
    <div class="container page-stack">
      <section class="card">
        <div class="header">
          <h2>Reports</h2>
          <a routerLink="/home">Back</a>
        </div>

        <div class="friendly-hero directory-hero">
          <div class="friendly-picture" aria-hidden="true">
            <div class="visual-card-art reports-art large-art"></div>
          </div>
          <div class="friendly-copy">
            <strong>Generate Reports</strong>
            <p class="directory-copy">Get insights into your farming contracts, marketplace activity, and performance metrics.</p>
          </div>
        </div>

        <form class="row" [formGroup]="reportForm" (ngSubmit)="generateReport()">
          <label>
            Report Type
            <select formControlName="reportType" (change)="onReportTypeChange()">
              <option value="">Select a report type</option>
              @for (type of reportTypes; track type.value) {
                <option [value]="type.value">{{ type.label }}</option>
              }
            </select>
          </label>

          @if (selectedReportType) {
            <div class="report-description">
              <p>{{ selectedReportType.description }}</p>
            </div>
          }

          <div class="split-fields">
            <label>
              Start Date *
              <input formControlName="startDate" type="date" />
            </label>
            <label>
              End Date *
              <input formControlName="endDate" type="date" />
            </label>
          </div>

          @if (reportForm.value.reportType === 'contracts_summary' || reportForm.value.reportType === 'marketplace_activity') {
            <label>
              Contract Status (optional)
              <select formControlName="status">
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>

            <label>
              Crop Name (optional)
              <input formControlName="cropName" placeholder="e.g. rice, wheat" />
            </label>
          }

          <button type="submit" [disabled]="reportForm.invalid || generating">
            {{ generating ? 'Generating...' : 'Generate Report' }}
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
          <h3>Your Reports</h3>
          <button type="button" class="secondary-action" (click)="loadReports()" [disabled]="loadingReports">
            {{ loadingReports ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>

        @if (loadingReports) {
          <div class="input-hint">Loading reports...</div>
        }

        @if (!loadingReports && !reports.length) {
          <div class="marketplace-empty-state">
            <strong>No reports generated yet.</strong>
            <p>Use the form above to generate your first report.</p>
          </div>
        }

        @if (reports.length) {
          <div class="grid report-grid">
            @for (report of reports; track report.id) {
              <article class="tile report-card">
                <div class="report-header">
                  <div>
                    <div class="tile-title">{{ report.title }}</div>
                    <div class="report-meta">Generated: {{ formatDate(report.generatedAt) }}</div>
                  </div>
                  <span class="profile-chip">{{ getReportTypeLabel(report.reportType) }}</span>
                </div>

                <div class="action-row">
                  <button
                    type="button"
                    (click)="viewReport(report.id)"
                    [disabled]="viewingReportId === report.id"
                  >
                    {{ viewingReportId === report.id ? 'Loading...' : 'View Report' }}
                  </button>
                  <button
                    type="button"
                    class="secondary-action"
                    (click)="exportReport(report.id, 'json')"
                  >
                    Export JSON
                  </button>
                  <button
                    type="button"
                    class="secondary-action"
                    (click)="exportReport(report.id, 'csv')"
                  >
                    Export CSV
                  </button>
                  <button
                    type="button"
                    class="secondary-action"
                    (click)="exportReport(report.id, 'pdf')"
                  >
                    Export PDF
                  </button>
                </div>
              </article>
            }
          </div>
        }
      </section>

      @if (currentReportData) {
        <section class="card">
          <div class="header">
            <h3>{{ currentReportData.title }}</h3>
            <button type="button" class="secondary-action" (click)="closeReport()">Close</button>
          </div>

          <div class="report-content">
            @if (currentReportData.reportType === 'contracts_summary') {
              <div class="report-summary">
                <div class="summary-stats">
                  <div class="stat-item">
                    <strong>{{ currentReportData.data.totalContracts }}</strong>
                    <span>Total Contracts</span>
                  </div>
                  <div class="stat-item">
                    <strong>INR {{ currentReportData.data.totalValue?.toLocaleString() || 0 }}</strong>
                    <span>Total Value</span>
                  </div>
                </div>

                @if (currentReportData.data.contracts?.length) {
                  <table class="report-table">
                    <thead>
                      <tr>
                        <th>Crop</th>
                        <th>Quantity</th>
                        <th>Price/Unit</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Buyer/Farmer</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (contract of currentReportData.data.contracts; track contract.id) {
                        <tr>
                          <td>{{ contract.cropName }}</td>
                          <td>{{ contract.quantity }} {{ contract.unit }}</td>
                          <td>INR {{ contract.pricePerUnit }}</td>
                          <td>INR {{ contract.totalAmount }}</td>
                          <td>
                            <span class="status-chip" [class]="'status-' + contract.status">
                              {{ contract.status }}
                            </span>
                          </td>
                          <td>{{ userRole === 'buyer' ? contract.farmer : contract.buyer }}</td>
                          <td>{{ formatDate(contract.createdAt) }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </div>
            }

            @if (currentReportData.reportType === 'marketplace_activity') {
              <div class="report-summary">
                <div class="summary-stats">
                  <div class="stat-item">
                    <strong>{{ currentReportData.data.totalListings }}</strong>
                    <span>Total Listings</span>
                  </div>
                  <div class="stat-item">
                    <strong>INR {{ currentReportData.data.totalValue?.toLocaleString() || 0 }}</strong>
                    <span>Total Value</span>
                  </div>
                </div>
              </div>
            }

            @if (currentReportData.reportType === 'farmer_performance' || currentReportData.reportType === 'buyer_activity') {
              <div class="report-summary">
                <div class="summary-stats">
                  <div class="stat-item">
                    <strong>{{ currentReportData.data.totalContracts }}</strong>
                    <span>Total Contracts</span>
                  </div>
                  <div class="stat-item">
                    <strong>INR {{ (currentReportData.reportType === 'farmer_performance' ? currentReportData.data.totalRevenue : currentReportData.data.totalSpent)?.toLocaleString() || 0 }}</strong>
                    <span>{{ currentReportData.reportType === 'farmer_performance' ? 'Total Revenue' : 'Total Spent' }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .report-description {
      background: #f8fafc;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 16px;
    }

    .report-grid {
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 16px;
    }

    .report-card {
      padding: 16px;
    }

    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .report-meta {
      font-size: 14px;
      color: #64748b;
      margin-top: 4px;
    }

    .summary-stats {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .stat-item {
      text-align: center;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
      min-width: 120px;
    }

    .stat-item strong {
      display: block;
      font-size: 24px;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .stat-item span {
      font-size: 14px;
      color: #64748b;
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }

    .report-table th,
    .report-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    .report-table th {
      background: #f8fafc;
      font-weight: 600;
      color: #374151;
    }

    .status-chip {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-pending { background: #fef3c7; color: #92400e; }
    .status-accepted { background: #dbeafe; color: #1e40af; }
    .status-rejected { background: #fee2e2; color: #dc2626; }
    .status-completed { background: #d1fae5; color: #065f46; }
    .status-cancelled { background: #f3f4f6; color: #374151; }
  `]
})
export class ReportsPage implements OnInit {
  loadingReports = false;
  generating = false;
  viewingReportId: string | null = null;
  success = '';
  error = '';
  reports: GeneratedReport[] = [];
  currentReportData: any = null;

  reportForm = this.fb.group({
    reportType: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    status: [''],
    cropName: [''],
  });

  get reportTypes(): ReportType[] {
    const allTypes: ReportType[] = [
      {
        value: 'contracts_summary',
        label: 'Contracts Summary',
        description: 'Overview of your contracts including status breakdown, total value, and contract details.'
      },
      {
        value: 'marketplace_activity',
        label: 'Marketplace Activity',
        description: 'Analysis of your marketplace listings and their performance.'
      },
      {
        value: 'farmer_performance',
        label: 'Farmer Performance',
        description: 'Detailed performance metrics for farmers including revenue and contract statistics.'
      },
      {
        value: 'buyer_activity',
        label: 'Buyer Activity',
        description: 'Analysis of your buying activity and contract spending patterns.'
      },
    ];

    if (this.userRole === 'buyer') {
      return allTypes.filter(type => type.value !== 'marketplace_activity' && type.value !== 'farmer_performance');
    } else {
      return allTypes.filter(type => type.value !== 'buyer_activity');
    }
  }

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  ngOnInit() {
    this.loadReports();
  }

  get userRole() {
    return this.auth.getUser()?.role || 'buyer';
  }

  get selectedReportType(): ReportType | undefined {
    const reportType = this.reportForm.value.reportType;
    return this.reportTypes.find(type => type.value === reportType);
  }

  onReportTypeChange() {
    // Clear form fields when report type changes
    this.reportForm.patchValue({
      status: '',
      cropName: '',
    });
  }

  generateReport() {
    if (this.reportForm.invalid) return;

    this.generating = true;
    this.success = '';
    this.error = '';

    const formValue = this.reportForm.value;
    const parameters: any = {};

    if (formValue.startDate) parameters.startDate = formValue.startDate;
    if (formValue.endDate) parameters.endDate = formValue.endDate;
    if (formValue.status) parameters.status = formValue.status;
    if (formValue.cropName) parameters.cropName = formValue.cropName;

    this.auth.generateReport({ reportType: formValue.reportType!, parameters }).subscribe({
      next: (response) => {
        this.generating = false;
        this.success = 'Report generated successfully!';
        this.loadReports(); // Refresh the reports list
        this.reportForm.reset();
      },
      error: (err: any) => {
        this.generating = false;
        this.error = err?.error?.message || err?.message || 'Failed to generate report';
      },
    });
  }

  loadReports() {
    this.loadingReports = true;
    this.auth.getUserReports().subscribe({
      next: (response) => {
        this.loadingReports = false;
        this.reports = response.reports || [];
      },
      error: (err) => {
        this.loadingReports = false;
        this.error = err?.error?.message || err?.message || 'Failed to load reports';
      },
    });
  }

  viewReport(reportId: string) {
    this.viewingReportId = reportId;
    this.auth.getReportData(reportId).subscribe({
      next: (response: { report: any }) => {
        this.viewingReportId = null;
        this.currentReportData = response.report;
        this.error = '';
      },
      error: (err: any) => {
        this.viewingReportId = null;
        this.error = err?.error?.message || err?.message || 'Failed to load report data';
      },
    });
  }

  exportReport(reportId: string, format: 'json' | 'csv' | 'pdf') {
    this.auth.exportReport(reportId, format).subscribe({
      next: (response) => {
        const mimeType = this.mimeTypeFor(format);
        const fallbackFilename = `report_${reportId}.${format}`;
        const filename = this.resolveFilename(
          response.headers.get('content-disposition'),
          fallbackFilename
        );

        const blob = response.body ?? new Blob([], { type: mimeType });
        const downloadableBlob = blob.type ? blob : new Blob([blob], { type: mimeType });
        const url = window.URL.createObjectURL(downloadableBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Failed to export report';
      },
    });
  }

  closeReport() {
    this.currentReportData = null;
  }

  getReportTypeLabel(reportType: string): string {
    const type = this.reportTypes.find(t => t.value === reportType);
    return type?.label || reportType;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
  private mimeTypeFor(format: 'json' | 'csv' | 'pdf'): string {
    if (format === 'json') return 'application/json';
    if (format === 'csv') return 'text/csv';
    return 'application/pdf';
  }

  private resolveFilename(contentDisposition: string | null, fallback: string): string {
    if (!contentDisposition) return fallback;

    const filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
    const rawFilename = filenameMatch?.[1] || filenameMatch?.[2];
    if (!rawFilename) return fallback;

    try {
      return decodeURIComponent(rawFilename);
    } catch {
      return rawFilename;
    }
  }
}
