import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../auth";
import {
  acceptQuote,
  cancelOrder,
  getOnlineOrder,
  setShippingQuote,
  confirmCodPayment,
  markPreparing,
  markDelivering,
  markDelivered,
  markDeliveryFailed,
  markReturned,
  type OnlineOrder
} from "../api/onlineOrdersApi";
import "./OrderTrackingPage.css";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export function OrderTrackingPage() {
  const { orderId = "" } = useParams();
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? "";

  const [order, setOrder] = useState<OnlineOrder | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for Manager Shipping Quote form
  const [shippingFeeInput, setShippingFeeInput] = useState("15000");
  const [managerMessageInput, setManagerMessageInput] = useState("");

  // Reservation Countdown timer states
  const [timeLeft, setTimeLeft] = useState<number>(0); // remaining seconds

  const isManager = session?.roles.includes("Admin") || session?.roles.includes("Manager");

  const loadOrder = useCallback(async () => {
    try {
      const data = await getOnlineOrder(orderId, accessToken);
      setOrder(data);
      if (data.shippingFee !== null) {
        setShippingFeeInput(data.shippingFee.toString());
      }
      setManagerMessageInput(data.managerMessage || "");
    } catch {
      setError("Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập.");
    }
  }, [accessToken, orderId]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    const refreshId = window.setInterval(() => {
      void loadOrder();
    }, 30_000);
    return () => window.clearInterval(refreshId);
  }, [loadOrder]);

  // Handle countdown reservation timer
  useEffect(() => {
    if (!order) return;
    
    // Only countdown if Pending or AwaitingShippingQuote
    const isCounting = order.status === "Pending" || order.status === "AwaitingShippingQuote";
    if (!isCounting) {
      setTimeLeft(0);
      return;
    }

    const expiresTime = new Date(order.createdAtUtc).getTime() + 10 * 60 * 1000; // 10 minutes in ms
    
    const updateTimer = () => {
      const remainingMs = expiresTime - Date.now();
      if (remainingMs <= 0) {
        setTimeLeft(0);
      } else {
        setTimeLeft(Math.floor(remainingMs / 1000));
      }
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [order]);

  const handleAction = async (apiCall: () => Promise<OnlineOrder>) => {
    setIsSubmitting(true);
    setError("");
    try {
      const updatedOrder = await apiCall();
      setOrder(updatedOrder);
      if (updatedOrder.shippingFee !== null) {
        setShippingFeeInput(updatedOrder.shippingFee.toString());
      }
      setManagerMessageInput(updatedOrder.managerMessage || "");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể cập nhật đơn hàng. Vui lòng kiểm tra và thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="order-tracking app-container">
        <div className="order-tracking__error" role="alert">{error}</div>
        <Link to="/" className="order-tracking__back-btn">Quay lại trang chủ</Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-tracking app-container">
        <p className="order-tracking__loading">Đang tải chi tiết đơn hàng…</p>
      </div>
    );
  }

  // Format countdown text MM:SS
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case "Pending":
        return "Chờ xử lý";
      case "AwaitingShippingQuote":
        return "Chờ báo giá vận chuyển";
      case "QuoteAccepted":
        return "Đã đồng ý báo giá";
      case "Confirmed":
        return "Đã xác nhận";
      case "Preparing":
        return "Đang chuẩn bị hàng";
      case "Delivering":
        return "Đang giao hàng";
      case "Delivered":
        return "Đã giao thành công";
      case "DeliveryFailed":
        return "Giao hàng thất bại";
      case "Returned":
        return "Đã đổi trả hàng";
      case "Cancelled":
        return "Đơn đã hủy";
      case "Expired":
        return "Đơn hết hạn giữ kho";
      default:
        return status;
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    return status === "Paid" ? "Đã thanh toán" : "Chưa thanh toán";
  };

  return (
    <div className="order-tracking app-container">
      {/* Backoffice Layout sidebar indicator warning (does not lose sidebar inside DashboardLayout, but we display a link back to Dashboard if manager) */}
      {isManager && (
        <div className="order-tracking__manager-badge">
          <span>Hệ Thống Quản Lý Đơn Hàng</span>
          <Link to="/manager/dashboard" className="order-tracking__dashboard-link">
            Về Dashboard Quản Lý
          </Link>
        </div>
      )}

      <header className="order-tracking__header">
        <div>
          <span className="order-tracking__date">
            Ngày đặt: {new Date(order.createdAtUtc).toLocaleString("vi-VN")}
          </span>
          <h1 className="order-tracking__title">Đơn hàng {order.orderCode}</h1>
        </div>
        <div className={`order-tracking__status-tag order-tracking__status-tag--${order.status.toLowerCase()}`}>
          {getOrderStatusLabel(order.status)}
        </div>
      </header>

      {/* Reservation countdown alert */}
      {timeLeft > 0 ? (
        <div className="order-tracking__countdown-alert order-tracking__countdown-alert--active">
          <span className="order-tracking__alert-icon">⏱️</span>
          <div className="order-tracking__alert-text">
            <strong>Giữ tồn kho an toàn:</strong> Sản phẩm trong đơn được giữ độc quyền trong 
            <span className="order-tracking__timer"> {formatCountdown(timeLeft)}</span>.
          </div>
        </div>
      ) : (order.status === "Pending" || order.status === "AwaitingShippingQuote") ? (
        <div className="order-tracking__countdown-alert order-tracking__countdown-alert--expired">
          <span className="order-tracking__alert-icon">⚠️</span>
          <div className="order-tracking__alert-text">
            <strong>Hết thời hạn giữ tồn kho 10m:</strong> Sản phẩm trong giỏ đã giải phóng về lô ban đầu. Bạn vẫn có thể mua, nhưng có thể gặp rủi ro hết hàng.
          </div>
        </div>
      ) : null}

      {/* Tracking timeline */}
      <section className="order-tracking__timeline-card" aria-label="Hành trình đơn hàng">
        <h2 className="sr-only">Hành trình đơn hàng</h2>
        <ul className="order-tracking__timeline">
          <li className={`order-tracking__step ${["Pending", "AwaitingShippingQuote", "QuoteAccepted", "Confirmed", "Preparing", "Delivering", "Delivered"].includes(order.status) ? "order-tracking__step--active" : ""}`}>
            <span className="order-tracking__step-num">1</span>
            <span className="order-tracking__step-text">Đặt hàng</span>
          </li>
          <li className={`order-tracking__step ${["QuoteAccepted", "Confirmed", "Preparing", "Delivering", "Delivered"].includes(order.status) ? "order-tracking__step--active" : ""}`}>
            <span className="order-tracking__step-num">2</span>
            <span className="order-tracking__step-text">Duyệt & Chuẩn bị</span>
          </li>
          <li className={`order-tracking__step ${["Delivering", "Delivered"].includes(order.status) ? "order-tracking__step--active" : ""}`}>
            <span className="order-tracking__step-num">3</span>
            <span className="order-tracking__step-text">Đang giao</span>
          </li>
          <li className={`order-tracking__step ${["Delivered"].includes(order.status) ? "order-tracking__step--active" : ""}`}>
            <span className="order-tracking__step-num">4</span>
            <span className="order-tracking__step-text">Hoàn tất</span>
          </li>
        </ul>
      </section>

      {/* Main Grid: Details vs Actions */}
      <div className="order-tracking__grid">
        {/* Left Side: Order Details */}
        <div className="order-tracking__details">
          {order.managerMessage && (
            <div className="order-tracking__message-box">
              <h3>Tin nhắn từ cửa hàng:</h3>
              <p>"{order.managerMessage}"</p>
            </div>
          )}

          {/* Pricing Card */}
          <section className="order-tracking__card" aria-labelledby="bill-heading">
            <h2 className="order-tracking__card-title" id="bill-heading">Thông tin thanh toán</h2>
            <div className="order-tracking__bill-row">
              <span>Tạm tính (Tiền hàng)</span>
              <strong>{money.format(order.subtotal)}</strong>
            </div>
            <div className="order-tracking__bill-row">
              <span>Khoảng cách giao hàng</span>
              <span>{order.distanceKm !== null ? `${order.distanceKm.toFixed(1)} km` : "Chưa xác định"}</span>
            </div>
            <div className="order-tracking__bill-row">
              <span>Phí vận chuyển</span>
              <strong>
                {order.shippingFee === null ? (
                  <span className="order-tracking__fee-waiting">Đang chờ cửa hàng báo giá</span>
                ) : (
                  money.format(order.shippingFee)
                )}
              </strong>
            </div>
            <div className="order-tracking__bill-divider" />
            <div className="order-tracking__bill-row order-tracking__bill-row--total">
              <span>Tổng tiền thanh toán</span>
              <strong>{money.format(order.total)}</strong>
            </div>
            <div className="order-tracking__payment-status">
              Trạng thái thanh toán: 
              <span className={`order-tracking__pay-badge order-tracking__pay-badge--${order.paymentStatus.toLowerCase()}`}>
                {getPaymentStatusLabel(order.paymentStatus)}
              </span>
            </div>
          </section>
        </div>

        {/* Right Side: Contextual Action Forms */}
        <div className="order-tracking__actions">
          {/* Customer Accept Quote actions */}
          {!isManager && order.status === "AwaitingShippingQuote" && order.shippingFee !== null && (
            <section className="order-tracking__card order-tracking__card--accent" aria-labelledby="accept-quote-heading">
              <h2 className="order-tracking__card-title" id="accept-quote-heading">Phê duyệt báo giá giao hàng</h2>
              <p className="order-tracking__action-desc">
                Cửa hàng đã tính phí giao hàng là <strong>{money.format(order.shippingFee)}</strong> cho khoảng cách {order.distanceKm?.toFixed(1)} km. Vui lòng xác nhận để chúng tôi chuẩn bị rau củ giao tới bạn.
              </p>
              <div className="order-tracking__action-buttons">
                <button
                  type="button"
                  className="order-tracking__btn order-tracking__btn--primary"
                    onClick={() => void handleAction(() => acceptQuote(orderId, accessToken))}
                  disabled={isSubmitting}
                >
                  Đồng ý & Tiếp tục
                </button>
                <button
                  type="button"
                  className="order-tracking__btn order-tracking__btn--danger"
                  onClick={() => void handleAction(() => cancelOrder(orderId))}
                  disabled={isSubmitting}
                >
                  Hủy đơn
                </button>
              </div>
            </section>
          )}

          {/* Customer General Cancel order */}
          {!isManager && (order.status === "Pending" || order.status === "AwaitingShippingQuote") && (
            <section className="order-tracking__card" aria-label="Customer Cancel order">
              <button
                type="button"
                className="order-tracking__btn order-tracking__btn--secondary"
                onClick={() => void handleAction(() => cancelOrder(orderId))}
                disabled={isSubmitting}
              >
                Yêu cầu hủy đơn hàng
              </button>
            </section>
          )}

          {/* MANAGER PANEL */}
          {isManager && (
            <section className="order-tracking__card order-tracking__card--manager" aria-labelledby="manager-ops-heading">
              <h2 className="order-tracking__card-title" id="manager-ops-heading">Quản trị & Phê duyệt vận đơn</h2>
              
              {/* Shipping Quote Form */}
              {order.status === "AwaitingShippingQuote" && (
                <form
                  className="order-tracking__quote-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleAction(() => setShippingQuote(orderId, Number(shippingFeeInput), managerMessageInput, accessToken));
                  }}
                >
                  <h3>Thiết lập báo giá vận chuyển</h3>
                  <label className="order-tracking__form-field">
                    <span>Phí ship (VND)</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={shippingFeeInput}
                      onChange={(e) => setShippingFeeInput(e.target.value)}
                    />
                  </label>
                  <label className="order-tracking__form-field">
                    <span>Ghi chú gửi khách hàng</span>
                    <textarea
                      placeholder="Nhập ghi chú khoảng cách, lý do phụ thu nếu có..."
                      rows={3}
                      value={managerMessageInput}
                      onChange={(e) => setManagerMessageInput(e.target.value)}
                    />
                  </label>
                  <button
                    type="submit"
                    className="order-tracking__btn order-tracking__btn--primary"
                    disabled={isSubmitting}
                  >
                    Gửi báo giá vận chuyển
                  </button>
                </form>
              )}

              {/* Status Update Actions Grid */}
              <div className="order-tracking__manager-actions">
                <h3>Chuyển trạng thái giao vận</h3>
                <div className="order-tracking__actions-grid">
                  {["Pending", "QuoteAccepted", "Confirmed"].includes(order.status) && (
                    <button
                      type="button"
                      className="order-tracking__btn order-tracking__btn--primary"
                      onClick={() => void handleAction(() => markPreparing(orderId, accessToken))}
                      disabled={isSubmitting}
                    >
                      Bắt đầu xử lý đơn
                    </button>
                  )}
                  {order.status === "Preparing" && (
                    <button
                      type="button"
                      className="order-tracking__btn order-tracking__btn--primary"
                      onClick={() => void handleAction(() => markDelivering(orderId, accessToken))}
                      disabled={isSubmitting}
                    >
                      Bắt đầu giao hàng
                    </button>
                  )}

                  {/* Delivering -> Delivered / Failed */}
                  {order.status === "Delivering" && (
                    <>
                      <button
                        type="button"
                        className="order-tracking__btn order-tracking__btn--success"
                        onClick={() => void handleAction(() => markDelivered(orderId, accessToken))}
                        disabled={isSubmitting}
                      >
                        Giao thành công
                      </button>
                      <button
                        type="button"
                        className="order-tracking__btn order-tracking__btn--warning"
                        onClick={() => void handleAction(() => markDeliveryFailed(orderId, accessToken))}
                        disabled={isSubmitting}
                      >
                        Giao thất bại
                      </button>
                    </>
                  )}

                  {/* Delivered -> Confirm COD Payment */}
                  {order.status === "Delivered" && order.paymentStatus === "Pending" && (
                    <button
                      type="button"
                      className="order-tracking__btn order-tracking__btn--success"
                      onClick={() => void handleAction(() => confirmCodPayment(orderId, accessToken))}
                      disabled={isSubmitting}
                    >
                      Xác nhận đã thu tiền COD
                    </button>
                  )}

                  {/* Delivery failed -> Returned */}
                  {order.status === "DeliveryFailed" && (
                    <button
                      type="button"
                      className="order-tracking__btn order-tracking__btn--danger"
                      onClick={() => void handleAction(() => markReturned(orderId, accessToken))}
                      disabled={isSubmitting}
                    >
                      Đổi trả hàng
                    </button>
                  )}

                  {/* General Cancel order */}
                  {!["Cancelled", "Delivered", "Returned", "Expired", "DeliveryFailed"].includes(order.status) && (
                    <button
                      type="button"
                      className="order-tracking__btn order-tracking__btn--danger"
                      onClick={() => void handleAction(() => cancelOrder(orderId, accessToken))}
                      disabled={isSubmitting}
                    >
                      Hủy đơn hàng
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
