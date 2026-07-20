import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth";
import { getUsers } from "../api/userManagementApi";
import { useStoreSettings } from "../hooks/useStoreSettings";
import type { UserAccountSummary } from "../types/userManagementTypes";
import "./AdminDashboardPage.css";

export function AdminDashboardPage() {
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? "";
  const { draft, isLoading } = useStoreSettings(accessToken);
  const [users, setUsers] = useState<UserAccountSummary[]>([]);
  const [usersError, setUsersError] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    void getUsers(accessToken)
      .then(setUsers)
      .catch((requestError: unknown) => {
        setUsers([]);
        setUsersError(requestError instanceof Error ? requestError.message : "Không thể tải danh sách tài khoản.");
      });
  }, [accessToken]);

  // Simulated Audit Logs for rich UI
  const auditLogs = [
    { id: 1, time: "Hôm nay, 16:45", user: "manager@store.com", action: "Nhập lô hàng mới", module: "Kho hàng", ip: "192.168.1.15" },
    { id: 2, time: "Hôm nay, 15:20", user: "seller@store.com", action: "Thực hiện thanh toán POS", module: "Bán hàng", ip: "192.168.1.20" },
    { id: 3, time: "Hôm nay, 14:10", user: "admin@store.com", action: "Cập nhật cấu hình hệ thống", module: "Cài đặt", ip: "192.168.1.2" },
    { id: 4, time: "Hôm qua, 18:30", user: "system_worker", action: "Tự động thu hồi giữ tồn kho 10m", module: "Đơn hàng", ip: "127.0.0.1" },
    { id: 5, time: "Hôm qua, 09:00", user: "manager@store.com", action: "Thêm sản phẩm mới (Rau Bina)", module: "Sản phẩm", ip: "192.168.1.15" }
  ];

  // Simulated Account management
  void [
    { name: "Chị Tỏ (Admin)", email: "admin@store.com", role: "Admin", status: "Đang hoạt động" },
    { name: "Nguyễn Văn Quản Lý", email: "manager@store.com", role: "Manager", status: "Đang hoạt động" },
    { name: "Trần Thị Bán Hàng", email: "seller@store.com", role: "Seller", status: "Đang hoạt động" },
    { name: "Khách Hàng Thân Thiết", email: "buyer@store.com", role: "Buyer", status: "Đang hoạt động" }
  ];

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__header-section">
        <div>
          <h1 className="admin-dashboard__title">Chào quay trở lại, Admin!</h1>
          <p className="admin-dashboard__subtitle">Quản trị toàn bộ hệ thống, phân quyền tài khoản và cấu hình tổng quan cửa hàng.</p>
        </div>
        <span className="admin-dashboard__role-badge">Admin System</span>
      </header>

      {/* Stats Cards */}
      <section className="admin-dashboard__stats-grid" aria-label="System status statistics">
        <div className="admin-dashboard__stat-card">
          <div className="admin-dashboard__stat-header">
            <span className="admin-dashboard__stat-title">Trạng thái đặt hàng online</span>
            <div className="admin-dashboard__stat-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
          </div>
          {isLoading ? (
            <div className="admin-dashboard__stat-value admin-dashboard__stat-value--loading">Đang tải...</div>
          ) : (
            <div className="admin-dashboard__stat-value">
              <span className={`admin-dashboard__status-indicator ${draft.isOnlineOrderingEnabled ? "admin-dashboard__status-indicator--active" : "admin-dashboard__status-indicator--inactive"}`}>
                {draft.isOnlineOrderingEnabled ? "Đang Bật" : "Tạm Tắt"}
              </span>
            </div>
          )}
          <p className="admin-dashboard__stat-desc">Kiểm soát cho phép khách hàng đặt hàng online trên web.</p>
        </div>

        <div className="admin-dashboard__stat-card">
          <div className="admin-dashboard__stat-header">
            <span className="admin-dashboard__stat-title">Thông tin cửa hàng</span>
            <div className="admin-dashboard__stat-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
          </div>
          <div className="admin-dashboard__stat-value admin-dashboard__stat-value--text">
            {isLoading ? "Đang tải..." : draft.name || "Chưa thiết lập"}
          </div>
          <p className="admin-dashboard__stat-desc">{isLoading ? "" : draft.address || "Chưa thiết lập địa chỉ"}</p>
        </div>

        <div className="admin-dashboard__stat-card">
          <div className="admin-dashboard__stat-header">
            <span className="admin-dashboard__stat-title">Đường dây nóng (Hotline)</span>
            <div className="admin-dashboard__stat-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
          </div>
          <div className="admin-dashboard__stat-value admin-dashboard__stat-value--text">
            {isLoading ? "Đang tải..." : draft.contactNumbers.filter(Boolean).join(", ") || "Chưa thiết lập"}
          </div>
          <p className="admin-dashboard__stat-desc">Số điện thoại liên hệ hiển thị ở chân trang.</p>
        </div>
      </section>

      {/* Main Grid: Audit logs and Users list */}
      <div className="admin-dashboard__layout-grid">
        {/* User Management Section */}
        <section className="admin-dashboard__card" aria-labelledby="users-heading">
          <header className="admin-dashboard__card-header">
            <h2 className="admin-dashboard__card-title" id="users-heading">Quản lý tài khoản nhân sự</h2>
            <div className="admin-dashboard__card-actions">
              <span className="admin-dashboard__badge-count">{users.length} tài khoản</span>
            </div>
          </header>
          <div className="admin-dashboard__table-wrapper">
            {usersError && <p className="admin-dashboard__error" role="alert">{usersError}</p>}
            <table className="admin-dashboard__table">
              <thead>
                <tr>
                  <th>Tên người dùng</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.userId}>
                    <td>
                      <div className="admin-dashboard__user-info">
                        <span className="admin-dashboard__user-name">{user.email ?? user.phoneNumber ?? "Tài khoản chưa có thông tin liên hệ"}</span>
                        <span className="admin-dashboard__user-email">{user.phoneNumber ?? user.email ?? ""}</span>
                      </div>
                    </td>
                    <td>
                      {user.roles.map((role) => <span key={role} className={`admin-dashboard__role-tag-item admin-dashboard__role-tag-item--${role.toLowerCase()}`}>{role}</span>)}
                    </td>
                    <td>
                      <span className="admin-dashboard__status-tag">{user.isActive ? "Đang hoạt động" : user.requiresInitialActivation ? "Chờ kích hoạt" : "Đã khóa"}</span>
                    </td>
                    <td>
                      <Link to="/admin/users" className="admin-dashboard__action-link">
                        Quản lý
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Audit Logs Section */}
        <section className="admin-dashboard__card" aria-labelledby="logs-heading">
          <header className="admin-dashboard__card-header">
            <h2 className="admin-dashboard__card-title" id="logs-heading">Nhật ký hoạt động (Audit Logs)</h2>
            <Link to="/admin/audit-logs" className="admin-dashboard__card-link">Xem chi tiết</Link>
          </header>
          <div className="admin-dashboard__logs-list">
            {auditLogs.map((log) => (
              <div className="admin-dashboard__log-item" key={log.id}>
                <div className="admin-dashboard__log-meta">
                  <span className="admin-dashboard__log-time">{log.time}</span>
                  <span className="admin-dashboard__log-ip">{log.ip}</span>
                </div>
                <div className="admin-dashboard__log-body">
                  <strong>{log.user}</strong>: {log.action}
                </div>
                <div className="admin-dashboard__log-footer">
                  Phân hệ: <span className="admin-dashboard__log-module">{log.module}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Quick Action Footer */}
      <section className="admin-dashboard__actions-panel" aria-label="Quick Actions">
        <h2 className="sr-only">Hành động nhanh</h2>
        <Link to="/manager/store-settings" className="admin-dashboard__button">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Đi tới Trang Cấu Hình Cửa Hàng
        </Link>
        <Link to="/" className="admin-dashboard__button admin-dashboard__button--secondary">
          Quay lại website bán hàng
        </Link>
      </section>
    </div>
  );
}
