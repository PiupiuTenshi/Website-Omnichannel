import { requestJson } from "../../../shared/api/apiClient";
import type {
  AuthSessionResponse,
  RegisterPayload,
  RegistrationResponse
} from "../types/authTypes";

export function registerAccount(payload: RegisterPayload): Promise<RegistrationResponse> {
  return requestJson<RegistrationResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email.trim() || null,
      phoneNumber: payload.phoneNumber.trim() || null,
      password: payload.password
    })
  });
}

export function loginAccount(identifier: string, password: string): Promise<AuthSessionResponse> {
  return requestJson<AuthSessionResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier: identifier.trim(), password })
  });
}

export function logoutAccount(refreshToken: string): Promise<void> {
  return requestJson<void>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken })
  });
}

export function confirmEmail(userId: string, token: string): Promise<void> {
  return requestJson<void>("/auth/confirm-email", {
    method: "POST",
    body: JSON.stringify({ userId, token: token.trim() })
  });
}

export function confirmPhone(userId: string, code: string): Promise<void> {
  return requestJson<void>("/auth/confirm-phone", {
    method: "POST",
    body: JSON.stringify({ userId, code: code.trim() })
  });
}

export function requestPasswordReset(identifier: string, resetUrl: string): Promise<void> {
  return requestJson<void>("/auth/password-resets", {
    method: "POST",
    body: JSON.stringify({ identifier: identifier.trim(), resetUrl })
  });
}

export function resetPassword(userId: string, token: string, newPassword: string): Promise<void> {
  return requestJson<void>("/auth/password-resets/confirm", {
    method: "POST",
    body: JSON.stringify({ userId, token, newPassword })
  });
}
