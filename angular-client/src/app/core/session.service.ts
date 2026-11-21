import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, firstValueFrom, of } from 'rxjs';
import { apiBaseUrl } from './api.config';
import { ApiService } from './api.service';
import { AuthSession, DirectAuthResponse, UserRole } from './models';

const AUTH_KEY = 'grocery-store.auth-session';
const CART_KEY = 'grocery-store-cart-session';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly api = inject(ApiService);
  private readonly workerSession = apiBaseUrl === '/api';
  private readonly state = signal<AuthSession | null>(null);
  private accessToken: string | null = null;
  private expirationTimer?: ReturnType<typeof setTimeout>;
  readonly session = this.state.asReadonly();
  readonly isAuthenticated = computed(() => this.state() !== null);
  readonly roles = computed(() => this.state()?.roles ?? []);
  readonly username = computed(() => this.state()?.username ?? '');
  readonly endingSession = signal(false);
  readonly logoutError = signal('');

  async restore(): Promise<void> {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {
      // The session can still be restored when browser storage is unavailable.
    }
    if (!this.workerSession) return;
    const session = await firstValueFrom(this.api.restoreSession().pipe(catchError(() => of(null))));
    if (session) this.setSession(session);
  }

  setSession(response: AuthSession | DirectAuthResponse): void {
    const expiresAt = Date.parse(response.accessTokenExpiresAtUtc);
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return;
    clearTimeout(this.expirationTimer);

    if ('accessToken' in response) {
      const claims = this.claimsFromJwt(response.accessToken);
      const role = claims['role'] ?? claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      const roles = [role].flat().filter((value): value is UserRole => ['Admin', 'Manager', 'Seller', 'Buyer'].includes(String(value)));
      const username = String(claims['unique_name'] ?? claims['name'] ?? claims['sub'] ?? '');
      this.accessToken = response.accessToken;
      this.state.set({ accessTokenExpiresAtUtc: response.accessTokenExpiresAtUtc, roles, username });
    } else {
      this.accessToken = null;
      this.state.set(response);
    }

    this.expirationTimer = setTimeout(() => this.resetSession(), expiresAt - Date.now());
  }

  async clearSession(): Promise<boolean> {
    if (this.endingSession()) return false;
    this.endingSession.set(true);
    this.logoutError.set('');
    try {
      if (this.workerSession) await firstValueFrom(this.api.endSession());
      this.resetSession();
      return true;
    } catch {
      this.logoutError.set('Không thể đăng xuất. Vui lòng thử lại.');
      return false;
    } finally {
      this.endingSession.set(false);
    }
  }

  private resetSession(): void {
    clearTimeout(this.expirationTimer);
    this.accessToken = null;
    this.state.set(null);
  }

  validToken(): string | null {
    const value = this.state();
    return value && Date.parse(value.accessTokenExpiresAtUtc) > Date.now() ? this.accessToken : null;
  }

  hasRole(roles: UserRole | UserRole[]): boolean {
    const targets = Array.isArray(roles) ? roles : [roles];
    return targets.some(role => this.roles().includes(role));
  }

  cartSessionId(): string {
    const current = localStorage.getItem(CART_KEY);
    if (current) return current;
    const id = crypto.randomUUID();
    localStorage.setItem(CART_KEY, id);
    return id;
  }

  private claimsFromJwt(token: string): Record<string, unknown> {
    try {
      return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
}
