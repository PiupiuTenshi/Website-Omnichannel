import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth";
import { createSupplier, getSuppliers } from "../api/inventoryApi";
import type { Supplier } from "../types/inventoryTypes";
import "./SuppliersPage.css";

export function SuppliersPage() {
  const { session } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

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
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
