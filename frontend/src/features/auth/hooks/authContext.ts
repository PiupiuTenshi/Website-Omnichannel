import { createContext } from "react";
import type { AuthSession, RegisterPayload, RegistrationResponse } from "../types/authTypes";

export interface AuthContextValue {
  session: AuthSession | null;
  register: (payload: RegisterPayload) => Promise<RegistrationResponse>;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (userId: string, token: string) => Promise<void>;
  verifyPhone: (userId: string, code: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
