import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ApiError } from "../../../shared/api/apiClient";
import { useAuth } from "../hooks/useAuth";
import "./AuthPage.css";

export function VerifyAccountPage() {
  const { verifyEmail, verifyPhone } = useAuth();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId") ?? "";
  const [emailToken, setEmailToken] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleVerification(kind: "email" | "phone", event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setMessage("");

    if (!userId) {
      setErrorMessage("The verification link is missing an account identifier. Register again or request support.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (kind === "email") {
        await verifyEmail(userId, emailToken);
      } else {
        await verifyPhone(userId, phoneCode);
      }
      setMessage("Verification completed. You can now sign in.");
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Verification could not be completed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page app-container" aria-labelledby="verify-heading">
      <div className="auth-card">
        <header className="auth-card__header">
          <h1 className="auth-card__title" id="verify-heading">Verify account</h1>
          <p className="auth-card__description">Verify either a registered email address or phone number before signing in.</p>
        </header>
        {errorMessage && <p className="auth-form__message" role="alert">{errorMessage}</p>}
        {message && <p className="auth-form__message auth-form__message--success" role="status">{message}</p>}
        <div className="auth-verify-grid">
          <form className="auth-form" onSubmit={(event) => handleVerification("email", event)} noValidate>
            <label className="auth-form__field" htmlFor="email-token">
              <span>Email verification token</span>
              <input className="auth-form__input" id="email-token" value={emailToken} onChange={(event) => setEmailToken(event.target.value)} />
            </label>
            <button className="auth-form__submit" type="submit" disabled={isSubmitting || !emailToken.trim()}>Verify email</button>
          </form>
          <form className="auth-form" onSubmit={(event) => handleVerification("phone", event)} noValidate>
            <label className="auth-form__field" htmlFor="phone-code">
              <span>SMS verification code</span>
              <input className="auth-form__input" id="phone-code" inputMode="numeric" value={phoneCode} onChange={(event) => setPhoneCode(event.target.value)} />
            </label>
            <button className="auth-form__submit" type="submit" disabled={isSubmitting || !phoneCode.trim()}>Verify phone</button>
          </form>
        </div>
        <p className="auth-card__footer"><Link to="/login">Back to sign in</Link>.</p>
      </div>
    </section>
  );
}
