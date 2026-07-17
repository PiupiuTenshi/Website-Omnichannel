import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth";
import { getPublicStoreSettings } from "../features/admin/api/storeSettingsApi";
import type { StoreSettings } from "../features/admin/types/storeSettingsTypes";
import "./DashboardLayout.css";

export function DashboardLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    getPublicStoreSettings()
      .then(setStoreSettings)
      .catch(() => {});
  }, []);

  if (session === null) {
    return null;
  }

  const roles = session.roles;
  const hasAdmin = roles.includes("Admin");
  const hasManager = roles.includes("Manager");
  const hasSeller = roles.includes("Seller");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="dashboard-layout__overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside className={`dashboard-layout__sidebar ${isSidebarOpen ? "dashboard-layout__sidebar--open" : ""}`}>
        <div className="dashboard-layout__brand">
          <Link to="/" className="dashboard-layout__brand-link" onClick={() => setIsSidebarOpen(false)}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>{storeSettings?.name || "Tạp hóa chị Tỏ"}</span>
          </Link>
          <div className="dashboard-layout__role-tag">Hệ Thống Quản Trị</div>
        </div>

        <nav className="dashboard-layout__nav" aria-label="Sidebar navigation">
          {/* Admin Section */}
          {hasAdmin && (
            <div className="dashboard-layout__nav-section">
              <h3 className="dashboard-layout__nav-title">Admin</h3>
              <NavLink
                to="/admin/dashboard"
                className={({ isActive }) => `dashboard-layout__nav-link ${isActive ? "dashboard-layout__nav-link--active" : ""}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="9" />
                  <rect x="14" y="3" width="7" height="5" />
                  <rect x="14" y="12" width="7" height="9" />
                  <rect x="3" y="16" width="7" height="5" />
                </svg>
                <span>Dashboard Admin</span>
              </NavLink>
              <NavLink
                to="/manager/store-settings"
                className={({ isActive }) => `dashboard-layout__nav-link ${isActive ? "dashboard-layout__nav-link--active" : ""}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>Cấu hình cửa hàng</span>
              </NavLink>
              <NavLink
                to="/admin/users"
                className={({ isActive }) => `dashboard-layout__nav-link ${isActive ? "dashboard-layout__nav-link--active" : ""}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Quản lý tài khoản</span>
              </NavLink>
              <NavLink
                to="/admin/audit-logs"
                className={({ isActive }) => `dashboard-layout__nav-link ${isActive ? "dashboard-layout__nav-link--active" : ""}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span>Nhật ký hoạt động</span>
              </NavLink>

            </div>
          )}

          {/* Manager Section */}
          {hasManager && (
            <div className="dashboard-layout__nav-section">
              <h3 className="dashboard-layout__nav-title">Quản lý</h3>
              <NavLink
                to="/manager/dashboard"
                className={({ isActive }) => `dashboard-layout__nav-link ${isActive ? "dashboard-layout__nav-link--active" : ""}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                  <path d="M22 12A10 10 0 0 0 12 2v10z" />
                </svg>
                <span>Dashboard Quản lý</span>
              </NavLink>
              <NavLink
                to="/manager/products"
                className={({ isActive }) => `dashboard-layout__nav-link ${isActive ? "dashboard-layout__nav-link--active" : ""}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.89 2.24a2 2 0 0 0-1.78 0L3.78 6.1a2 2 0 0 0-1.11 1.78v8.24a2 2 0 0 0 1.11 1.78l7.33 3.86a2 2 0 0 0 1.78 0l7.33-3.86a2 2 0 0 0 1.11-1.78V7.88a2 2 0 0 0-1.11-1.78zm-1.39 2.8L18 8.5l-2.5 1.3-6.5-3.41zM5 9.5l6 3.16v6.84l-6-3.16zm8 10v-6.84l6-3.16v6.84z" />
                </svg>
                <span>Quản lý sản phẩm</span>
              </NavLink>
              <NavLink
                to="/manager/promotions"
                className={({ isActive }) => `dashboard-layout__nav-link ${isActive ? "dashboard-layout__nav-link--active" : ""}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>Chương trình giảm giá</span>
              </NavLink>
              <NavLink
                to="/manager/orders"
                className={({ isActive }) => `dashboard-layout__nav-link ${isActive ? "dashboard-layout__nav-link--active" : ""}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <span>Quản lý đơn hàng</span>
              </NavLink>
              <NavLink
                to="/manager/inventory/suppliers"
                className={({ isActive }) => `dashboard-layout__nav-link ${isActive ? "dashboard-layout__nav-link--active" : ""}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Nhà cung cấp</span>
              </NavLink>
              <NavLink
                to="/manager/inventory/receive"
                className={({ isActive }) => `dashboard-layout__nav-link ${isActive ? "dashboard-layout__nav-link--active" : ""}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <span>Nhập kho</span>
              </NavLink>
              <NavLink
                to="/manager/inventory/batches"
                className={({ isActive }) => `dashboard-layout__nav-link ${isActive ? "dashboard-layout__nav-link--active" : ""}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                <span>Lô hàng</span>
              </NavLink>
              <NavLink
                to="/manager/inventory/low-stock"
                className={({ isActive }) => `dashboard-layout__nav-link ${isActive ? "dashboard-layout__nav-link--active" : ""}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>Cần nhập gấp</span>
              </NavLink>
            </div>
          )}

          {/* Seller Section */}
          {hasSeller && (
            <div className="dashboard-layout__nav-section">
              <h3 className="dashboard-layout__nav-title">Nhân Viên</h3>
              <NavLink
                to="/seller/dashboard"
                className={({ isActive }) => `dashboard-layout__nav-link ${isActive ? "dashboard-layout__nav-link--active" : ""}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Dashboard Seller</span>
              </NavLink>
              <NavLink
                to="/manager/pos"
                className={({ isActive }) => `dashboard-layout__nav-link ${isActive ? "dashboard-layout__nav-link--active" : ""}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                  <line x1="6" y1="8" x2="18" y2="8" />
                  <line x1="6" y1="12" x2="18" y2="12" />
                  <line x1="6" y1="16" x2="10" y2="16" />
                </svg>
                <span>Quầy bán hàng POS</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* Sidebar Footer / User Info */}
        <div className="dashboard-layout__footer">
          <div className="dashboard-layout__user-card">
            <div className="dashboard-layout__user-avatar">
              {session.roles[0]?.substring(0, 1) || "U"}
            </div>
            <div className="dashboard-layout__user-details">
              <div className="dashboard-layout__user-name">{session.roles.join(", ")}</div>
              <div className="dashboard-layout__user-status">Đang hoạt động</div>
            </div>
          </div>

          <div className="dashboard-layout__actions">
            <Link to="/" className="dashboard-layout__action-btn" title="Về trang bán hàng">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 8 8 12 12 16" />
                <line x1="16" y1="12" x2="8" y2="12" />
              </svg>
              <span>Về Web Bán Hàng</span>
            </Link>

            <button
              onClick={handleLogout}
              className="dashboard-layout__action-btn dashboard-layout__action-btn--logout"
              title="Đăng xuất"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <div className="dashboard-layout__content">
        <header className="dashboard-layout__header">
          <button
            className="dashboard-layout__menu-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle menu"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="dashboard-layout__breadcrumb">
            <span className="dashboard-layout__title-main">{storeSettings?.name || "Tạp hóa chị Tỏ"}</span>
            <span className="dashboard-layout__title-separator">/</span>
            <span className="dashboard-layout__title-sub">Hệ thống quản trị</span>
          </div>

          <div className="dashboard-layout__header-right">
            <div className="dashboard-layout__badge">
              <span className="dashboard-layout__badge-dot" />
              Máy chủ ổn định
            </div>
          </div>
        </header>

        <main className="dashboard-layout__main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
