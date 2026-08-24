import { Injectable, computed, signal } from '@angular/core';
import { AuthSession, UserRole } from './models';

const AUTH_KEY = 'grocery-store.auth-session';
const CART_KEY = 'grocery-store-cart-session';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly state = signal<AuthSession | null>(this.readAuth());
  readonly session = this.state.asReadonly();
  readonly isAuthenticated = computed(() => this.validToken() !== null);
  readonly roles = computed(() => this.state()?.roles ?? []);

  readonly username = computed(() => {
    const token = this.state()?.accessToken;
    if (!token) return '';
    try {
      const data = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>;
      return String(data['sub'] ?? data['name'] ?? data['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ?? 'Nhân viên');
    } catch {
      return 'Nhân viên';
    }
  });

  setSession(session: Omit<AuthSession, 'roles'>): void {
    const full = { ...session, roles: this.rolesFromJwt(session.accessToken) };
    localStorage.setItem(AUTH_KEY, JSON.stringify(full));
    this.state.set(full);
  }

  clearSession(): void {
    localStorage.removeItem(AUTH_KEY);
    this.state.set(null);
  }

  validToken(): string | null {
    const value = this.state();
    return value && new Date(value.accessTokenExpiresAtUtc) > new Date() ? value.accessToken : null;
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

  private readAuth(): AuthSession | null {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY) ?? 'null') as AuthSession | null;
    } catch {
      return null;
    }
  }

  private rolesFromJwt(token: string): UserRole[] {
    try {
      const data = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>;
      const raw = data['role'] ?? data['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? [];
      return (Array.isArray(raw) ? raw : [raw]).filter((role): role is UserRole => ['Admin', 'Manager', 'Seller', 'Buyer'].includes(String(role)));
    } catch {
      return [];
    }
  }
}
