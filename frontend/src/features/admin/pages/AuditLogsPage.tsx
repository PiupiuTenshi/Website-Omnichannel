import { useState, useMemo } from "react";
import "./AuditLogsPage.css";

interface AuditLog {
  id: number;
  time: string;
  user: string;
  action: string;
  module: string;
  ip: string;
  status: "Success" | "Warning" | "Error";
}

export function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("Tất cả");

  // Rich mock dataset for a premium audit view
  const initialAuditLogs: AuditLog[] = [
    { id: 1, time: "2026-07-13 16:45:12", user: "manager@store.com", action: "Nhập lô hàng mới (Mã lô: BATCH-092)", module: "Kho hàng", ip: "192.168.1.15", status: "Success" },
    { id: 2, time: "2026-07-13 15:20:08", user: "seller@store.com", action: "Thực hiện thanh toán POS đơn #10429", module: "Bán hàng", ip: "192.168.1.20", status: "Success" },
    { id: 3, time: "2026-07-13 14:10:55", user: "admin@store.com", action: "Cập nhật cấu hình hệ thống: Tắt online ordering", module: "Cài đặt", ip: "192.168.1.2", status: "Success" },
    { id: 4, time: "2026-07-13 13:58:33", user: "seller@store.com", action: "Hủy thanh toán POS đơn #10428 (Lý do: Khách đổi ý)", module: "Bán hàng", ip: "192.168.1.20", status: "Warning" },
    { id: 5, time: "2026-07-13 12:00:00", user: "system_worker", action: "Tự động thu hồi giữ tồn kho 10m cho Variant #12", module: "Đơn hàng", ip: "127.0.0.1", status: "Success" },
    { id: 6, time: "2026-07-13 09:12:44", user: "manager@store.com", action: "Thêm sản phẩm mới (Rau Bina hữu cơ Đà Lạt)", module: "Sản phẩm", ip: "192.168.1.15", status: "Success" },
    { id: 7, time: "2026-07-12 18:30:19", user: "system_worker", action: "Phát hiện lô rau tươi sắp hết hạn cảnh báo 18:00 ngày mai", module: "Kho hàng", ip: "127.0.0.1", status: "Warning" },
    { id: 8, time: "2026-07-12 17:05:00", user: "buyer@store.com", action: "Gửi phản hồi đánh giá sản phẩm (Đơn hàng #10385)", module: "Đánh giá", ip: "115.75.12.98", status: "Success" },
    { id: 9, time: "2026-07-12 11:22:10", user: "admin@store.com", action: "Mở khóa kích hoạt tài khoản nhân viên (seller@store.com)", module: "Hệ thống", ip: "192.168.1.2", status: "Success" },
    { id: 10, time: "2026-07-12 08:15:33", user: "unknown_ip", action: "Đăng nhập thất bại quá 5 lần (Tài khoản: test_attacker)", module: "Hệ thống", ip: "203.162.4.55", status: "Error" }
  ];

  // Filtering logic
  const filteredLogs = useMemo(() => {
    return initialAuditLogs.filter((log) => {
      const matchesSearch =
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ip.includes(searchTerm);
      const matchesModule = selectedModule === "Tất cả" || log.module === selectedModule;
      return matchesSearch && matchesModule;
    });
  }, [searchTerm, selectedModule]);

  return (
    <div className="audit-logs-page">
      <header className="audit-logs-page__header">
        <div>
          <h1 className="audit-logs-page__title">Nhật ký hoạt động hệ thống</h1>
          <p className="audit-logs-page__subtitle">
            Truy vết các thay đổi dữ liệu, hành động đăng nhập, nhập xuất kho và các thao tác cấu hình hệ thống quan trọng.
          </p>
        </div>
        <span className="audit-logs-page__badge">Audit Trail</span>
      </header>

      {/* Filters Area */}
      <section className="audit-logs-page__filters" aria-label="Bộ lọc nhật ký">
        <div className="audit-logs-page__search-wrapper">
          <svg className="audit-logs-page__search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="audit-logs-page__search-input"
            placeholder="Tìm kiếm theo tài khoản, hành động, IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="audit-logs-page__select-wrapper">
          <label htmlFor="module-filter" className="sr-only">Lọc theo phân hệ</label>
          <select
            id="module-filter"
            className="audit-logs-page__select"
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
          >
            <option value="Tất cả">Tất cả phân hệ</option>
            <option value="Kho hàng">Kho hàng</option>
            <option value="Bán hàng">Bán hàng</option>
            <option value="Cài đặt">Cài đặt</option>
            <option value="Đơn hàng">Đơn hàng</option>
            <option value="Sản phẩm">Sản phẩm</option>
            <option value="Đánh giá">Đánh giá</option>
            <option value="Hệ thống">Hệ thống</option>
          </select>
        </div>
      </section>

      {/* Data Table */}
      <section className="audit-logs-page__card" aria-label="Bảng dữ liệu nhật ký">
        <div className="audit-logs-page__table-wrapper">
          <table className="audit-logs-page__table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Tài khoản</th>
                <th>Hành động</th>
                <th>Phân hệ</th>
                <th>Địa chỉ IP</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="audit-logs-page__empty-state">
                    Không tìm thấy nhật ký phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="audit-logs-page__time-cell">{log.time}</td>
                    <td>
                      <span className="audit-logs-page__user-text">{log.user}</span>
                    </td>
                    <td>
                      <span className="audit-logs-page__action-text">{log.action}</span>
                    </td>
                    <td>
                      <span className="audit-logs-page__module-tag">{log.module}</span>
                    </td>
                    <td className="audit-logs-page__ip-cell">{log.ip}</td>
                    <td>
                      <span className={`audit-logs-page__status-badge audit-logs-page__status-badge--${log.status.toLowerCase()}`}>
                        {log.status === "Success" ? "Thành công" : log.status === "Warning" ? "Cảnh báo" : "Lỗi bảo mật"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <footer className="audit-logs-page__card-footer">
          Hiển thị <strong>{filteredLogs.length}</strong> nhật ký hoạt động gần nhất.
        </footer>
      </section>
    </div>
  );
}
