import type { AuthSession, AuthSessionResponse, UserRole } from "../types/authTypes";

const SESSION_STORAGE_KEY = "grocery-store.auth-session";
const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

export function createAuthSession(response: AuthSessionResponse): AuthSession {
  return {
    ...response,
    roles: readRoles(response.accessToken)
  };
}

export function loadAuthSession(): AuthSession | null {
  const serializedSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (serializedSession === null) {
    return null;
  }

  try {
    const session = JSON.parse(serializedSession) as AuthSession;
    return new Date(session.accessTokenExpiresAtUtc) > new Date() ? session : null;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession | null): void {
  if (session === null) {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function readRoles(accessToken: string): UserRole[] {
  const tokenParts = accessToken.split(".");
  if (tokenParts.length !== 3) {
    return [];
  }

  try {
    const payload = JSON.parse(decodeBase64Url(tokenParts[1])) as Record<string, unknown>;
    const roleValue = payload[ROLE_CLAIM] ?? payload.role;
    const roles = Array.isArray(roleValue) ? roleValue : [roleValue];
    return roles.filter(isUserRole);
  } catch {
    return [];
  }
}

function decodeBase64Url(value: string): string {
  const paddedValue = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return atob(paddedValue);
}

function isUserRole(value: unknown): value is UserRole {
  return value === "Admin" || value === "Manager" || value === "Seller" || value === "Buyer";
}
