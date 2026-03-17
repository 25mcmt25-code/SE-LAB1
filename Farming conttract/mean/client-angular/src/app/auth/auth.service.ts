import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export type UserRole = 'farmer' | 'buyer';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  desiredCrops?: string[];
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

export interface PublicFarmerProfile {
  id: string;
  name: string;
  email: string;
  role: 'farmer';
  region: string;
  crops: string[];
  bio: string;
}

export interface PublicBuyerProfile {
  id: string;
  name: string;
  email: string;
  role: 'buyer';
  desiredCrops: string[];
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

  browseFarmers(): Observable<{ profiles: PublicFarmerProfile[] }> {
    return this.http.get<{ profiles: PublicFarmerProfile[] }>(`${this.apiUrl}/api/profile-browse/farmers`);
  }

  browseBuyers(): Observable<{ profiles: PublicBuyerProfile[] }> {
    return this.http.get<{ profiles: PublicBuyerProfile[] }>(`${this.apiUrl}/api/profile-browse/buyers`);
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
}
