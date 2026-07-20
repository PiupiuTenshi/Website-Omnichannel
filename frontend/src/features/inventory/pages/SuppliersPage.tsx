import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth";
import { createSupplier, getSuppliers, updateSupplier, deleteSupplier } from "../api/inventoryApi";
import type { Supplier } from "../types/inventoryTypes";
import "./SuppliersPage.css";

export function SuppliersPage() {
  const { session } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states (Add)
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // Form states (Edit)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editName, setEditName] = useState("");
  const [editContactName, setEditContactName] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editLoading, setEditLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!session) return;
    try {
      setLoading(true);
      const data = await getSuppliers(session.accessToken);
      setSuppliers(data);
    } catch {
      setError("Không thể tải danh sách nhà cung cấp. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (!name.trim()) {
      setError("Tên nhà cung cấp bắt buộc phải nhập.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      await createSupplier(session.accessToken, {
        name: name.trim(),
        contactName: contactName.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined
      });
      setSuccess("Thêm nhà cung cấp thành công!");
      setName("");
      setContactName("");
      setPhoneNumber("");
      setEmail("");
      setAddress("");
      setShowAddForm(false);
      void loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu nhà cung cấp.");
    }
  };

  const startEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setEditName(s.name);
    setEditContactName(s.contactName || "");
    setEditPhoneNumber(s.phoneNumber || "");
    setEditEmail(s.email || "");
    setEditAddress(s.address || "");
    setEditIsActive(s.isActive);
    setError("");
    setSuccess("");
  };

  const handleUpdateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !editingSupplier) return;
    if (!editName.trim()) {
      setError("Tên nhà cung cấp bắt buộc phải nhập.");
      return;
    }

    try {
      setEditLoading(true);
      setError("");
      setSuccess("");
      await updateSupplier(session.accessToken, editingSupplier.supplierId, {
        name: editName.trim(),
        contactName: editContactName.trim() || undefined,
        phoneNumber: editPhoneNumber.trim() || undefined,
        email: editEmail.trim() || undefined,
        address: editAddress.trim() || undefined,
        isActive: editIsActive
      });
      setSuccess(`Cập nhật nhà cung cấp "${editName}" thành công!`);
      setEditingSupplier(null);
      void loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi cập nhật nhà cung cấp.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteSupplier = async (s: Supplier) => {
    if (!session) return;
    if (!window.confirm(`Bạn có chắc chắn muốn ngắt kết nối (xóa mềm) nhà cung cấp "${s.name}"?`)) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      await deleteSupplier(session.accessToken, s.supplierId);
      setSuccess(`Đã ngắt kết nối (xóa mềm) nhà cung cấp "${s.name}" thành công.`);
      void loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi xóa nhà cung cấp.");
    }
  };

  return (
    <section className="suppliers-page app-container" aria-labelledby="suppliers-heading">
      <div className="suppliers-page__header">
        <div>
          <h1 id="suppliers-heading" className="suppliers-page__title">Nhà cung cấp</h1>
          <p className="suppliers-page__subtitle">Quản lý danh sách đối tác cung cấp hàng hóa cho Tạp hóa chị Tỏ</p>
        </div>
        <button
          type="button"
          className="suppliers-page__add-btn btn btn--primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "Hủy bỏ" : "Thêm nhà cung cấp"}
        </button>
      </div>

      {error && <div className="alert alert--danger" role="alert">{error}</div>}
      {success && <div className="alert alert--success" role="status">{success}</div>}

      {showAddForm && (
        <div className="suppliers-page__form-container card">
          <h2 className="card__title">Tạo nhà cung cấp mới</h2>
          <form className="form" onSubmit={handleSubmit}>
            <div className="form__grid">
              <label className="form__field">
                <span className="form__label">Tên nhà cung cấp <span className="text-danger">*</span></span>
                <input
                  type="text"
                  className="form__input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Nông trại rau xanh Đà Lạt"
                  required
                />
              </label>

              <label className="form__field">
                <span className="form__label">Người liên hệ</span>
                <input
                  type="text"
                  className="form__input"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                />
              </label>

              <label className="form__field">
                <span className="form__label">Số điện thoại</span>
                <input
                  type="tel"
                  className="form__input"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Ví dụ: 0912345678"
                />
              </label>

              <label className="form__field">
                <span className="form__label">Email</span>
                <input
                  type="email"
                  className="form__input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ví dụ: dalat@farm.com"
                />
              </label>

              <label className="form__field form__field--full-width">
                <span className="form__label">Địa chỉ</span>
                <input
                  type="text"
                  className="form__input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ví dụ: 20 Lâm Viên, TP. Đà Lạt"
                />
              </label>
            </div>
            <div className="form__actions">
              <button type="submit" className="btn btn--primary">Lưu thông tin</button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setShowAddForm(false)}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">Đang tải danh sách nhà cung cấp...</div>
      ) : (
        <div className="suppliers-page__list card">
          {suppliers.length === 0 ? (
            <p className="no-data">Chưa có thông tin nhà cung cấp nào.</p>
          ) : (
            <>
              {/* Responsive strategy: Table on Desktop, Cards list on Mobile */}
              <div className="suppliers-table-wrapper">
                <table className="table suppliers-table">
                  <thead>
                    <tr>
                      <th>Tên nhà cung cấp</th>
                      <th>Người liên hệ</th>
                      <th>Số điện thoại</th>
                      <th>Email</th>
                      <th>Địa chỉ</th>
                      <th>Trạng thái</th>
                      <th style={{ textAlign: "right" }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((s) => (
                      <tr key={s.supplierId}>
                        <td className="table__cell-bold">{s.name}</td>
                        <td>{s.contactName || "—"}</td>
                        <td>{s.phoneNumber || "—"}</td>
                        <td>{s.email || "—"}</td>
                        <td className="table__cell-address">{s.address || "—"}</td>
                        <td>
                          <span className={`badge ${s.isActive ? "badge--success" : "badge--danger"}`}>
                            {s.isActive ? "Đang hoạt động" : "Ngừng hợp tác"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              className="btn btn--sm btn--primary"
                              onClick={() => startEdit(s)}
                            >
                              ✏️ Sửa
                            </button>
                            {s.isActive && (
                              <button
                                type="button"
                                className="btn btn--sm btn--danger"
                                onClick={() => void handleDeleteSupplier(s)}
                              >
                                🗑️ Xóa mềm
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="suppliers-mobile-list">
                {suppliers.map((s) => (
                  <div className="supplier-mobile-card card" key={s.supplierId}>
                    <div className="supplier-mobile-card__header">
                      <h3 className="supplier-mobile-card__name">{s.name}</h3>
                      <span className={`badge ${s.isActive ? "badge--success" : "badge--danger"}`}>
                        {s.isActive ? "Đang hoạt động" : "Ngừng"}
                      </span>
                    </div>
                    <div className="supplier-mobile-card__body">
                      <p><strong>Người liên hệ:</strong> {s.contactName || "—"}</p>
                      <p><strong>SĐT:</strong> {s.phoneNumber || "—"}</p>
                      <p><strong>Email:</strong> {s.email || "—"}</p>
                      <p><strong>Địa chỉ:</strong> {s.address || "—"}</p>
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="btn btn--sm btn--primary"
                        onClick={() => startEdit(s)}
                      >
                        ✏️ Sửa
                      </button>
                      {s.isActive && (
                        <button
                          type="button"
                          className="btn btn--sm btn--danger"
                          onClick={() => void handleDeleteSupplier(s)}
                        >
                          🗑️ Xóa mềm
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Edit Supplier Modal */}
      {editingSupplier && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal card" style={{ maxWidth: '600px', width: '100%' }}>
            <h2 className="card__title">Cập nhật nhà cung cấp</h2>
            <form className="form" onSubmit={handleUpdateSupplier}>
              <div className="form__grid">
                <label className="form__field">
                  <span className="form__label">Tên nhà cung cấp <span className="text-danger">*</span></span>
                  <input
                    type="text"
                    className="form__input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </label>

                <label className="form__field">
                  <span className="form__label">Người liên hệ</span>
                  <input
                    type="text"
                    className="form__input"
                    value={editContactName}
                    onChange={(e) => setEditContactName(e.target.value)}
                  />
                </label>

                <label className="form__field">
                  <span className="form__label">Số điện thoại</span>
                  <input
                    type="tel"
                    className="form__input"
                    value={editPhoneNumber}
                    onChange={(e) => setEditPhoneNumber(e.target.value)}
                  />
                </label>

                <label className="form__field">
                  <span className="form__label">Email</span>
                  <input
                    type="email"
                    className="form__input"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </label>

                <label className="form__field form__field--full-width">
                  <span className="form__label">Địa chỉ</span>
                  <input
                    type="text"
                    className="form__input"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                  />
                </label>

                <label className="form__field" style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center', marginTop: '12px' }}>
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                  />
                  <span className="form__label" style={{ marginBottom: 0 }}>Đang hoạt động</span>
                </label>
              </div>

              <div className="form__actions" style={{ marginTop: '20px' }}>
                <button type="submit" className="btn btn--primary" disabled={editLoading}>Lưu thay đổi</button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setEditingSupplier(null)}
                  disabled={editLoading}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
