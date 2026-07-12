import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../../../shared/api/apiClient";
import { useAuth } from "../hooks/useAuth";
import "./AuthPage.css";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!identifier.trim() || !password) {
      setErrorMessage("Enter your email or phone number and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(identifier, password);
      const from = typeof location.state === "object" && location.state !== null && "from" in location.state
        ? String(location.state.from)
        : "/";
      navigate(from, { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Unable to sign in right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page app-container" aria-labelledby="login-heading">
      <div className="auth-card">
        <header className="auth-card__header">
          <h1 className="auth-card__title" id="login-heading">Sign in</h1>
          <p className="auth-card__description">Use your verified email address or phone number.</p>
        </header>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="auth-form__field" htmlFor="login-identifier">
            <span>Email or phone number</span>
            <input className="auth-form__input" id="login-identifier" value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" />
          </label>
          <label className="auth-form__field" htmlFor="login-password">
            <span>Password</span>
            <input className="auth-form__input" id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
          </label>
          {errorMessage && <p className="auth-form__message" role="alert">{errorMessage}</p>}
          <button className="auth-form__submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="auth-card__footer">Need an account? <Link to="/register">Register now</Link>.</p>
      </div>
    </section>
  );
}
