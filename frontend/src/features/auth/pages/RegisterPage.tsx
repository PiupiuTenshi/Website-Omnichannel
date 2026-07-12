import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../../../shared/api/apiClient";
import { useAuth } from "../hooks/useAuth";
import "./AuthPage.css";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [regMethod, setRegMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (regMethod === "email" && !email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (regMethod === "phone" && !phoneNumber.trim()) {
      setErrorMessage("Please enter your phone number.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must contain at least eight characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await register({
        email: regMethod === "email" ? email : "",
        phoneNumber: regMethod === "phone" ? phoneNumber : "",
        password
      });
      navigate(`/verify?userId=${encodeURIComponent(response.userId)}`, { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Unable to create your account right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page app-container" aria-labelledby="register-heading">
      <div className="auth-card">
        <header className="auth-card__header">
          <h1 className="auth-card__title" id="register-heading">Create account</h1>
          <p className="auth-card__description">Choose your registration method below.</p>
        </header>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={regMethod === "email"}
            className={`auth-tabs__tab ${regMethod === "email" ? "auth-tabs__tab--active" : ""}`}
            onClick={() => {
              setRegMethod("email");
              setPhoneNumber("");
              setErrorMessage("");
            }}
          >
            Email
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={regMethod === "phone"}
            className={`auth-tabs__tab ${regMethod === "phone" ? "auth-tabs__tab--active" : ""}`}
            onClick={() => {
              setRegMethod("phone");
              setEmail("");
              setErrorMessage("");
            }}
          >
            Phone Number
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {regMethod === "email" ? (
            <label className="auth-form__field" htmlFor="register-email">
              <span>Email address</span>
              <input
                className="auth-form__input"
                id="register-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>
          ) : (
            <label className="auth-form__field" htmlFor="register-phone">
              <span>Phone number</span>
              <input
                className="auth-form__input"
                id="register-phone"
                type="tel"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                autoComplete="tel"
                required
              />
            </label>
          )}
          <label className="auth-form__field" htmlFor="register-password">
            <span>Password</span>
            <input
              className="auth-form__input"
              id="register-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          {errorMessage && <p className="auth-form__message" role="alert">{errorMessage}</p>}
          <button className="auth-form__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="auth-card__footer">Already have an account? <Link to="/login">Sign in</Link>.</p>
      </div>
    </section>
  );
}
