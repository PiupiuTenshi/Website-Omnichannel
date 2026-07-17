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
      setErrorMessage("Vui lòng nhập email hoặc số điện thoại và mật khẩu.");
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
      setErrorMessage(error instanceof ApiError ? error.message : "Không thể đăng nhập vào lúc này.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page app-container" aria-labelledby="login-heading">
      <div className="auth-card">
        <header className="auth-card__header">
          <h1 className="auth-card__title" id="login-heading">Đăng nhập</h1>
          <p className="auth-card__description">Sử dụng địa chỉ email hoặc số điện thoại đã xác thực của bạn.</p>
        </header>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="auth-form__field" htmlFor="login-identifier">
            <span>Email hoặc số điện thoại</span>
            <input className="auth-form__input" id="login-identifier" value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" />
          </label>
          <label className="auth-form__field" htmlFor="login-password">
            <span>Mật khẩu</span>
            <input className="auth-form__input" id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
          </label>
          {errorMessage && <p className="auth-form__message" role="alert">{errorMessage}</p>}
          <button className="auth-form__submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang đăng nhập…" : "Đăng nhập"}</button>
        </form>
        <p className="auth-card__footer">Nếu chưa có tài khoản, <Link to="/register">đăng ký ngay</Link>.</p>
      </div>
    </section>
  );
}
