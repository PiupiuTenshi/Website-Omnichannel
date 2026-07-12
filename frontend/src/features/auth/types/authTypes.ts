export type UserRole = "Admin" | "Manager" | "Seller" | "Buyer";

export interface AuthSessionResponse {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
}

export interface AuthSession extends AuthSessionResponse {
  roles: UserRole[];
}

export interface RegistrationResponse {
  userId: string;
  requiresEmailVerification: boolean;
  requiresPhoneVerification: boolean;
}

export interface RegisterPayload {
  email: string;
  phoneNumber: string;
  password: string;
}
