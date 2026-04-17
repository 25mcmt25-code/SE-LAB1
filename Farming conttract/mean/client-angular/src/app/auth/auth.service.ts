import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export type UserRole = 'farmer' | 'buyer';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  desiredCrops?: string[];
  profilePhoto?: string;
  savedCard?: SavedBuyerCard | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface FarmerProfile {
  region: string;
  crops: string[];
  bio: string;
  profilePhoto?: string;
  upiId?: string;
  bank?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifsc?: string;
    bankName?: string;
  };
}

export interface SavedBuyerCard {
  cardHolderName: string;
  cardBrand: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
}

export type PaymentMethod = 'upi' | 'bank_transfer' | 'card' | 'cash' | 'other';
export type PaymentProofStatus = 'submitted' | 'verified' | 'rejected';
export type PaymentProofAction = 'verified' | 'rejected';

export interface PaymentParty {
  id: string;
  name: string;
  email: string;
  profilePhoto: string;
}

export interface PaymentProof {
  id: string;
  buyer: PaymentParty;
  farmer: PaymentParty;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  referenceId: string;
  screenshot: string;
  notes: string;
  status: PaymentProofStatus;
  farmerRemarks: string;
  createdAt: string | null;
  verifiedAt: string | null;
}

export interface PublicFarmerProfile {
  id: string;
  name: string;
  email: string;
  role: 'farmer';
  region: string;
  crops: string[];
  bio: string;
  profilePhoto?: string;
}

export interface PublicFarmerProfileDetail extends PublicFarmerProfile {
  updatedAt: string | null;
}

export interface FarmerBrowseQuery {
  crop?: string;
  location?: string;
}

export interface PublicBuyerProfile {
  id: string;
  name: string;
  email: string;
  role: 'buyer';
  desiredCrops: string[];
  profilePhoto?: string;
}

export interface PublicBuyerProfileDetail extends PublicBuyerProfile {
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProductListingPayload {
  cropName: string;
  variety?: string;
  quantity: number;
  unit: 'kg' | 'quintal' | 'tonne' | 'bag';
  pricePerUnit: number;
  location: string;
  harvestDate?: string;
  availableUntil?: string;
  description?: string;
}

export interface MarketplaceListing {
  id: string;
  cropName: string;
  variety: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  location: string;
  harvestDate: string | null;
  availableUntil: string | null;
  description: string;
  isActive: boolean;
  createdAt: string | null;
  farmer: {
    id: string;
    name: string;
    profilePhoto: string;
  };
}

export type ContractStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

export interface ContractNotification {
  recipientRole: UserRole;
  message: string;
  createdAt?: string;
}

export interface ContractRecord {
  id: string;
  buyer: PaymentParty;
  farmer: PaymentParty;
  cropName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
  deliveryLocation: string;
  expectedDeliveryDate: string | null;
  notes: string;
  status: ContractStatus;
  farmerDecisionNote: string;
  notifications: ContractNotification[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateContractPayload {
  farmerId?: string;
  buyerId?: string;
  cropName: string;
  quantity: number;
  unit: 'kg' | 'quintal' | 'tonne' | 'bag';
  pricePerUnit: number;
  deliveryLocation: string;
  expectedDeliveryDate?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:5000';
  private readonly tokenKey = 'acf_token';
  private readonly userKey = 'acf_user';

  constructor(private http: HttpClient) {}

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): AuthUser | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  setSession(resp: AuthResponse): void {
    localStorage.setItem(this.tokenKey, resp.token);
    this.setStoredUser(resp.user);
  }

  private setStoredUser(user: AuthUser): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  register(payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    desiredCrops?: string[];
    profilePhoto?: string;
    savedCard?: {
      cardHolderName: string;
      cardNumber: string;
      expiryMonth: string;
      expiryYear: string;
    } | null;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/api/auth/register`, payload)
      .pipe(tap((resp) => this.setSession(resp)));
  }

  login(payload: { email: string; password: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/api/auth/login`, payload)
      .pipe(tap((resp) => this.setSession(resp)));
  }

  me(): Observable<{ user: AuthUser }> {
    return this.http.get<{ user: AuthUser }>(`${this.apiUrl}/api/auth/me`);
  }

  validate(): Observable<{ valid: boolean; user: { userId: string; role: UserRole } }> {
    return this.http.get<{ valid: boolean; user: { userId: string; role: UserRole } }>(`${this.apiUrl}/api/auth/validate`);
  }

  forgotPassword(payload: { email: string }): Observable<{ message: string; resetToken?: string }> {
    return this.http.post<{ message: string; resetToken?: string }>(`${this.apiUrl}/api/auth/forgot-password`, payload);
  }

  resetPassword(payload: { email: string; resetToken: string; newPassword: string }): Observable<AuthResponse & { message?: string }> {
    return this.http
      .post<AuthResponse & { message?: string }>(`${this.apiUrl}/api/auth/reset-password`, payload)
      .pipe(tap((resp) => this.setSession({ token: resp.token, user: resp.user })));
  }

  getMyFarmerProfile(): Observable<{ profile: FarmerProfile | null }> {
    return this.http.get<{ profile: FarmerProfile | null }>(`${this.apiUrl}/api/farmer-profile/me`);
  }

  saveMyFarmerProfile(payload: FarmerProfile): Observable<{ message: string; profile: FarmerProfile }> {
    return this.http.put<{ message: string; profile: FarmerProfile }>(`${this.apiUrl}/api/farmer-profile/me`, payload);
  }

  browseFarmers(query?: FarmerBrowseQuery): Observable<{ profiles: PublicFarmerProfile[] }> {
    let params = new HttpParams();
    const crop = String(query?.crop || '').trim();
    const location = String(query?.location || '').trim();
    if (crop) params = params.set('crop', crop);
    if (location) params = params.set('location', location);
    return this.http.get<{ profiles: PublicFarmerProfile[] }>(`${this.apiUrl}/api/profile-browse/farmers`, { params });
  }

  fetchFarmerProfile(farmerId: string): Observable<{ profile: PublicFarmerProfileDetail }> {
    return this.http.get<{ profile: PublicFarmerProfileDetail }>(`${this.apiUrl}/api/profile-browse/farmers/${farmerId}`);
  }

  browseBuyers(): Observable<{ profiles: PublicBuyerProfile[] }> {
    return this.http.get<{ profiles: PublicBuyerProfile[] }>(`${this.apiUrl}/api/profile-browse/buyers`);
  }

  fetchBuyerProfile(buyerId: string): Observable<{ profile: PublicBuyerProfileDetail }> {
    return this.http.get<{ profile: PublicBuyerProfileDetail }>(`${this.apiUrl}/api/profile-browse/buyers/${buyerId}`);
  }

  submitProductListing(payload: ProductListingPayload): Observable<{ message: string; listing: MarketplaceListing }> {
    return this.http.post<{ message: string; listing: MarketplaceListing }>(`${this.apiUrl}/api/marketplace/listings`, payload);
  }

  fetchMarketplaceListings(): Observable<{ listings: MarketplaceListing[] }> {
    return this.http.get<{ listings: MarketplaceListing[] }>(`${this.apiUrl}/api/marketplace/listings`);
  }

  fetchPaymentProofs(): Observable<{ proofs: PaymentProof[] }> {
    return this.http.get<{ proofs: PaymentProof[] }>(`${this.apiUrl}/api/payments/proofs`);
  }

  submitPaymentProof(payload: {
    farmerId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    referenceId?: string;
    screenshot: string;
    notes?: string;
  }): Observable<{ message: string; proof: PaymentProof }> {
    return this.http.post<{ message: string; proof: PaymentProof }>(`${this.apiUrl}/api/payments/proofs`, payload);
  }

  verifyPaymentProof(
    proofId: string,
    payload: { action: PaymentProofAction; farmerRemarks?: string }
  ): Observable<{ message: string; proof: PaymentProof }> {
    return this.http.put<{ message: string; proof: PaymentProof }>(`${this.apiUrl}/api/payments/proofs/${proofId}/verify`, payload);
  }

  createContract(payload: CreateContractPayload): Observable<{ message: string; contract: ContractRecord }> {
    return this.http.post<{ message: string; contract: ContractRecord }>(`${this.apiUrl}/api/contracts`, payload);
  }

  fetchMyContracts(): Observable<{ contracts: ContractRecord[] }> {
    return this.http.get<{ contracts: ContractRecord[] }>(`${this.apiUrl}/api/contracts/my`);
  }

  fetchContract(contractId: string): Observable<{ contract: ContractRecord }> {
    return this.http.get<{ contract: ContractRecord }>(`${this.apiUrl}/api/contracts/${contractId}`);
  }

  updateContractStatus(
    contractId: string,
    payload: { status: ContractStatus; decisionNote?: string }
  ): Observable<{ message: string; contract: ContractRecord }> {
    return this.http.patch<{ message: string; contract: ContractRecord }>(`${this.apiUrl}/api/contracts/${contractId}/status`, payload);
  }

  saveBuyerPaymentCard(payload: {
    cardHolderName: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
  }): Observable<{ message: string; user: AuthUser }> {
    return this.http
      .put<{ message: string; user: AuthUser }>(`${this.apiUrl}/api/auth/buyer-payment/me`, payload)
      .pipe(tap((resp) => this.setStoredUser(resp.user)));
  }

  updateBuyerProfile(payload: { name: string; desiredCrops: string[] }): Observable<{ message: string; user: AuthUser }> {
    return this.http
      .put<{ message: string; user: AuthUser }>(`${this.apiUrl}/api/auth/me`, payload)
      .pipe(tap((resp) => this.setStoredUser(resp.user)));
  }

  updateMyProfilePhoto(payload: { profilePhoto: string }): Observable<{ message: string; user: AuthUser }> {
    return this.http
      .put<{ message: string; user: AuthUser }>(`${this.apiUrl}/api/auth/me/profile-photo`, payload)
      .pipe(tap((resp) => this.setStoredUser(resp.user)));
  }

  // Support ticket methods
  createSupportTicket(payload: {
    subject: string;
    category: string;
    priority: string;
    description: string;
  }): Observable<{ message: string; ticket: any }> {
    return this.http.post<{ message: string; ticket: any }>(`${this.apiUrl}/api/support`, payload);
  }

  getUserSupportTickets(): Observable<{ tickets: any[] }> {
    return this.http.get<{ tickets: any[] }>(`${this.apiUrl}/api/support`);
  }

  getSupportTicket(ticketId: string): Observable<{ ticket: any }> {
    return this.http.get<{ ticket: any }>(`${this.apiUrl}/api/support/${ticketId}`);
  }

  // Report methods
  generateReport(payload: {
    reportType: string;
    parameters?: any;
  }): Observable<{ message: string; report: any }> {
    return this.http.post<{ message: string; report: any }>(`${this.apiUrl}/api/reports/generate`, payload);
  }

  getUserReports(): Observable<{ reports: any[] }> {
    return this.http.get<{ reports: any[] }>(`${this.apiUrl}/api/reports`);
  }

  getReportData(reportId: string): Observable<{ report: any }> {
    return this.http.get<{ report: any }>(`${this.apiUrl}/api/reports/${reportId}`);
  }

  exportReport(
    reportId: string,
    format: 'json' | 'csv' | 'pdf'
  ): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/api/reports/${reportId}/export/${format}`, {
      responseType: 'blob',
      observe: 'response',
    });
  }
}
