import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth";
import { getPublicStoreSettings } from "../features/admin/api/storeSettingsApi";
import type { StoreSettings } from "../features/admin/types/storeSettingsTypes";

export function PublicLayout() {
  const { session, logout } = useAuth();
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    getPublicStoreSettings()
      .then(setStoreSettings)
      .catch(() => {});
  }, []);

  const getDashboardPath = () => {
    if (!session) return null;
    if (session.roles.includes("Admin")) return "/admin/dashboard";
    if (session.roles.includes("Manager")) return "/manager/dashboard";
    if (session.roles.includes("Seller")) return "/seller/dashboard";
    return null;
  };

  const dashboardPath = getDashboardPath();
  const storeName = storeSettings?.name || "Chợ Xanh";
  const hotline = storeSettings?.contactNumbers?.[0] || "1900 6868";

  return (
    <div className="public-layout">
      {/* Top Banner */}
      <div className="public-layout__top-banner">
        <div className="app-container banner-content">
          <span>🎉 Miễn phí giao hàng cho đơn từ 99.000đ</span>
          <span>Hotline: {hotline}</span>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="public-layout__header glass-panel">
        <div className="app-container public-layout__header-content">
          <Link className="public-layout__brand" to="/">
            <span className="brand-icon">🥬</span> {storeName}
          </Link>
          
          <nav className="public-layout__navigation" aria-label="Account navigation">
            <Link className="nav-link" to="/">Sản phẩm</Link>
            <Link className="nav-link" to="/cart">Giỏ hàng</Link>
            {dashboardPath && (
              <Link className="nav-link" to={dashboardPath}>Quản trị</Link>
            )}
            {session === null ? (
              <Link className="btn-primary hover-lift" to="/login">Đăng nhập</Link>
            ) : (
              <button className="btn-outline hover-lift" type="button" onClick={() => void logout()}>Đăng xuất</button>
            )}
          </nav>
        </div>
      </header>

      <main className="public-layout__main">
        <Outlet context={storeSettings} />
      </main>
      
      <footer className="public-layout__footer">
        <div className="app-container footer-content">
          <div className="footer-brand">
            <h3>{storeName}</h3>
            <p>Nông sản sạch & Nhu yếu phẩm tươi ngon mỗi ngày.</p>
            {storeSettings?.address && (
              <p className="footer-info" style={{ marginTop: 'var(--space-xs)', fontSize: '0.9rem' }}>
                📍 Địa chỉ: {storeSettings.address}
              </p>
            )}
            {storeSettings?.email && (
              <p className="footer-info" style={{ marginTop: '4px', fontSize: '0.9rem' }}>
                ✉️ Email: {storeSettings.email}
              </p>
            )}
          </div>
          <div className="footer-links">
            <Link to="/">Về chúng tôi</Link>
            <Link to="/">Cửa hàng</Link>
            <Link to="/">Liên hệ</Link>
          </div>
          <div className="footer-copyright">
            © 2026 {storeName}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
