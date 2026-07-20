import { useState } from "react";
import { Link } from "react-router-dom";
import { reserveCart } from "../api/cartApi";
import { useCart } from "../hooks/useCart";
import "./CartPage.css";

const currencyFormatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

function getPortionDetails(quantity: number) {
  const PRESETS = [
    { label: "5kg", weight: 5 },
    { label: "2kg", weight: 2 },
    { label: "1kg", weight: 1 },
    { label: "500g", weight: 0.5 },
    { label: "200g", weight: 0.2 },
  ];
  const q10 = Math.round(quantity * 10);
  for (const p of PRESETS) {
    const w10 = Math.round(p.weight * 10);
    if (q10 % w10 === 0) {
      return { count: q10 / w10, unitWeight: p.weight, label: p.label };
    }
  }
  return { count: q10, unitWeight: 0.1, label: "100g" };
}

export function CartPage() {
  const { cart, removeItem: removeCartItem, updateItem: setCartItem } = useCart();
  const [error, setError] = useState("");
  const [reservationMessage, setReservationMessage] = useState("");

  async function updateQuantity(productVariantId: string, quantity: number) {
    try {
      await setCartItem(productVariantId, quantity);
      setReservationMessage("");
    } catch {
      setError("Không thể cập nhật số lượng.");
    }
  }

  async function removeItem(productVariantId: string) {
    try {
      await removeCartItem(productVariantId);
      setReservationMessage("");
    } catch {
      setError("Không thể xóa sản phẩm.");
    }
  }

  async function reserveInventory() {
    try {
      const reservation = await reserveCart();
      setReservationMessage(`Tồn kho được giữ đến ${new Intl.DateTimeFormat("vi-VN", { timeStyle: "short" }).format(new Date(reservation.expiresAtUtc))}.`);
    } catch {
      setError("Không thể giữ tồn kho. Vui lòng kiểm tra lại sản phẩm.");
    }
  }

  if (cart === null) {
    return <p className="app-container">Đang tải giỏ hàng…</p>;
  }

  return (
    <section className="cart-page app-container" aria-labelledby="cart-title">
      <header>
        <h1 id="cart-title">Giỏ hàng</h1>
        <p>Giá và tồn kho chỉ được giữ trong lúc hệ thống tạo đơn thanh toán.</p>
      </header>
      {error ? <p className="cart-page__error" role="alert">{error}</p> : null}
      {reservationMessage ? <p className="cart-page__reservation" role="status">{reservationMessage}</p> : null}
      {cart.items.length === 0 ? (
        <p>Giỏ hàng của bạn đang trống. <Link to="/">Tiếp tục mua sắm</Link>.</p>
      ) : (
        <>
          <ul className="cart-page__items">
            {cart.items.map((item) => {
              const portion = item.isWeighed ? getPortionDetails(item.quantity) : null;
              
              return (
                <li key={item.productVariantId} className="cart-page__item">
                  <div>
                    <h2>{item.name}</h2>
                    <p>{item.isWeighed && portion ? `${item.variantName} - ${portion.label}` : item.variantName}</p>
                    <strong>{currencyFormatter.format(item.unitPrice)}</strong>
                  </div>
                  <label>
                    Số lượng
                    <input
                      aria-label={`Số lượng ${item.name}`}
                      min={1}
                      step={1}
                      type="number"
                      value={portion ? portion.count : item.quantity}
                      onChange={(event) => {
                        const val = Number(event.target.value);
                        void updateQuantity(item.productVariantId, portion ? val * portion.unitWeight : val);
                      }}
                    />
                  </label>
                  <strong>{currencyFormatter.format(item.lineTotal)}</strong>
                  <button type="button" onClick={() => void removeItem(item.productVariantId)}>Xóa</button>
                </li>
              );
            })}
          </ul>
          <footer className="cart-page__summary">
            <strong>Tạm tính: {currencyFormatter.format(cart.subtotal)}</strong>
            <button type="button" onClick={() => void reserveInventory()}>Giữ tồn kho 10 phút</button>
            <div className="cart-page__actions">
              <Link className="cart-page__checkout-link" to="/checkout">Tiếp tục thanh toán</Link>
            </div>
          </footer>
        </>
      )}
    </section>
  );
}
