import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth";
import { changePassword, confirmContactChange, getAccountProfile, getMyOrders, requestContactChange, updateAccountProfile } from "../api/accountApi";
import type { AccountProfile } from "../types/accountTypes";
import type { OnlineOrder } from "../../checkout/api/onlineOrdersApi";
import "./AccountPage.css";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export function AccountPage() {
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? "";
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [defaultDeliveryAddress, setDefaultDeliveryAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [contactChannel, setContactChannel] = useState<"Email" | "Phone" | null>(null);
  const [newContactValue, setNewContactValue] = useState("");
  const [contactChangeCode, setContactChangeCode] = useState("");
  const [isChangingContact, setIsChangingContact] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 4800);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (!accessToken) return;
    Promise.all([getAccountProfile(accessToken), getMyOrders(accessToken)])
      .then(([loadedProfile, loadedOrders]) => {
        setProfile(loadedProfile);
        setDisplayName(loadedProfile.displayName ?? "");
        setDefaultDeliveryAddress(loadedProfile.defaultDeliveryAddress ?? "");
        setEmail(loadedProfile.email ?? "");
        setPhoneNumber(loadedProfile.phoneNumber ?? "");
        setOrders(loadedOrders);
      })
      .catch((requestError: Error) => setError(requestError.message));
  }, [accessToken]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);
    try {
      const updatedProfile = await updateAccountProfile(accessToken, { displayName, defaultDeliveryAddress });
      setProfile(updatedProfile);
      setMessage("Đã cập nhật thông tin cá nhân.");
      setIsEditing(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể cập nhật thông tin.");
    } finally {
      setIsSaving(false);
    }
  }

  async function requestChange(channel: "Email" | "Phone", value: string) {
    if (!value.trim()) {
      setError(`Nhập ${channel === "Email" ? "email" : "số điện thoại"} mới trước khi gửi mã.`);
      return;
    }
    setError("");
    setMessage("");
    setIsChangingContact(true);
    try {
      const result = await requestContactChange(accessToken, channel, value);
      setContactChannel(channel);
      setNewContactValue(value);
      setMessage(`Đã gửi OTP đến ${result.verificationChannel === "Email" ? "email cũ đã xác minh" : "số điện thoại cũ đã xác minh"}.`);
      return;
      setMessage(`Đã gửi OTP đến ${channel === "Email" ? "email mới" : "số điện thoại mới"}.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể gửi mã xác nhận.");
    } finally {
      setIsChangingContact(false);
    }
  }

  async function confirmChange() {
    if (contactChannel === null || !contactChangeCode.trim()) return;
    setError("");
    setMessage("");
    setIsChangingContact(true);
    try {
      const updatedProfile = await confirmContactChange(accessToken, contactChannel, contactChangeCode);
      setProfile(updatedProfile);
      setEmail(updatedProfile.email ?? "");
      setPhoneNumber(updatedProfile.phoneNumber ?? "");
      setContactChannel(null);
      setNewContactValue("");
      setContactChangeCode("");
      setMessage("Đã cập nhật và xác minh contact thành công.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "OTP không hợp lệ hoặc đã hết hạn.");
    } finally {
      setIsChangingContact(false);
    }
  }

  async function submitPasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (newPassword.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Xác nhận mật khẩu mới chưa khớp.");
      return;
    }

    try {
      setIsChangingPassword(true);
      await changePassword(accessToken, currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setMessage("Đã đổi mật khẩu thành công.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể đổi mật khẩu.");
    } finally {
      setIsChangingPassword(false);
    }
  }

  if (profile === null && !error) {
    return <main className="account-page app-container"><p>Đang tải tài khoản…</p></main>;
  }

  const hasUnverifiedContactChange = email !== (profile?.email ?? "") || phoneNumber !== (profile?.phoneNumber ?? "");

  return (
    <main className="account-page app-container">
      <header className="account-page__header">
        <p className="account-page__eyebrow">Tài khoản</p>
        <h1>Thông tin cá nhân và đơn hàng</h1>
        <p>Mọi vai trò đều có hồ sơ riêng. Đơn hiển thị dưới đây là đơn online do chính tài khoản này đặt.</p>
      </header>
      {error && <p className="account-page__notice account-page__notice--error" role="alert">{error}</p>}
      {message && <div className="account-page__toast" role="status">{message}</div>}

      <div className="account-page__grid">
        <section className="account-page__card" aria-labelledby="profile-heading">
          <h2 id="profile-heading">Hồ sơ</h2>
          <form className="account-page__form" onSubmit={submit}>
            <label><span>Họ tên hiển thị</span><input value={displayName} maxLength={120} onChange={(event) => setDisplayName(event.target.value)} placeholder="Nhập họ tên" readOnly={!isEditing} /></label>
            
            <label><span>Email đã xác minh</span>
              <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                <input style={{ flex: 1 }} value={email} onChange={(e) => {
                  setEmail(e.target.value);
                  if (contactChannel === "Email") setContactChannel(null);
                }} readOnly={!isEditing} placeholder="Chưa cập nhật" />
                {isEditing && email !== (profile?.email ?? "") && email !== newContactValue && (
                  <button type="button" className="btn-outline" style={{ whiteSpace: "nowrap" }} disabled={isChangingContact} onClick={() => void requestChange("Email", email)}>
                    Gửi OTP
                  </button>
                )}
              </div>
            </label>
            {contactChannel === "Email" && email === newContactValue && (
              <div className="account-page__otp">
                <label><span>Nhập OTP gửi tới {newContactValue}</span><input inputMode="numeric" maxLength={6} value={contactChangeCode} onChange={(e) => setContactChangeCode(e.target.value)} /></label>
                <button type="button" className="btn-primary" disabled={isChangingContact || !contactChangeCode.trim()} onClick={() => void confirmChange()}>Xác nhận</button>
              </div>
            )}

            <label><span>Số điện thoại đã xác minh</span>
              <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                <input style={{ flex: 1 }} value={phoneNumber} onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (contactChannel === "Phone") setContactChannel(null);
                }} readOnly={!isEditing} placeholder="Chưa cập nhật" />
                {isEditing && phoneNumber !== (profile?.phoneNumber ?? "") && phoneNumber !== newContactValue && (
                  <button type="button" className="btn-outline" style={{ whiteSpace: "nowrap" }} disabled={isChangingContact} onClick={() => void requestChange("Phone", phoneNumber)}>
                    Gửi OTP
                  </button>
                )}
              </div>
            </label>
            {contactChannel === "Phone" && phoneNumber === newContactValue && (
              <div className="account-page__otp">
                <label><span>Nhập OTP gửi tới {newContactValue}</span><input inputMode="numeric" maxLength={6} value={contactChangeCode} onChange={(e) => setContactChangeCode(e.target.value)} /></label>
                <button type="button" className="btn-primary" disabled={isChangingContact || !contactChangeCode.trim()} onClick={() => void confirmChange()}>Xác nhận</button>
              </div>
            )}

            <label><span>Địa chỉ giao hàng mặc định</span><textarea value={defaultDeliveryAddress} maxLength={300} rows={4} onChange={(event) => setDefaultDeliveryAddress(event.target.value)} placeholder="Số nhà, đường, phường/xã, quận/huyện…" readOnly={!isEditing} /></label>
            <p className="account-page__hint">Email và số điện thoại là thông tin đăng nhập đã xác minh; thay đổi chúng cần một luồng xác minh riêng để bảo vệ tài khoản.</p>

            {isEditing && hasUnverifiedContactChange && (
              <p className="account-page__hint" style={{ color: "var(--color-danger)" }}>Vui lòng Gửi OTP và Xác nhận để đổi thông tin liên hệ, hoặc đổi lại như cũ/ấn Hủy để tiếp tục.</p>
            )}
            {isEditing ? (
              <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                <button type="submit" className="btn-primary" disabled={isSaving || hasUnverifiedContactChange}>{isSaving ? "Đang lưu…" : "Lưu thông tin"}</button>
                <button type="button" className="btn-outline" onClick={() => {
                  setIsEditing(false);
                  setDisplayName(profile?.displayName ?? "");
                  setDefaultDeliveryAddress(profile?.defaultDeliveryAddress ?? "");
                  setEmail(profile?.email ?? "");
                  setPhoneNumber(profile?.phoneNumber ?? "");
                  setNewContactValue("");
                  setContactChangeCode("");
                  setContactChannel(null);
                  setError("");
                }}>Hủy</button>
              </div>
            ) : (
              <button type="button" className="btn-primary" onClick={(e) => { e.preventDefault(); setIsEditing(true); }}>Chỉnh sửa thông tin cá nhân</button>
            )}
          </form>
        </section>

        <section className="account-page__card" aria-labelledby="orders-heading">
          <h2 id="orders-heading">Đơn hàng của tôi</h2>
          {orders.length === 0 ? <p className="account-page__empty">Chưa có đơn online nào gắn với tài khoản này.</p> : (
            <ul className="account-page__orders">
              {orders.map((order) => <li key={order.onlineOrderId}>
                <div><strong>{order.orderCode}</strong><span>{new Date(order.createdAtUtc).toLocaleString("vi-VN")}</span></div>
                <div><span className="account-page__status">{order.status}</span><strong>{money.format(order.total)}</strong></div>
                <Link to={`/orders/${order.onlineOrderId}`}>Xem chi tiết</Link>
              </li>)}
            </ul>
          )}
        </section>

        <section className="account-page__card" aria-labelledby="password-heading">
          <h2 id="password-heading">Đổi mật khẩu</h2>
          <form className="account-page__form" onSubmit={submitPasswordChange}>
            <label><span>Mật khẩu hiện tại</span><input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></label>
            <label><span>Mật khẩu mới</span><input type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></label>
            <label><span>Xác nhận mật khẩu mới</span><input type="password" autoComplete="new-password" minLength={8} value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} required /></label>
            <button type="submit" className="btn-primary" disabled={isChangingPassword}>{isChangingPassword ? "Đang đổi…" : "Đổi mật khẩu"}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
