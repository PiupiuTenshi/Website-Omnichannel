import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth";
import {
  changeUserRole,
  createUser,
  getUsers,
  setUserActivation,
} from "../api/userManagementApi";
import type { UserAccountSummary } from "../types/userManagementTypes";
import "./UserManagementPage.css";

export function UserManagementPage() {
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? "";

  const [users, setUsers] = useState<UserAccountSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("Tất cả");

  // Modal / Action states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("Seller");
  const [createLoading, setCreateLoading] = useState(false);

  const [editingUser, setEditingUser] = useState<UserAccountSummary | null>(null);
  const [editingRole, setEditingRole] = useState("");
  const [editRoleLoading, setEditRoleLoading] = useState(false);


  const loadUsers = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError("");
      const data = await getUsers(accessToken);
      setUsers(data);
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Không thể tải danh sách tài khoản.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchSearch =
        (user.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (user.phoneNumber || "").includes(search);
      
      const matchRole =
        roleFilter === "Tất cả" ||
        user.roles.includes(roleFilter);

      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    try {
      setCreateLoading(true);
      setError("");
      setSuccess("");
      await createUser(accessToken, {
        email: newEmail,
        password: newPassword,
        role: newRole,
      });
      setSuccess(`Đã tạo tài khoản ${newEmail} thành công.`);
      setShowCreateModal(false);
      setNewEmail("");
      setNewPassword("");
      setNewRole("Seller");
      void loadUsers();
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Tạo tài khoản thất bại.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleChangeRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !editingUser) return;
    try {
      setEditRoleLoading(true);
      setError("");
      setSuccess("");
      await changeUserRole(accessToken, editingUser.userId, editingRole);
      setSuccess(`Đã cập nhật vai trò của tài khoản ${editingUser.email} thành ${editingRole}.`);
      setEditingUser(null);
      void loadUsers();
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Đổi vai trò thất bại.");
    } finally {
      setEditRoleLoading(false);
    }
  };

  const handleToggleActivation = async (user: UserAccountSummary) => {
    if (!accessToken) return;
    const targetStatus = !user.isActive;
    try {
      setError("");
      setSuccess("");
      await setUserActivation(accessToken, user.userId, targetStatus);
      setSuccess(`Đã ${targetStatus ? "mở khóa" : "khóa"} tài khoản ${user.email} thành công.`);
      void loadUsers();
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Cập nhật trạng thái thất bại.");
    }
  };


  if (!session) return null;

  return (
    <section className="user-management-page app-container" aria-labelledby="user-management-heading">
      <header className="user-management-page__header">
        <div>
          <h1 id="user-management-heading" className="user-management-page__title">Quản lý tài khoản</h1>
          <p className="user-management-page__subtitle">
            Danh sách nhân viên, đối tác và khách hàng có tài khoản trên hệ thống. Cấp quyền hoặc vô hiệu hóa truy cập.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--primary user-management-page__add-btn"
          onClick={() => { setError(""); setSuccess(""); setShowCreateModal(true); }}
        >
          ➕ Thêm tài khoản
        </button>
      </header>

      {error && <div className="alert alert--danger" role="alert">{error}</div>}
      {success && <div className="alert alert--success" role="status">{success}</div>}

      {/* Filter and Search Bar */}
      <section className="user-management-page__filters" aria-label="Bộ lọc tài khoản">
        <div className="user-management-page__search-wrapper">
          <svg className="user-management-page__search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="user-management-page__search-input"
            placeholder="Tìm kiếm tài khoản theo email hoặc số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="user-management-page__select-wrapper">
          <label htmlFor="role-filter" className="sr-only">Lọc theo vai trò</label>
          <select
            id="role-filter"
            className="user-management-page__select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="Tất cả">Tất cả vai trò</option>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Seller">Seller</option>
            <option value="Buyer">Buyer</option>
          </select>
        </div>
      </section>

      {/* Accounts List Card */}
      <section className="user-management-page__card" aria-label="Bảng tài khoản">
        {loading ? (
          <div className="loading-spinner">Đang tải danh sách tài khoản...</div>
        ) : (
          <div className="user-management-page__table-wrapper">
            <table className="user-management-page__table">
              <thead>
                <tr>
                  <th>Tài khoản Email</th>
                  <th>Vai trò</th>
                  <th>Số điện thoại</th>
                  <th>Email xác thực</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="user-management-page__empty-state">
                      Không tìm thấy tài khoản nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.userId}>
                      <td>
                        <strong className="user-management-page__email-text">{user.email || "(Không có email)"}</strong>
                        <div className="user-management-page__id-sub">ID: {user.userId}</div>
                      </td>
                      <td>
                        {user.roles.map((role) => (
                          <span
                            key={role}
                            className={`audit-logs-page__role-badge audit-logs-page__role-badge--${role.toLowerCase()}`}
                            style={{ marginRight: '4px' }}
                          >
                            {role}
                          </span>
                        ))}
                      </td>
                      <td className="user-management-page__phone-cell">
                        {user.phoneNumber || <span className="text-muted">Chưa cập nhật</span>}
                      </td>
                      <td>
                        <span className={`status-dot ${user.emailConfirmed ? "status-dot--verified" : "status-dot--unverified"}`}>
                          {user.emailConfirmed ? "Đã xác thực" : "Chưa xác thực"}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.isActive ? "status-badge--active" : "status-badge--locked"}`}>
                          {user.isActive ? "Hoạt động" : "Bị khóa"}
                        </span>
                      </td>
                      <td>
                        <div className="user-management-page__row-actions">
                          <button
                            type="button"
                            className="btn btn--sm btn--secondary"
                            onClick={() => {
                              setEditingUser(user);
                              setEditingRole(user.roles[0] || "Seller");
                              setError("");
                              setSuccess("");
                            }}
                          >
                            ✏️ Vai trò
                          </button>
                          <button
                            type="button"
                            className={`btn btn--sm ${user.isActive ? "btn--secondary" : "btn--primary"}`}
                            onClick={() => void handleToggleActivation(user)}
                          >
                            {user.isActive ? "🔒 Khóa" : "🔓 Mở khóa"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <footer className="user-management-page__card-footer">
          Hiển thị <strong>{filteredUsers.length}</strong> tài khoản người dùng trên tổng số {users.length} tài khoản.
        </footer>
      </section>

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal card user-management-modal">
            <h2 className="pos-section-title">Thêm tài khoản hệ thống mới</h2>
            <form onSubmit={(e) => void handleCreateUser(e)} className="user-management-form">
              <label className="form__field">
                <span className="form__label">Địa chỉ Email</span>
                <input
                  type="email"
                  required
                  className="form__input"
                  placeholder="nhanvien@choxanh.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </label>

              <label className="form__field">
                <span className="form__label">Mật khẩu ban đầu</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="form__input"
                  placeholder="Nhập tối thiểu 6 ký tự..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>

              <label className="form__field">
                <span className="form__label">Vai trò ban đầu</span>
                <select
                  className="form__input"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="Admin">Admin (Quản trị tối cao)</option>
                  <option value="Manager">Manager (Quản lý kho/cửa hàng)</option>
                  <option value="Seller">Seller (Nhân viên bán hàng POS)</option>
                  <option value="Buyer">Buyer (Khách hàng trực tuyến)</option>
                </select>
              </label>

              <div className="form__actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={createLoading}
                >
                  {createLoading ? "Đang xử lý..." : "Xác nhận tạo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal card user-management-modal">
            <h2 className="pos-section-title">Thay đổi vai trò tài khoản</h2>
            <p className="modal-lead">Thiết lập phân quyền hệ thống cho: <strong>{editingUser.email}</strong></p>
            <form onSubmit={(e) => void handleChangeRole(e)} className="user-management-form">
              <label className="form__field">
                <span className="form__label">Chọn vai trò mới</span>
                <select
                  className="form__input"
                  value={editingRole}
                  onChange={(e) => setEditingRole(e.target.value)}
                >
                  <option value="Admin">Admin (Quản trị tối cao)</option>
                  <option value="Manager">Manager (Quản lý kho/cửa hàng)</option>
                  <option value="Seller">Seller (Nhân viên bán hàng POS)</option>
                  <option value="Buyer">Buyer (Khách hàng trực tuyến)</option>
                </select>
              </label>

              <div className="form__actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setEditingUser(null)}
                  disabled={editRoleLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={editRoleLoading}
                >
                  {editRoleLoading ? "Đang cập nhật..." : "Cập nhật vai trò"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </section>
  );
}
