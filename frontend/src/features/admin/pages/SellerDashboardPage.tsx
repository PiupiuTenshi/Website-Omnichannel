import { Link } from "react-router-dom";
import { useAuth } from "../../auth";
import "./SellerDashboardPage.css";

export function SellerDashboardPage() {
  const { session } = useAuth();

  // Simulated seller shifts stats
  const todaySalesStats = {
    transactionsCount: 14,
    cashAmount: "1,254,000 VND",
    cardTransferAmount: "3,820,000 VND",
    totalAmount: "5,074,000 VND",
    shiftStart: "07:30 Sáng",
    cashierName: session?.roles.includes("Admin") ? "Quản trị viên" : "Nhân viên quầy"
  };

  return (
    <div className="seller-dashboard">
      <header className="seller-dashboard__header-section">
        <div>
          <h1 className="seller-dashboard__title">Bảng làm việc của Nhân Viên</h1>
          <p className="seller-dashboard__subtitle">Thực hiện bán hàng tại quầy POS, in hóa đơn nhiệt và hỗ trợ khách thanh toán nhanh.</p>
        </div>
        <span className="seller-dashboard__role-badge">Cashier / Seller</span>
      </header>

      {/* POS Action Hero Card */}
      <section className="seller-dashboard__hero" aria-labelledby="pos-action-heading">
        <div className="seller-dashboard__hero-content">
          <h2 className="seller-dashboard__hero-title" id="pos-action-heading">Màn hình bán lẻ POS</h2>
          <p className="seller-dashboard__hero-description">
            Quét mã vạch sản phẩm hoặc tìm nhanh theo tên. Hệ thống hỗ trợ làm tròn tiền mặt lên mốc 1.000 đồng gần nhất, tự động in hóa đơn 58 mm.
          </p>
          <Link to="/admin/pos" className="seller-dashboard__hero-button">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
              <line x1="6" y1="8" x2="18" y2="8" />
              <line x1="6" y1="12" x2="18" y2="12" />
              <line x1="6" y1="16" x2="10" y2="16" />
            </svg>
            Vào Bán Hàng Tại Quầy (POS)
          </Link>
        </div>
        <div className="seller-dashboard__hero-image">
          <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="20" y="20" width="60" height="40" rx="4" />
            <line x1="20" y1="50" x2="80" y2="50" />
            <rect x="35" y="70" width="30" height="10" rx="2" />
            <line x1="50" y1="60" x2="50" y2="70" />
            <circle cx="35" cy="35" r="4" fill="currentColor" />
            <circle cx="50" cy="35" r="4" fill="currentColor" />
            <circle cx="65" cy="35" r="4" fill="currentColor" />
          </svg>
        </div>
      </section>

      {/* Grid: Sales stats and Business Rules reminder */}
      <div className="seller-dashboard__layout-grid">
        {/* Today stats summary */}
        <section className="seller-dashboard__card" aria-labelledby="sales-stats-heading">
          <header className="seller-dashboard__card-header">
            <h2 className="seller-dashboard__card-title" id="sales-stats-heading">Thống kê ca trực hôm nay</h2>
            <span className="seller-dashboard__status-indicator">Đang mở ca</span>
          </header>
          <div className="seller-dashboard__stats-list">
            <div className="seller-dashboard__stat-item">
              <span className="seller-dashboard__stat-label">Số giao dịch đã lập</span>
              <span className="seller-dashboard__stat-number">{todaySalesStats.transactionsCount}</span>
            </div>
            <div className="seller-dashboard__stat-item">
              <span className="seller-dashboard__stat-label">Doanh thu tiền mặt</span>
              <span className="seller-dashboard__stat-number">{todaySalesStats.cashAmount}</span>
            </div>
            <div className="seller-dashboard__stat-item">
              <span className="seller-dashboard__stat-label">Chuyển khoản (QR code)</span>
              <span className="seller-dashboard__stat-number">{todaySalesStats.cardTransferAmount}</span>
            </div>
            <div className="seller-dashboard__stat-divider" />
            <div className="seller-dashboard__stat-item seller-dashboard__stat-item--highlight">
              <span className="seller-dashboard__stat-label">Tổng doanh thu ca</span>
              <span className="seller-dashboard__stat-number">{todaySalesStats.totalAmount}</span>
            </div>
          </div>
          <div className="seller-dashboard__card-footer">
            Bắt đầu ca: <strong>{todaySalesStats.shiftStart}</strong> | Người trực: <strong>{todaySalesStats.cashierName}</strong>
          </div>
        </section>

        {/* Business Rules Reference */}
        <section className="seller-dashboard__card" aria-labelledby="rules-heading">
          <header className="seller-dashboard__card-header">
            <h2 className="seller-dashboard__card-title" id="rules-heading">Quy định bán hàng nghiệp vụ</h2>
          </header>
          <div className="seller-dashboard__rules-list">
            <div className="seller-dashboard__rule-item">
              <div className="seller-dashboard__rule-icon">⚖️</div>
              <div className="seller-dashboard__rule-text">
                <h3>Bán rau củ theo số thập phân</h3>
                <p>Mặt hàng rau củ quả tươi được cân đo và bán lẻ theo khối lượng số thập phân (bước chia 0,1 kg). Vui lòng nhập đúng khối lượng thực tế.</p>
              </div>
            </div>

            <div className="seller-dashboard__rule-item">
              <div className="seller-dashboard__rule-icon">🪙</div>
              <div className="seller-dashboard__rule-text">
                <h3>Làm tròn tiền mặt lẻ</h3>
                <p>Giao dịch bằng tiền mặt lẻ được làm tròn lên mốc 1.000 đồng gần nhất. Thanh toán chuyển khoản qua ngân hàng/QR giữ nguyên số tiền chính xác.</p>
              </div>
            </div>

            <div className="seller-dashboard__rule-item">
              <div className="seller-dashboard__rule-icon">⏳</div>
              <div className="seller-dashboard__rule-text">
                <h3>Chính sách hạn dùng rau tươi</h3>
                <p>Rau tươi nhập kho sẽ hiển thị cảnh báo cận hạn từ 06:00 ngày hôm sau và bị hệ thống tự động chặn bán từ 18:00 cùng ngày để đảm bảo chất lượng rau.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
