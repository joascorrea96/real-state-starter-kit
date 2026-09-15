import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { API_BASE_URL } from '@web-systems/core-data';
import { Observable, tap } from 'rxjs';
import { CurrentUser, LoginRequest, LoginResponse } from './models/auth.model';

const STORAGE_KEY = 'web_systems_auth';

/**
 * Single auth service shared by every vertical app. Login endpoint and
 * token shape are the same regardless of which business the logged-in
 * user belongs to — the company/role come back inside the JWT claims
 * and are echoed in the login response for convenience.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly tokenSignal = signal<string | null>(this.readStoredToken());
  private readonly currentUserSignal = signal<CurrentUser | null>(this.readStoredUser());

  readonly token = this.tokenSignal.asReadonly();
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => {
    const user = this.currentUserSignal();
    if (!user) return false;
    return new Date(user.tokenExpiresAt).getTime() > Date.now();
  });

  login(request: LoginRequest, rememberMe: boolean = false): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, request).pipe(
      tap((response) => this.persistSession(response, rememberMe)),
    );
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  }

  private persistSession(response: LoginResponse, rememberMe: boolean): void {
    const user: CurrentUser = {
      name: response.name,
      role: response.role,
      companyId: response.companyId,
      tokenExpiresAt: response.expiresAt,
    };

    this.tokenSignal.set(response.token);
    this.currentUserSignal.set(user);

    const dataString = JSON.stringify({ token: response.token, user });
    
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY, dataString);
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, dataString);
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private readStoredToken(): string | null {
    return this.readStoredSession()?.token ?? null;
  }

  private readStoredUser(): CurrentUser | null {
    return this.readStoredSession()?.user ?? null;
  }

  private readStoredSession(): { token: string; user: CurrentUser } | null {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}
