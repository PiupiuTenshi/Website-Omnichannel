import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/authApi";
import "./AuthPage.css";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userId = searchParams.get("userId") ?? "";
  const token = searchParams.get("token") ?? "";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || !token) {
      setError("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu mới chưa khớp.");
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);
      await resetPassword(userId, token, newPassword);
      setCompleted(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể đặt lại mật khẩu.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return <section className="auth-page app-container" aria-labelledby="reset-password-heading">
    <div className="auth-card">
      <header className="auth-card__header">
        <h1 className="auth-card__title" id="reset-password-heading">Đặt lại mật khẩu</h1>
        <p className="auth-card__description">Tạo mật khẩu mới cho tài khoản của bạn.</p>
      </header>
      {completed ? <><p className="auth-form__message auth-form__message--success" role="status">Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.</p><p className="auth-card__footer"><Link to="/login">Đăng nhập</Link></p></> : <form className="auth-form" onSubmit={(event) => void submit(event)} noValidate>
        <label className="auth-form__field" htmlFor="new-password"><span>Mật khẩu mới</span><input className="auth-form__input" id="new-password" type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
        <label className="auth-form__field" htmlFor="confirm-password"><span>Xác nhận mật khẩu mới</span><input className="auth-form__input" id="confirm-password" type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
        {error && <p className="auth-form__message" role="alert">{error}</p>}
        <button className="auth-form__submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang cập nhật…" : "Đặt lại mật khẩu"}</button>
      </form>}
    </div>
  </section>;
}
