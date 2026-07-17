import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCart, removeCartItem, setCartItem } from "../api/cartApi";
import type { Cart } from "../types/cartTypes";
import "./CartPage.css";

const currencyFormatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    getCart()
      .then((loadedCart) => {
        if (!isCancelled) {
          setCart(loadedCart);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setError("Không thể tải giỏ hàng.");
          setIsLoading(false);
        }
      });
    return () => { isCancelled = true; };
  }, []);

  async function updateQuantity(productVariantId: string, quantity: number) {
    try {
      setCart(await setCartItem(productVariantId, quantity));
    } catch {
      setError("Không thể cập nhật số lượng.");
    }
  }

  async function removeItem(productVariantId: string) {
    try {
      setCart(await removeCartItem(productVariantId));
    } catch {
      setError("Không thể xóa sản phẩm.");
    }
  }

  if (isLoading) {
    return <p className="app-container">Đang tải giỏ hàng…</p>;
  }

  if (error && cart === null) {
    return (
      <section className="cart-page app-container" aria-labelledby="cart-title">
        <header>
          <h1 id="cart-title">Giỏ hàng</h1>
        </header>
        <p className="cart-page__error" role="alert">{error}</p>
        <p><Link to="/">Tiếp tục mua sắm</Link></p>
      </section>
    );
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
      {cart.items.length === 0 ? (
        <p>Giỏ hàng của bạn đang trống. <Link to="/">Tiếp tục mua sắm</Link>.</p>
      ) : (
        <>
          <ul className="cart-page__items">
            {cart.items.map((item) => (
              <li key={item.productVariantId} className="cart-page__item">
                <div>
                  <h2>{item.name}</h2>
                  <p>{item.variantName}</p>
                  <strong>{currencyFormatter.format(item.unitPrice)}</strong>
                </div>
                <label>
                  Số lượng
                  <input
                    aria-label={`Số lượng ${item.name}`}
                    min={item.isWeighed ? 0.1 : 1}
                    step={item.isWeighed ? 0.1 : 1}
                    type="number"
                    value={item.quantity}
                    onChange={(event) => void updateQuantity(item.productVariantId, Number(event.target.value))}
                  />
                </label>
                <strong>{currencyFormatter.format(item.lineTotal)}</strong>
                <button type="button" onClick={() => void removeItem(item.productVariantId)}>Xóa</button>
              </li>
            ))}
          </ul>
          <footer className="cart-page__summary">
            <strong>Tạm tính: {currencyFormatter.format(cart.subtotal)}</strong>
            <div className="cart-page__actions">
              <Link className="cart-page__checkout-link" to="/checkout">Tiếp tục thanh toán</Link>
            </div>
          </footer>
        </>
      )}
    </section>
  );
}
