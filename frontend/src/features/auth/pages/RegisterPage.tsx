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
      setErrorMessage("Vui lòng nhập địa chỉ email của bạn.");
      return;
    }

    if (regMethod === "phone" && !phoneNumber.trim()) {
      setErrorMessage("Vui lòng nhập số điện thoại của bạn.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Mật khẩu phải chứa ít nhất 8 ký tự.");
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
      setErrorMessage(error instanceof ApiError ? error.message : "Không thể tạo tài khoản vào lúc này.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page app-container" aria-labelledby="register-heading">
      <div className="auth-card">
        <header className="auth-card__header">
          <h1 className="auth-card__title" id="register-heading">Đăng ký tài khoản</h1>
          <p className="auth-card__description">Chọn phương thức đăng ký bên dưới.</p>
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
            Số điện thoại
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {regMethod === "email" ? (
            <label className="auth-form__field" htmlFor="register-email">
              <span>Địa chỉ Email</span>
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
              <span>Số điện thoại</span>
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
            <span>Mật khẩu</span>
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
            {isSubmitting ? "Đang đăng ký…" : "Đăng ký"}
          </button>
        </form>
        <p className="auth-card__footer">Đã có tài khoản? <Link to="/login">Đăng nhập</Link>.</p>
      </div>
    </section>
  );
}
