import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../../../shared/api/apiClient";
import { useAuth } from "../hooks/useAuth";
import "./AuthPage.css";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!email.trim() && !phoneNumber.trim()) {
      setErrorMessage("Nhập ít nhất email hoặc số điện thoại để đăng nhập và nhận mã xác minh.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Mật khẩu phải chứa ít nhất 8 ký tự.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await register({
        email,
        phoneNumber,
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
          <p className="auth-card__description">Nhập ít nhất email hoặc số điện thoại. Số điện thoại có thể dùng để đăng nhập khi không có email.</p>
        </header>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="auth-form__field" htmlFor="register-email">
            <span>Địa chỉ email (tùy chọn)</span>
            <input className="auth-form__input" id="register-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
          </label>
          <label className="auth-form__field" htmlFor="register-phone">
            <span>Số điện thoại (tùy chọn, dùng để đăng nhập nếu không có email)</span>
            <input className="auth-form__input" id="register-phone" type="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} autoComplete="tel" />
          </label>
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
