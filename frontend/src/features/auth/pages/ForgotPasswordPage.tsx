import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../api/authApi";
import "./AuthPage.css";

export function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!identifier.trim()) {
      setError("Nhập email hoặc số điện thoại đã xác minh.");
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);
      await requestPasswordReset(identifier, `${window.location.origin}/reset-password`);
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể gửi yêu cầu đặt lại mật khẩu.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return <section className="auth-page app-container" aria-labelledby="forgot-password-heading">
    <div className="auth-card">
      <header className="auth-card__header">
        <h1 className="auth-card__title" id="forgot-password-heading">Quên mật khẩu</h1>
        <p className="auth-card__description">Nhập email hoặc số điện thoại đã xác minh để nhận liên kết đặt lại mật khẩu.</p>
      </header>
      {submitted ? <p className="auth-form__message auth-form__message--success" role="status">Nếu thông tin hợp lệ, liên kết đặt lại mật khẩu đã được gửi đến phương thức liên hệ đã xác minh.</p> : <form className="auth-form" onSubmit={(event) => void submit(event)} noValidate>
        <label className="auth-form__field" htmlFor="reset-identifier">
          <span>Email hoặc số điện thoại</span>
          <input className="auth-form__input" id="reset-identifier" autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
        </label>
        {error && <p className="auth-form__message" role="alert">{error}</p>}
        <button className="auth-form__submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang gửi…" : "Gửi liên kết đặt lại"}</button>
      </form>}
      <p className="auth-card__footer"><Link to="/login">Quay lại đăng nhập</Link></p>
    </div>
  </section>;
}
