import { useCallback, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { confirmEmail, confirmPhone, loginAccount, logoutAccount, registerAccount } from "../api/authApi";
import { mergeGuestCart, startNewGuestCartSession } from "../../cart";
import type { AuthSession, RegisterPayload } from "../types/authTypes";
import { AuthContext } from "./authContext";
import { createAuthSession, loadAuthSession, saveAuthSession } from "./authSession";
import type { AuthContextValue } from "./authContext";

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(loadAuthSession);

  const register = useCallback((payload: RegisterPayload) => registerAccount(payload), []);

  const login = useCallback(async (identifier: string, password: string) => {
    const response = await loginAccount(identifier, password);
    const nextSession = createAuthSession(response);
    saveAuthSession(nextSession);
    setSession(nextSession);
    try {
      await mergeGuestCart(nextSession.accessToken);
    } catch {
      // A failed merge must not prevent a verified user from signing in.
    } finally {
      startNewGuestCartSession();
    }
  }, []);

  const logout = useCallback(async () => {
    if (session !== null) {
      try {
        await logoutAccount(session.refreshToken);
      } finally {
        saveAuthSession(null);
        setSession(null);
        startNewGuestCartSession();
      }
    }
  }, [session]);

  const verifyEmail = useCallback((userId: string, token: string) => confirmEmail(userId, token), []);
  const verifyPhone = useCallback((userId: string, code: string) => confirmPhone(userId, code), []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, register, login, logout, verifyEmail, verifyPhone }),
    [session, register, login, logout, verifyEmail, verifyPhone]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
