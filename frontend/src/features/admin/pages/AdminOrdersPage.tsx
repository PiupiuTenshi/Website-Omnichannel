import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth";
import { getOnlineOrdersForAdmin, type OnlineOrder } from "../../checkout/api/onlineOrdersApi";
import "./AdminOrdersPage.css";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export function AdminOrdersPage() {
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? "";
  const navigate = useNavigate();

  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OnlineOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const loadOrders = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError("");
      const data = await getOnlineOrdersForAdmin(accessToken);
      setOrders(data);
    } catch {
      // Fallback mock data for testing/demo offline mode
      setOrders([
        {
          onlineOrderId: "a8e9f2b3-57bf-4f18-8742-1e96a2dcb512",
          orderCode: "WEB-2607152011-342",
          status: "Pending",
          paymentStatus: "Pending",
          subtotal: 125000,
          shippingFee: 15000,
          total: 140000,
          distanceKm: 4.2,
          managerMessage: null,
          createdAtUtc: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
          recipientName: "Nguyễn Văn Hùng",
          recipientPhoneNumber: "0912987654",
          deliveryAddress: "125 Nguyễn Văn Cừ, Phường 2, Quận 5, TP. Hồ Chí Minh",
          paymentMethod: "Cod"
        },
        {
          onlineOrderId: "b9c0e3a4-82bd-4a92-b413-2d93e8cca641",
          orderCode: "WEB-2607151834-879",
          status: "AwaitingShippingQuote",
          paymentStatus: "Pending",
          subtotal: 450000,
          shippingFee: null,
          total: 450000,
          distanceKm: 12.8,
          managerMessage: "Địa chỉ xa, cần báo phí ship thủ công.",
          createdAtUtc: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          recipientName: "Trần Thị Lan",
          recipientPhoneNumber: "0938445566",
          deliveryAddress: "Đường số 9, KDC Trung Sơn, Bình Hưng, Bình Chánh, TP. Hồ Chí Minh",
          paymentMethod: "BankTransfer"
        },
        {
          onlineOrderId: "d1a2c3b4-93ad-4781-a764-3e91b8dda523",
          orderCode: "WEB-2607151215-612",
          status: "Delivered",
          paymentStatus: "Paid",
          subtotal: 280000,
          shippingFee: 20000,
          total: 300000,
          distanceKm: 6.5,
          managerMessage: "Giao giờ hành chính",
          createdAtUtc: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
          recipientName: "Phạm Minh Hoàng",
          recipientPhoneNumber: "0977223344",
          deliveryAddress: "Tòa nhà Bitexco, 2 Hải Triều, Bến Nghé, Quận 1, TP. Hồ Chí Minh",
          paymentMethod: "BankTransfer"
        },
        {
          onlineOrderId: "e4f5a6b7-82cd-43bf-923f-4e92a8ccb999",
          orderCode: "WEB-2607141520-112",
          status: "Cancelled",
          paymentStatus: "Pending",
          subtotal: 95000,
          shippingFee: 10000,
          total: 105000,
          distanceKm: 2.1,
          managerMessage: "Khách hủy đơn qua hotline",
          createdAtUtc: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(), // Yesterday
          recipientName: "Lê Mỹ Duyên",
          recipientPhoneNumber: "0909112233",
          deliveryAddress: "45/12 Cao Thắng, Phường 3, Quận 3, TP. Hồ Chí Minh",
          paymentMethod: "Cod"
        }
      ]);
      setError("Không thể kết nối đến máy chủ. Đang hiển thị danh sách đơn mẫu để bạn trải nghiệm.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  // Handle client-side filters
  useEffect(() => {
    let result = [...orders];

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => 
        o.orderCode.toLowerCase().includes(q) ||
        o.recipientName.toLowerCase().includes(q) ||
        o.recipientPhoneNumber.includes(q) ||
        o.deliveryAddress.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(o => o.status === statusFilter);
    }

    if (paymentFilter !== "all") {
      result = result.filter(o => o.paymentStatus === paymentFilter);
    }

    setFilteredOrders(result);
  }, [orders, searchQuery, statusFilter, paymentFilter]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Pending":
        return "badge--warning";
      case "AwaitingShippingQuote":
        return "badge--info";
      case "QuoteAccepted":
      case "Confirmed":
      case "Preparing":
        return "badge--primary";
      case "Delivering":
        return "badge--info";
      case "Delivered":
        return "badge--success";
      case "Cancelled":
      case "DeliveryFailed":
      case "Expired":
        return "badge--danger";
      default:
        return "badge--secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Pending":
        return "Chờ xử lý";
      case "AwaitingShippingQuote":
        return "Chờ báo giá ship";
      case "QuoteAccepted":
        return "Đã nhận báo giá";
      case "Confirmed":
        return "Đã xác nhận";
      case "Preparing":
        return "Đang chuẩn bị hàng";
      case "Delivering":
        return "Đang giao";
      case "Delivered":
        return "Thành công";
      case "DeliveryFailed":
        return "Giao thất bại";
      case "Returned":
        return "Đã hoàn trả";
      case "Cancelled":
        return "Đã hủy";
      case "Expired":
        return "Hết hạn giữ kho";
      default:
        return status;
    }
  };

  return (
    <div className="admin-orders-page app-container">
      <header className="admin-orders-page__header">
        <div>
          <h1 className="admin-orders-page__title">Quản lý đơn hàng Online</h1>
          <p className="admin-orders-page__subtitle">
            Duyệt đơn hàng trực tuyến, thiết lập phí vận chuyển và cập nhật trạng thái đơn hàng.
          </p>
        </div>
      </header>

      {error && <div className="alert alert--info" role="status">{error}</div>}

      {/* Filters */}
      <section className="admin-orders-page__filters card" aria-label="Bộ lọc tìm kiếm">
        <div className="filter-group">
          <input
            type="search"
            className="form__input"
            placeholder="Tìm theo Mã đơn, tên khách, SĐT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-group" style={{ display: 'flex', gap: '8px' }}>
          <select
            className="form__input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Pending">Chờ xử lý</option>
            <option value="AwaitingShippingQuote">Chờ báo giá ship</option>
            <option value="Confirmed">Đã xác nhận</option>
            <option value="Preparing">Đang chuẩn bị</option>
            <option value="Delivering">Đang giao hàng</option>
            <option value="Delivered">Giao thành công</option>
            <option value="Cancelled">Đã hủy</option>
          </select>

          <select
            className="form__input"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="all">Tất cả thanh toán</option>
            <option value="Pending">Chưa thanh toán</option>
            <option value="Paid">Đã thanh toán</option>
          </select>
        </div>
      </section>

      {/* Main orders table */}
      <section className="admin-orders-page__list card">
        {loading ? (
          <div className="loading-spinner" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
            Đang tải danh sách đơn hàng trực tuyến...
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã đơn hàng</th>
                  <th>Ngày đặt</th>
                  <th>Khách hàng</th>
                  <th>Địa chỉ giao hàng</th>
                  <th>Thanh toán</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="no-data" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                      Không tìm thấy đơn hàng nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o.onlineOrderId}>
                      <td className="table__cell-bold">
                        <Link to={`/orders/${o.onlineOrderId}`} className="order-link">
                          {o.orderCode}
                        </Link>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {new Date(o.createdAtUtc).toLocaleString("vi-VN")}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{o.recipientName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{o.recipientPhoneNumber}</div>
                      </td>
                      <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }} title={o.deliveryAddress}>
                        {o.deliveryAddress}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          {o.paymentMethod === "Cod" ? "COD 💵" : "Chuyển khoản 🏦"}
                        </div>
                        <span className={`badge ${o.paymentStatus === "Paid" ? "badge--success" : "badge--warning"}`}>
                          {o.paymentStatus === "Paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                        </span>
                      </td>
                      <td className="table__cell-bold" style={{ color: 'var(--color-primary-strong)' }}>
                        {money.format(o.total)}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(o.status)}`}>
                          {getStatusLabel(o.status)}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn btn--sm btn--primary"
                          onClick={() => navigate(`/orders/${o.onlineOrderId}`)}
                        >
                          🔍 Xử lý đơn
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
