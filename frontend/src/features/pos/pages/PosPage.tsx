import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth";
import { checkoutPos, searchPosProducts } from "../api/posApi";
import type { PosCartItem, PosProduct } from "../types/posTypes";
import "./PosPage.css";

interface SuccessOrder {
  orderId: string;
  orderCode: string;
  exactAmount: number;
  amountDue: number;
  changeAmount: number;
  items: PosCartItem[];
  paymentMethod: "Cash" | "BankTransfer";
  cashReceived: number;
}

export function PosPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "BankTransfer">("Cash");
  const [cashReceived, setCashReceived] = useState("");
  const [error, setError] = useState("");
  const [successOrder, setSuccessOrder] = useState<SuccessOrder | null>(null);

  // Modals / Overlays
  const [weighingProduct, setWeighingProduct] = useState<PosProduct | null>(null);
  const [vegetableWeight, setVegetableWeight] = useState("1.0");
  const [showPrintBill, setShowPrintBill] = useState(false);
  const [tagProduct] = useState<PosCartItem | PosProduct | null>(null);

  // Mobile View
  const [showMobileCart, setShowMobileCart] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeBuffer = useRef("");
  const lastKeyTime = useRef(0);

  // Autofocus on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    void document.documentElement.requestFullscreen?.().catch(() => {
      // Browsers may require a direct user gesture; the POS still uses the dedicated full-screen layout.
    });

    return () => {
      if (document.fullscreenElement) {
        void document.exitFullscreen?.();
      }
    };
  }, []);

  const exitPos = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen?.();
    }
    navigate("/seller/dashboard");
  };

  const printReceipt = () => {
    if (successOrder === null) return;

    const printWindow = window.open("", "pos-receipt-print", "width=460,height=720");
    if (printWindow === null) {
      setError("Trình duyệt đã chặn cửa sổ in. Hãy cho phép mở cửa sổ bật lên rồi thử lại.");
      return;
    }

    const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);
    const items = successOrder.items.map((item) => `<tr><td>${escapeHtml(item.productName)}<br><small>${escapeHtml(item.variantName)}</small></td><td>${item.quantity.toFixed(item.isWeighed ? 1 : 0)}</td><td>${(item.quantity * item.price).toLocaleString("vi-VN")}</td></tr>`).join("");
    const paymentLabel = successOrder.paymentMethod === "Cash" ? "Tiền mặt" : "Chuyển khoản";
    const cashDetails = successOrder.paymentMethod === "Cash"
      ? `<p>Khách đưa: ${successOrder.cashReceived.toLocaleString("vi-VN")} đ</p><p>Trả lại: ${successOrder.changeAmount.toLocaleString("vi-VN")} đ</p>`
      : "";

    printWindow.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Hóa đơn ${escapeHtml(successOrder.orderCode)}</title><style>
      @page { size: 58mm auto; margin: 2mm; } * { box-sizing: border-box; } body { width: 54mm; margin: 0; color: #000; font-family: Arial, sans-serif; font-size: 10px; } h1, h2, p { margin: 0; } header, footer { text-align: center; } h1 { font-size: 13px; } h2 { font-size: 12px; margin-top: 5px; } .divider { border-top: 1px dashed #000; margin: 6px 0; } table { width: 100%; border-collapse: collapse; } th, td { padding: 2px 0; text-align: left; vertical-align: top; } th:nth-child(2), td:nth-child(2) { width: 8mm; text-align: center; } th:last-child, td:last-child { width: 16mm; text-align: right; } small { font-size: 8px; } .total { font-size: 11px; font-weight: 700; } footer { margin-top: 8px; }
    </style></head><body><header><h1>TẠP HÓA CHỊ TỎ</h1><p>Địa chỉ: 204 Tô Hiến Thành, Đà Lạt</p><p>SĐT: 0898087507</p><div class="divider"></div><h2>HÓA ĐƠN BÁN HÀNG</h2><p>Mã đơn: ${escapeHtml(successOrder.orderCode)}</p><p>Ngày: ${new Date().toLocaleString("vi-VN")}</p></header><div class="divider"></div><table><thead><tr><th>Tên SP</th><th>SL</th><th>T.Tiền</th></tr></thead><tbody>${items}</tbody></table><div class="divider"></div><section><p>Tổng tiền hàng: ${successOrder.exactAmount.toLocaleString("vi-VN")} đ</p><p class="total">Thanh toán (${paymentLabel}): ${successOrder.amountDue.toLocaleString("vi-VN")} đ</p>${cashDetails}</section><div class="divider"></div><footer><p>Cảm ơn quý khách!</p><p>Hẹn gặp lại!</p></footer><script>window.onload = () => { window.focus(); window.print(); };</script></body></html>`);
    printWindow.document.close();
  };

  const addProductToCart = useCallback((prod: PosProduct, weight?: number) => {
    if (prod.availableQuantity <= 0) {
      setError("Sản phẩm đã hết hàng trong kho.");
      return;
    }

    if (prod.isWeighed && weight === undefined) {
      // Open weighing scale modal
      setVegetableWeight("1.0");
      setWeighingProduct(prod);
      return;
    }

    const qtyToAdd = weight ?? 1;

    setCart(prev => {
      const existing = prev.find(item => item.productVariantId === prod.productVariantId);
      if (existing) {
        const newQty = existing.quantity + qtyToAdd;
        if (newQty > prod.availableQuantity) {
          setError(`Không thể thêm. Vượt quá tồn kho khả dụng (${prod.availableQuantity} ${prod.unitCode}).`);
          return prev;
        }
        return prev.map(item =>
          item.productVariantId === prod.productVariantId
            ? { ...item, quantity: newQty }
            : item
        );
      } else {
        return [...prev, {
          productVariantId: prod.productVariantId,
          productName: prod.productName,
          variantName: prod.variantName,
          sku: prod.sku,
          barcode: prod.barcode,
          unitCode: prod.unitCode,
          price: prod.price,
          quantity: qtyToAdd,
          isWeighed: prod.isWeighed
        }];
      }
    });

    setQuery("");
    setProducts([]);
    searchInputRef.current?.focus();
  }, []);

  const handleBarcodeScan = useCallback(async (barcode: string) => {
    if (!session) return;
    try {
      setError("");
      const results = await searchPosProducts(session.accessToken, barcode);
      const found = results.find(p => p.barcode === barcode || p.sku === barcode);
      if (found) {
        addProductToCart(found);
      } else {
        setError(`Không tìm thấy sản phẩm có mã: ${barcode}`);
      }
    } catch {
      setError("Lỗi khi tìm quét barcode.");
    }
  }, [session, addProductToCart]);

  const handleSearchChange = useCallback(async (val: string) => {
    setQuery(val);
    if (!session) return;
    if (val.trim().length === 0) {
      setProducts([]);
      return;
    }
    try {
      const data = await searchPosProducts(session.accessToken, val);
      setProducts(data);
    } catch {
      setError("Không thể tìm sản phẩm.");
    }
  }, [session]);

  // Global Barcode Scanner Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      
      // Barcode scanners type rapidly (e.g. interval < 50ms)
      if (currentTime - lastKeyTime.current > 100) {
        barcodeBuffer.current = "";
      }
      lastKeyTime.current = currentTime;

      if (e.key === "Enter") {
        if (barcodeBuffer.current.length >= 3) {
          const barcode = barcodeBuffer.current;
          barcodeBuffer.current = "";
          e.preventDefault();
          void handleBarcodeScan(barcode);
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBarcodeScan]);

  const updateQuantity = (variantId: string, delta: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.productVariantId === variantId) {
          const target = products.find(p => p.productVariantId === variantId) ?? item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          const maxQty = ("availableQuantity" in target) ? (target.availableQuantity as number) : 999;
          if (newQty > maxQty) {
            setError("Vượt quá số lượng tồn khả dụng.");
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter((x): x is PosCartItem => x !== null)
    );
  };

  const removeCartItem = (variantId: string) => {
    setCart(prev => prev.filter(item => item.productVariantId !== variantId));
  };

  // Calculations
  const exactAmount = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  
  // Cash rounding to 1,000 VND
  const roundedAmount = paymentMethod === "Cash"
    ? Math.ceil(exactAmount / 1000) * 1000
    : exactAmount;

  const calculatedChange = Number(cashReceived) >= roundedAmount
    ? Number(cashReceived) - roundedAmount
    : 0;

  // Preset cash buttons helpers
  const handleQuickCash = (val: number) => {
    const current = Number(cashReceived) || 0;
    setCashReceived((current + val).toString());
  };

  const handleCheckout = async () => {
    if (!session || cart.length === 0) return;
    if (paymentMethod === "Cash" && (Number(cashReceived) || 0) < roundedAmount) {
      setError("Số tiền khách đưa không đủ.");
      return;
    }

    try {
      setError("");
      const requestPayload = {
        items: cart.map(item => ({
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          unitPrice: item.price
        })),
        paymentMethod,
        cashReceived: paymentMethod === "Cash" ? Number(cashReceived) : null
      };

      const response = await checkoutPos(session.accessToken, requestPayload);
      setSuccessOrder({
        ...response,
        items: [...cart],
        paymentMethod,
        cashReceived: paymentMethod === "Cash" ? Number(cashReceived) : response.amountDue
      });
      setCart([]);
      setCashReceived("");
      setShowPrintBill(true);
      setShowMobileCart(false);
    } catch (err) {
      const errMsg = (err as { message?: string })?.message ?? "Thanh toán thất bại. Vui lòng kiểm tra lại tồn kho.";
      setError(errMsg);
    }
  };

  return (
    <section className="pos-page" aria-label="POS Register">
      <button type="button" className="pos-exit-button" onClick={exitPos} aria-label="Thoát quầy bán hàng">
        Thoát POS
      </button>
      <button type="button" className="pos-tag-page-button" onClick={() => navigate("/seller/price-tags")}>
        Trang in tag giá
      </button>
      <div className="pos-layout">
        
        {/* Main Content Area */}
        <div className="pos-main">
          <div className="pos-search-box card">
            <h1 className="pos-title">POS Bán Hàng</h1>
            <div className="form__field">
              <input
                ref={searchInputRef}
                type="text"
                className="form__input pos-search-input"
                placeholder="Quét mã vạch hoặc gõ tên sản phẩm, SKU..."
                value={query}
                onChange={e => void handleSearchChange(e.target.value)}
              />
            </div>
            
            {/* Search Results */}
            {query.trim().length > 0 && (
              <div className="pos-search-results">
                {products.length > 0 ? (
                  products.map(p => (
                    <button
                      key={p.productVariantId}
                      type="button"
                      className="pos-search-item"
                      onClick={() => addProductToCart(p)}
                    >
                      <div className="pos-search-item__info">
                        <strong className="pos-search-item__name">{p.productName}</strong>
                        <span className="pos-search-item__variant">{p.variantName} ({p.sku})</span>
                      </div>
                      <div className="pos-search-item__pricing">
                        <span className="pos-search-item__price">{p.price.toLocaleString()} đ / {p.unitCode}</span>
                        <span className={`pos-search-item__stock ${p.availableQuantity <= 5 ? 'text-danger font-bold' : ''}`}>
                          Tồn: {p.availableQuantity}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="pos-search-no-results">
                    Không tìm thấy sản phẩm
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart View (Desktop/Tablet) */}
          <div className="pos-cart card">
            <h2 className="pos-section-title">Giỏ hàng</h2>
            {cart.length === 0 ? (
              <p className="no-data">Chưa có sản phẩm nào. Hãy quét barcode hoặc tìm kiếm.</p>
            ) : (
              <div className="pos-table-wrapper">
                <table className="table pos-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Giá</th>
                      <th>Số lượng</th>
                      <th>Thành tiền</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.productVariantId}>
                        <td>
                          <div className="font-bold">{item.productName}</div>
                          <div className="table__variant-name">{item.variantName}</div>
                          <code>{item.sku}</code>
                        </td>
                        <td>{item.price.toLocaleString()} đ</td>
                        <td>
                          <div className="quantity-controls">
                            <button
                              type="button"
                              className="btn btn--sm btn--secondary"
                              onClick={() => updateQuantity(item.productVariantId, item.isWeighed ? -0.1 : -1)}
                            >
                              -
                            </button>
                            <span className="quantity-display">{item.quantity.toFixed(item.isWeighed ? 1 : 0)}</span>
                            <button
                              type="button"
                              className="btn btn--sm btn--secondary"
                              onClick={() => updateQuantity(item.productVariantId, item.isWeighed ? 0.1 : 1)}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td>{(item.quantity * item.price).toLocaleString()} đ</td>
                        <td>
                          <div className="pos-row-actions">
                            <button
                              type="button"
                              className="btn btn--danger btn--sm"
                              onClick={() => removeCartItem(item.productVariantId)}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Checkout Area */}
        <div className={`pos-sidebar ${showMobileCart ? 'pos-sidebar--show' : ''}`}>
          <div className="pos-sidebar-container card">
            <div className="pos-sidebar-header">
              <h2 className="pos-section-title">Thanh toán</h2>
              <button
                type="button"
                className="btn btn--secondary btn--sm mobile-only"
                onClick={() => setShowMobileCart(false)}
              >
                Đóng
              </button>
            </div>

            {error && <div className="alert alert--danger" role="alert">{error}</div>}

            <div className="pos-summary">
              <div className="pos-summary-row">
                <span>Tổng tiền hàng:</span>
                <strong>{exactAmount.toLocaleString()} đ</strong>
              </div>

              <div className="pos-payment-methods">
                <span className="form__label">Phương thức thanh toán:</span>
                <div className="pos-payment-options">
                  <button
                    type="button"
                    className={`btn pos-payment-btn ${paymentMethod === "Cash" ? "btn--primary" : "btn--secondary"}`}
                    onClick={() => { setPaymentMethod("Cash"); setCashReceived(""); }}
                  >
                    Tiền mặt
                  </button>
                  <button
                    type="button"
                    className={`btn pos-payment-btn ${paymentMethod === "BankTransfer" ? "btn--primary" : "btn--secondary"}`}
                    onClick={() => { setPaymentMethod("BankTransfer"); setCashReceived(""); }}
                  >
                    Chuyển khoản QR
                  </button>
                </div>
              </div>

              {paymentMethod === "Cash" ? (
                <div className="cash-panel">
                  <div className="pos-summary-row highlight">
                    <span>Số tiền cần trả (Làm tròn):</span>
                    <strong>{roundedAmount.toLocaleString()} đ</strong>
                  </div>

                  <label className="form__field">
                    <span className="form__label">Tiền khách đưa:</span>
                    <input
                      type="number"
                      className="form__input"
                      value={cashReceived}
                      placeholder={roundedAmount.toString()}
                      onChange={e => setCashReceived(e.target.value)}
                    />
                  </label>

                  {/* Quick Cash Options */}
                  <div className="quick-cash-grid">
                    <button type="button" onClick={() => setCashReceived(roundedAmount.toString())}>Đủ</button>
                    <button type="button" onClick={() => handleQuickCash(10000)}>+10k</button>
                    <button type="button" onClick={() => handleQuickCash(20000)}>+20k</button>
                    <button type="button" onClick={() => handleQuickCash(50000)}>+50k</button>
                    <button type="button" onClick={() => handleQuickCash(100000)}>+100k</button>
                    <button type="button" onClick={() => handleQuickCash(200000)}>+200k</button>
                    <button type="button" onClick={() => handleQuickCash(500000)}>+500k</button>
                    <button type="button" onClick={() => setCashReceived("")}>Reset</button>
                  </div>

                  <div className="pos-summary-row result">
                    <span>Tiền trả lại:</span>
                    <strong className="text-success">{calculatedChange.toLocaleString()} đ</strong>
                  </div>
                </div>
              ) : (
                <div className="qr-panel">
                  <div className="pos-summary-row highlight">
                    <span>Số tiền cần chuyển:</span>
                    <strong>{exactAmount.toLocaleString()} đ</strong>
                  </div>
                  {exactAmount > 0 && (
                    <div className="qr-box">
                      <img
                        src={`https://img.vietqr.io/image/970422-MB-0000000000000-compact.png?amount=${exactAmount}&addInfo=POS%20BantạiQuầy`}
                        alt="QR chuyển khoản VietQR"
                        className="qr-img"
                      />
                      <p className="qr-hint">Yêu cầu khách quét mã chuyển khoản chính xác số tiền.</p>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                className="btn btn--primary checkout-btn"
                disabled={cart.length === 0}
                onClick={() => void handleCheckout()}
              >
                {paymentMethod === "Cash" ? "Xác nhận & In Hóa Đơn" : "Xác nhận đã nhận chuyển khoản"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Cart Button for Mobile */}
      {cart.length > 0 && (
        <button
          type="button"
          className="mobile-cart-badge"
          onClick={() => setShowMobileCart(true)}
        >
          <span>Xem Giỏ Hàng ({cart.reduce((sum, item) => sum + item.quantity, 0).toFixed(1)})</span>
          <strong>{roundedAmount.toLocaleString()} đ</strong>
        </button>
      )}

      {/* Vegetable Scale Modal */}
      {weighingProduct && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal card">
            <h2 className="pos-section-title">Nhập trọng lượng rau củ</h2>
            <p className="modal-lead">{weighingProduct.productName} ({weighingProduct.variantName})</p>
            <div className="form__field">
              <span className="form__label">Trọng lượng cân (KG) - bước 0.1</span>
              <input
                type="number"
                step="0.1"
                min="0.1"
                className="form__input font-large"
                value={vegetableWeight}
                onChange={e => setVegetableWeight(e.target.value)}
              />
            </div>
            <div className="form__actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setWeighingProduct(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  const weightNum = parseFloat(vegetableWeight);
                  if (!isNaN(weightNum) && weightNum > 0) {
                    addProductToCart(weighingProduct, weightNum);
                    setWeighingProduct(null);
                  }
                }}
              >
                Đồng ý thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Bill Modal (58mm) */}
      {showPrintBill && successOrder && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal card print-bill-modal">
            <div className="no-print">
              <h2 className="pos-section-title">Hóa đơn thanh toán</h2>
              <p>Mã đơn hàng: <strong>{successOrder.orderCode}</strong> đã hoàn thành.</p>
            </div>

            {/* 58mm Bill Layout */}
            <div className="thermal-bill">
              <div className="thermal-bill__header">
                <h3>TẠP HÓA CHỊ TỎ</h3>
                <p>Địa chỉ: 204 Tô Hiến Thành, Đà Lạt</p>
                <p>SĐT: 0898087507</p>
                <div className="thermal-bill__divider">-------------------------</div>
                <h4>HÓA ĐƠN BÁN HÀNG</h4>
                <p>Mã đơn: {successOrder.orderCode}</p>
                <p>Ngày: {new Date().toLocaleString()}</p>
              </div>
              <div className="thermal-bill__divider">-------------------------</div>
              <table className="thermal-bill__items">
                <thead>
                  <tr>
                    <th>Tên SP</th>
                    <th>SL</th>
                    <th>T.Tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {successOrder.items.map((item: PosCartItem) => (
                    <tr key={item.productVariantId}>
                      <td>{item.productName} {item.variantName}</td>
                      <td>{item.quantity.toFixed(item.isWeighed ? 1 : 0)}</td>
                      <td>{(item.quantity * item.price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="thermal-bill__divider">-------------------------</div>
              <div className="thermal-bill__summary">
                <p>Tổng tiền hàng: {successOrder.exactAmount.toLocaleString()} đ</p>
                <p><b>Thanh toán ({successOrder.paymentMethod === "Cash" ? "Tiền mặt" : "Chuyển khoản"}): {successOrder.amountDue.toLocaleString()} đ</b></p>
                {successOrder.paymentMethod === "Cash" && (
                  <>
                    <p>Khách đưa: {successOrder.cashReceived?.toLocaleString()} đ</p>
                    <p>Trả lại: {successOrder.changeAmount.toLocaleString()} đ</p>
                  </>
                )}
              </div>
              <div className="thermal-bill__divider">-------------------------</div>
              <div className="thermal-bill__footer">
                <p>Cảm ơn quý khách!</p>
                <p>Hẹn gặp lại!</p>
              </div>
            </div>

            <div className="form__actions no-print">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => { setShowPrintBill(false); setSuccessOrder(null); }}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={printReceipt}
              >
                In hóa đơn (58mm)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Tag Print Preview (40x60mm) */}
      {tagProduct && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal card tag-preview-modal">
            <h2 className="pos-section-title no-print">Preview Tag Giá</h2>
            
            {/* Price Tag 40x60mm */}
            <div className="price-tag">
              <div className="price-tag__brand">TẠP HÓA CHỊ TỎ</div>
              <div className="price-tag__title">{tagProduct.productName}</div>
              <div className="price-tag__variant">{tagProduct.variantName}</div>
              <div className="price-tag__sku">SKU: {tagProduct.sku}</div>
              <div className="price-tag__barcode">
                <div className="price-tag__barcode-visual">|||| ||||| || |||</div>
                <span>{tagProduct.barcode}</span>
              </div>
              <div className="price-tag__price">{(tagProduct.price).toLocaleString()} đ</div>
            </div>

            <div className="form__actions no-print">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => undefined}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => window.print()}
              >
                In Tag (40x60mm)
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
