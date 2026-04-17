import { Component, OnInit } from '@angular/core';
import { UpperCasePipe } from '@angular/common';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import {
  AuthService,
  AuthUser,
  ContractRecord,
  ContractStatus,
  PaymentMethod,
  PaymentProof,
  PaymentProofAction,
  PaymentProofStatus,
  PublicBuyerProfile,
  PublicFarmerProfile,
} from '../../auth/auth.service';

@Component({
    selector: 'app-my-contracts-page',
    imports: [ReactiveFormsModule, RouterLink, UpperCasePipe],
    template: `
    <div class="container page-stack">
      <section class="card">
        <div class="header">
          <h2>My Contracts</h2>
          <a routerLink="/home">Back</a>
        </div>
        <p class="directory-copy" style="margin-top: 0;">
          Create crop contracts, track approvals, and optionally submit payment proof screenshots for verification.
        </p>
      </section>

      @if (success) {
        <div class="notice success-banner">{{ success }}</div>
      }
      @if (error) {
        <div class="notice error-banner">{{ error }}</div>
      }

      @if (isBuyer || isFarmer) {
        <section class="card">
          <form class="row" [formGroup]="contractForm" (ngSubmit)="submitContract()">
            <div class="role-card-copy" style="font-weight: 700; color: #334155;">
              Create contract request
            </div>

            @if (isBuyer) {
              <label>
                Farmer
                <select formControlName="farmerId">
                  <option value="">Select farmer</option>
                  @for (farmer of farmers; track farmer.id) {
                    <option [value]="farmer.id">{{ farmer.name }} - {{ farmer.region }}</option>
                  }
                </select>
              </label>
            } @else {
              <label>
                Buyer
                <select formControlName="buyerId">
                  <option value="">Select buyer</option>
                  @for (buyer of buyers; track buyer.id) {
                    <option [value]="buyer.id">{{ buyer.name }} - {{ buyer.email }}</option>
                  }
                </select>
              </label>
            }

            <div class="split-fields">
              <label>
                Crop name
                <input formControlName="cropName" placeholder="e.g. Paddy Rice" />
              </label>
              <label>
                Unit
                <select formControlName="unit">
                  @for (unit of contractUnitOptions; track unit) {
                    <option [value]="unit">{{ unit | uppercase }}</option>
                  }
                </select>
              </label>
            </div>

            <div class="split-fields">
              <label>
                Quantity
                <input formControlName="quantity" inputmode="decimal" type="number" min="1" step="0.01" placeholder="500" />
              </label>
              <label>
                Price per unit (INR)
                <input formControlName="pricePerUnit" inputmode="decimal" type="number" min="1" step="0.01" placeholder="28" />
              </label>
            </div>

            <label>
              Delivery location
              <input formControlName="deliveryLocation" placeholder="e.g. Coimbatore market yard" />
            </label>

            <div class="split-fields">
              <label>
                Expected delivery date (optional)
                <input formControlName="expectedDeliveryDate" type="date" />
              </label>
              <label>
                Notes (optional)
                <input formControlName="notes" placeholder="Any quality / logistics note" />
              </label>
            </div>

            <button type="submit" [disabled]="submittingContract || loadingCounterpartyList">
              {{ submittingContract ? 'Submitting...' : 'Create contract' }}
            </button>
          </form>
        </section>
      }

      <section class="card">
        <div class="header" style="margin-bottom: 10px;">
          <h3 style="margin: 0;">Contract Requests</h3>
          <button type="button" class="secondary-action" (click)="loadContracts()" [disabled]="loadingContracts">
            {{ loadingContracts ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>

        @if (loadingContracts) {
          <div class="input-hint">Loading contracts...</div>
        }

        @if (!loadingContracts && !contracts.length) {
          <div class="marketplace-empty-state">
            <strong>No contracts yet.</strong>
            <p>
              @if (isBuyer) {
                Create your first contract request from this page.
              } @else {
                Incoming buyer contract requests and your own initiated requests will appear here.
              }
            </p>
          </div>
        }

        @if (contracts.length) {
          <div class="grid contract-grid">
            @for (contract of contracts; track contract.id) {
              <article class="tile contract-card">
                <div class="contract-head">
                  <div>
                    <div class="tile-title">{{ contract.cropName }}</div>
                    <div class="contract-meta">
                      <span>{{ contract.quantity }} {{ contract.unit | uppercase }} @ INR {{ contract.pricePerUnit.toFixed(2) }}</span>
                      <span>Total: INR {{ contract.totalAmount.toFixed(2) }}</span>
                    </div>
                  </div>
                  <span
                    class="profile-chip"
                    [class.status-submitted]="contract.status === 'pending'"
                    [class.status-verified]="contract.status === 'accepted' || contract.status === 'completed'"
                    [class.status-rejected]="contract.status === 'rejected' || contract.status === 'cancelled'"
                  >
                    {{ contractStatusLabel(contract.status) }}
                  </span>
                </div>

                <div class="contract-meta">
                  <span><strong>Buyer:</strong> {{ contract.buyer.name }}</span>
                  <span><strong>Farmer:</strong> {{ contract.farmer.name }}</span>
                  <span><strong>Delivery:</strong> {{ contract.deliveryLocation }}</span>
                  @if (contract.expectedDeliveryDate) {
                    <span><strong>Expected:</strong> {{ formatDate(contract.expectedDeliveryDate) }}</span>
                  }
                </div>

                @if (contract.notes) {
                  <div class="tile-desc">{{ contract.notes }}</div>
                }

                @if (contract.status !== 'pending' && contract.farmerDecisionNote) {
                  <div class="contract-meta">
                    <span><strong>Decision note:</strong> {{ contract.farmerDecisionNote }}</span>
                  </div>
                }

                @if (canFarmerProcessContract(contract) || canBuyerCancelContract(contract)) {
                  <label>
                    Decision note (required for reject)
                    <textarea
                      rows="2"
                      [value]="contractNoteFor(contract.id)"
                      (input)="onContractNoteInput(contract.id, $event)"
                      placeholder="Add acceptance note or rejection reason"
                    ></textarea>
                  </label>
                  <div class="action-row">
                    @if (canFarmerProcessContract(contract)) {
                      <button
                        type="button"
                        (click)="updateContractStatus(contract, 'accepted')"
                        [disabled]="processingContractId === contract.id"
                      >
                        {{ processingContractId === contract.id ? 'Processing...' : 'Accept' }}
                      </button>
                      <button
                        type="button"
                        class="danger-action"
                        (click)="updateContractStatus(contract, 'rejected')"
                        [disabled]="processingContractId === contract.id"
                      >
                        Reject
                      </button>
                    }
                    @if (canBuyerCancelContract(contract)) {
                      <button
                        type="button"
                        class="danger-action"
                        (click)="updateContractStatus(contract, 'cancelled')"
                        [disabled]="processingContractId === contract.id"
                      >
                        Cancel request
                      </button>
                    }
                  </div>
                }
              </article>
            }
          </div>
        }
      </section>

      <section class="card">
        <div class="header" style="margin-bottom: 10px;">
          <h3 style="margin: 0;">Payment Proof Verification</h3>
          <button type="button" class="secondary-action" (click)="loadProofs()" [disabled]="loadingProofs">
            {{ loadingProofs ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>

        @if (isBuyer) {
          <form class="row" [formGroup]="proofForm" (ngSubmit)="submitPaymentProof()" style="margin-bottom: 16px;">
            <div class="role-card-copy" style="font-weight: 700; color: #334155;">Submit payment proof</div>

            <label>
              Farmer
              <select formControlName="farmerId">
                <option value="">Select farmer</option>
                @for (farmer of farmers; track farmer.id) {
                  <option [value]="farmer.id">{{ farmer.name }} - {{ farmer.region }}</option>
                }
              </select>
            </label>

            <div class="split-fields">
              <label>
                Amount (INR)
                <input formControlName="amount" inputmode="decimal" type="number" min="1" step="0.01" placeholder="15000" />
              </label>
              <label>
                Method
                <select formControlName="paymentMethod">
                  @for (option of paymentMethodOptions; track option.value) {
                    <option [value]="option.value">{{ option.label }}</option>
                  }
                </select>
              </label>
            </div>

            <div class="split-fields">
              <label>
                Reference ID / UTR (optional)
                <input formControlName="referenceId" placeholder="e.g. UTR784512963" />
              </label>
              <label>
                Notes (optional)
                <input formControlName="notes" placeholder="Any message for farmer verification" />
              </label>
            </div>

            <label>
              Payment screenshot (JPEG or PNG)
              <input type="file" accept="image/jpeg,image/png" (change)="onScreenshotSelected($event)" />
            </label>

            @if (screenshotPreview) {
              <div class="payment-proof-media-wrap">
                <img class="payment-proof-image" [src]="screenshotPreview" alt="Payment screenshot preview" />
              </div>
              <button type="button" class="secondary-action" (click)="clearScreenshot()">Remove screenshot</button>
            }

            <button type="submit" [disabled]="proofForm.invalid || submittingProof || loadingFarmers">
              {{ submittingProof ? 'Submitting...' : 'Submit payment proof' }}
            </button>
          </form>
        }

        @if (loadingProofs) {
          <div class="input-hint">Loading payment proofs...</div>
        }

        @if (!loadingProofs && !proofs.length) {
          <div class="marketplace-empty-state">
            <strong>No payment proofs yet.</strong>
            <p>
              @if (isBuyer) {
                Submit your first payment screenshot so the farmer can verify it.
              } @else {
                Buyer payment proofs assigned to your account will appear here.
              }
            </p>
          </div>
        }

        @if (proofs.length) {
          <div class="grid payment-proof-grid">
            @for (proof of proofs; track proof.id) {
              <article class="tile payment-proof-card">
                <div class="payment-proof-head">
                  <div>
                    <div class="tile-title">INR {{ proof.amount.toFixed(2) }}</div>
                    <div class="payment-proof-meta">
                      <span>{{ proof.paymentMethod | uppercase }}</span>
                      @if (proof.referenceId) {
                        <span>Ref: {{ proof.referenceId }}</span>
                      }
                      <span>{{ formatDateTime(proof.createdAt) }}</span>
                    </div>
                  </div>
                  <span
                    class="profile-chip"
                    [class.status-submitted]="proof.status === 'submitted'"
                    [class.status-verified]="proof.status === 'verified'"
                    [class.status-rejected]="proof.status === 'rejected'"
                  >
                    {{ paymentStatusLabel(proof.status) }}
                  </span>
                </div>

                <div class="payment-proof-meta">
                  <span><strong>Buyer:</strong> {{ proof.buyer.name }}</span>
                  <span><strong>Farmer:</strong> {{ proof.farmer.name }}</span>
                </div>

                @if (proof.notes) {
                  <div class="tile-desc">{{ proof.notes }}</div>
                }

                <div class="payment-proof-media-wrap">
                  <img class="payment-proof-image" [src]="proof.screenshot" alt="Payment proof screenshot" />
                </div>

                @if (canVerifyPaymentProof(proof)) {
                  <label>
                    Farmer remarks (required for rejection)
                    <textarea
                      rows="2"
                      [value]="paymentRemarkFor(proof.id)"
                      (input)="onPaymentRemarkInput(proof.id, $event)"
                      placeholder="Add confirmation note or rejection reason"
                    ></textarea>
                  </label>
                  <div class="action-row">
                    <button
                      type="button"
                      (click)="processPaymentProof(proof, 'verified')"
                      [disabled]="processingProofId === proof.id"
                    >
                      {{ processingProofId === proof.id ? 'Processing...' : 'Verify payment' }}
                    </button>
                    <button
                      type="button"
                      class="danger-action"
                      (click)="processPaymentProof(proof, 'rejected')"
                      [disabled]="processingProofId === proof.id"
                    >
                      Reject
                    </button>
                  </div>
                }
              </article>
            }
          </div>
        }
      </section>
    </div>
  `
})
export class MyContractsPage implements OnInit {
  private readonly maxScreenshotBytes = 2 * 1024 * 1024;
  private readonly screenshotPattern = /^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+$/;

  readonly paymentMethodOptions: ReadonlyArray<{ value: PaymentMethod; label: string }> = [
    { value: 'upi', label: 'UPI' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'card', label: 'Card' },
    { value: 'cash', label: 'Cash' },
    { value: 'other', label: 'Other' },
  ];

  readonly contractUnitOptions: ReadonlyArray<'kg' | 'quintal' | 'tonne' | 'bag'> = ['kg', 'quintal', 'tonne', 'bag'];

  user: AuthUser | null = null;
  farmers: PublicFarmerProfile[] = [];
  buyers: PublicBuyerProfile[] = [];
  contracts: ContractRecord[] = [];
  proofs: PaymentProof[] = [];
  loadingFarmers = false;
  loadingBuyers = false;
  loadingContracts = false;
  loadingProofs = false;
  submittingContract = false;
  submittingProof = false;
  processingContractId = '';
  processingProofId = '';
  success = '';
  error = '';
  private contractNotesById: Record<string, string> = {};
  private paymentRemarksById: Record<string, string> = {};

  contractForm = this.fb.group({
    farmerId: [''],
    buyerId: [''],
    cropName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    quantity: [null as number | null, [Validators.required, Validators.min(0.01), Validators.max(1000000)]],
    unit: ['kg' as 'kg' | 'quintal' | 'tonne' | 'bag', [Validators.required]],
    pricePerUnit: [null as number | null, [Validators.required, Validators.min(0.01), Validators.max(100000000)]],
    deliveryLocation: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    expectedDeliveryDate: [''],
    notes: ['', [Validators.maxLength(500)]],
  });

  proofForm = this.fb.group({
    farmerId: ['', [Validators.required]],
    amount: [null as number | null, [Validators.required, Validators.min(1), Validators.max(100000000)]],
    paymentMethod: ['upi' as PaymentMethod, [Validators.required]],
    referenceId: ['', [Validators.maxLength(120)]],
    notes: ['', [Validators.maxLength(500)]],
    screenshot: [
      '',
      [
        Validators.required,
        Validators.maxLength(3000000),
        Validators.pattern(/^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+$/),
      ],
    ],
  });

  constructor(private auth: AuthService, private fb: FormBuilder, private route: ActivatedRoute) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.configureCounterpartyValidators();

    if (this.isBuyer) {
      this.loadFarmers();
    } else if (this.isFarmer) {
      this.loadBuyers();
    }

    const preselectedFarmerId = String(this.route.snapshot.queryParamMap.get('farmerId') || '').trim();
    if (preselectedFarmerId) {
      this.contractForm.patchValue({ farmerId: preselectedFarmerId });
      this.proofForm.patchValue({ farmerId: preselectedFarmerId });
    }
    const preselectedBuyerId = String(this.route.snapshot.queryParamMap.get('buyerId') || '').trim();
    if (preselectedBuyerId) {
      this.contractForm.patchValue({ buyerId: preselectedBuyerId });
    }

    this.loadContracts();
    this.loadProofs();
  }

  get isBuyer(): boolean {
    return this.user?.role === 'buyer';
  }

  get isFarmer(): boolean {
    return this.user?.role === 'farmer';
  }

  get screenshotPreview(): string {
    return String(this.proofForm.value.screenshot || '').trim();
  }

  get loadingCounterpartyList(): boolean {
    return this.isBuyer ? this.loadingFarmers : this.loadingBuyers;
  }

  loadBuyers() {
    this.loadingBuyers = true;
    this.auth.browseBuyers().subscribe({
      next: ({ profiles }) => {
        this.loadingBuyers = false;
        this.buyers = profiles;
      },
      error: (err) => {
        this.loadingBuyers = false;
        this.error = err?.error?.message || err?.message || 'Failed to load buyer list';
      },
    });
  }

  loadFarmers() {
    this.loadingFarmers = true;
    this.auth.browseFarmers().subscribe({
      next: ({ profiles }) => {
        this.loadingFarmers = false;
        this.farmers = profiles;
      },
      error: (err) => {
        this.loadingFarmers = false;
        this.error = err?.error?.message || err?.message || 'Failed to load farmer list';
      },
    });
  }

  loadContracts() {
    this.loadingContracts = true;
    this.auth.fetchMyContracts().subscribe({
      next: ({ contracts }) => {
        this.loadingContracts = false;
        this.contracts = contracts;
      },
      error: (err) => {
        this.loadingContracts = false;
        this.error = err?.error?.message || err?.message || 'Failed to load contracts';
      },
    });
  }

  submitContract() {
    if ((!this.isBuyer && !this.isFarmer) || this.contractForm.invalid || this.loadingCounterpartyList) return;

    const quantity = this.contractForm.value.quantity;
    const pricePerUnit = this.contractForm.value.pricePerUnit;
    if (quantity === null || pricePerUnit === null) return;

    const farmerId = String(this.contractForm.value.farmerId || '').trim();
    const buyerId = String(this.contractForm.value.buyerId || '').trim();
    if (this.isBuyer && !farmerId) return;
    if (this.isFarmer && !buyerId) return;

    this.submittingContract = true;
    this.success = '';
    this.error = '';

    this.auth.createContract({
      ...(this.isBuyer ? { farmerId } : { buyerId }),
      cropName: String(this.contractForm.value.cropName || '').trim(),
      quantity: Number(quantity),
      unit: this.contractForm.value.unit || 'kg',
      pricePerUnit: Number(pricePerUnit),
      deliveryLocation: String(this.contractForm.value.deliveryLocation || '').trim(),
      expectedDeliveryDate: String(this.contractForm.value.expectedDeliveryDate || '').trim() || undefined,
      notes: String(this.contractForm.value.notes || '').trim() || undefined,
    }).subscribe({
      next: ({ message, contract }) => {
        this.submittingContract = false;
        this.success = message;
        const currentFarmerId = String(this.contractForm.value.farmerId || '').trim();
        const currentBuyerId = String(this.contractForm.value.buyerId || '').trim();
        this.contractForm.reset({
          farmerId: currentFarmerId,
          buyerId: currentBuyerId,
          cropName: '',
          quantity: null,
          unit: 'kg',
          pricePerUnit: null,
          deliveryLocation: '',
          expectedDeliveryDate: '',
          notes: '',
        });
        this.contracts = [contract, ...this.contracts.filter((entry) => entry.id !== contract.id)];
      },
      error: (err) => {
        this.submittingContract = false;
        this.error = err?.error?.message || err?.message || 'Failed to create contract';
      },
    });
  }

  canFarmerProcessContract(contract: ContractRecord): boolean {
    return this.isFarmer && contract.status === 'pending' && contract.farmer.id === this.user?.id;
  }

  canBuyerCancelContract(contract: ContractRecord): boolean {
    return this.isBuyer && contract.status === 'pending' && contract.buyer.id === this.user?.id;
  }

  contractNoteFor(contractId: string): string {
    return this.contractNotesById[contractId] || '';
  }

  onContractNoteInput(contractId: string, event: Event) {
    const target = event.target as HTMLTextAreaElement | null;
    this.contractNotesById[contractId] = String(target?.value || '');
  }

  updateContractStatus(contract: ContractRecord, status: ContractStatus) {
    const decisionNote = this.contractNoteFor(contract.id).trim();
    if (status === 'rejected' && !decisionNote) {
      this.error = 'Please add a decision note before rejecting a contract.';
      return;
    }

    this.processingContractId = contract.id;
    this.success = '';
    this.error = '';

    this.auth.updateContractStatus(contract.id, { status, decisionNote }).subscribe({
      next: ({ message, contract: updated }) => {
        this.processingContractId = '';
        this.success = message;
        this.contracts = this.contracts.map((entry) => (entry.id === updated.id ? updated : entry));
      },
      error: (err) => {
        this.processingContractId = '';
        this.error = err?.error?.message || err?.message || 'Failed to update contract';
      },
    });
  }

  contractStatusLabel(status: ContractStatus): string {
    if (status === 'accepted') return 'Accepted';
    if (status === 'rejected') return 'Rejected';
    if (status === 'cancelled') return 'Cancelled';
    if (status === 'completed') return 'Completed';
    return 'Pending';
  }

  loadProofs() {
    this.loadingProofs = true;
    this.auth.fetchPaymentProofs().subscribe({
      next: ({ proofs }) => {
        this.loadingProofs = false;
        this.proofs = proofs;
      },
      error: (err) => {
        this.loadingProofs = false;
        this.error = err?.error?.message || err?.message || 'Failed to load payment proofs';
      },
    });
  }

  submitPaymentProof() {
    if (!this.isBuyer || this.proofForm.invalid || this.loadingFarmers) return;

    const amount = this.proofForm.value.amount;
    if (amount === null) return;

    this.submittingProof = true;
    this.success = '';
    this.error = '';

    this.auth.submitPaymentProof({
      farmerId: String(this.proofForm.value.farmerId || '').trim(),
      amount: Number(amount),
      paymentMethod: this.proofForm.value.paymentMethod || 'upi',
      referenceId: String(this.proofForm.value.referenceId || '').trim(),
      screenshot: String(this.proofForm.value.screenshot || '').trim(),
      notes: String(this.proofForm.value.notes || '').trim(),
    }).subscribe({
      next: ({ message }) => {
        this.submittingProof = false;
        this.success = message;
        const currentFarmerId = String(this.proofForm.value.farmerId || '').trim();
        const currentMethod = this.proofForm.value.paymentMethod || 'upi';
        this.proofForm.reset({
          farmerId: currentFarmerId,
          amount: null,
          paymentMethod: currentMethod,
          referenceId: '',
          notes: '',
          screenshot: '',
        });
        this.loadProofs();
      },
      error: (err) => {
        this.submittingProof = false;
        this.error = err?.error?.message || err?.message || 'Failed to submit payment proof';
      },
    });
  }

  canVerifyPaymentProof(proof: PaymentProof): boolean {
    return this.isFarmer && proof.status === 'submitted' && proof.farmer.id === this.user?.id;
  }

  paymentRemarkFor(proofId: string): string {
    return this.paymentRemarksById[proofId] || '';
  }

  onPaymentRemarkInput(proofId: string, event: Event) {
    const target = event.target as HTMLTextAreaElement | null;
    this.paymentRemarksById[proofId] = String(target?.value || '');
  }

  processPaymentProof(proof: PaymentProof, action: PaymentProofAction) {
    if (!this.canVerifyPaymentProof(proof)) return;

    const farmerRemarks = this.paymentRemarkFor(proof.id).trim();
    if (action === 'rejected' && !farmerRemarks) {
      this.error = 'Please add farmer remarks before rejecting payment proof.';
      return;
    }

    this.processingProofId = proof.id;
    this.success = '';
    this.error = '';

    this.auth.verifyPaymentProof(proof.id, { action, farmerRemarks }).subscribe({
      next: ({ message, proof: updated }) => {
        this.processingProofId = '';
        this.success = message;
        this.proofs = this.proofs.map((item) => (item.id === updated.id ? updated : item));
      },
      error: (err) => {
        this.processingProofId = '';
        this.error = err?.error?.message || err?.message || 'Failed to process payment proof';
      },
    });
  }

  onScreenshotSelected(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;

    if (!this.isSupportedScreenshot(file)) {
      this.error = 'Payment screenshot must be JPEG or PNG format.';
      if (input) input.value = '';
      return;
    }

    if (file.size > this.maxScreenshotBytes) {
      this.error = 'Payment screenshot must be 2 MB or smaller.';
      if (input) input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result.trim() : '';
      if (!this.screenshotPattern.test(result)) {
        this.error = 'Payment screenshot must be JPEG or PNG format.';
        return;
      }
      this.proofForm.patchValue({ screenshot: result });
      this.error = '';
    };
    reader.onerror = () => {
      this.error = 'Unable to read selected screenshot file.';
    };
    reader.readAsDataURL(file);
  }

  clearScreenshot() {
    this.proofForm.patchValue({ screenshot: '' });
    this.error = '';
  }

  paymentStatusLabel(status: PaymentProofStatus): string {
    if (status === 'verified') return 'Verified';
    if (status === 'rejected') return 'Rejected';
    return 'Submitted';
  }

  formatDateTime(value: string | null): string {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString();
  }

  formatDate(value: string | null): string {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString();
  }

  private isSupportedScreenshot(file: File): boolean {
    return file.type === 'image/jpeg' || file.type === 'image/png';
  }

  private configureCounterpartyValidators() {
    const farmerControl = this.contractForm.controls.farmerId;
    const buyerControl = this.contractForm.controls.buyerId;

    if (this.isBuyer) {
      farmerControl.setValidators([Validators.required]);
      buyerControl.clearValidators();
      buyerControl.setValue('');
    } else if (this.isFarmer) {
      buyerControl.setValidators([Validators.required]);
      farmerControl.clearValidators();
      farmerControl.setValue('');
    } else {
      farmerControl.clearValidators();
      buyerControl.clearValidators();
    }

    farmerControl.updateValueAndValidity({ emitEvent: false });
    buyerControl.updateValueAndValidity({ emitEvent: false });
  }
}
