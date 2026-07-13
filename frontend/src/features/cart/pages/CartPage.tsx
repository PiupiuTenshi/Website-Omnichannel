import { useEffect, useState } from "react";
import { getCart, removeCartItem, reserveCart, setCartItem } from "../api/cartApi";
import type { Cart } from "../types/cartTypes";
import "./CartPage.css";

const currencyFormatter = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState("");
  const [reservationMessage, setReservationMessage] = useState("");
  useEffect(() => { void getCart().then(setCart).catch(() => setError("Không thể tải giỏ hàng.")); }, []);
  async function updateQuantity(productVariantId: string, quantity: number) { try { setCart(await setCartItem(productVariantId, quantity)); setReservationMessage(""); } catch { setError("Không thể cập nhật số lượng."); } }
  async function removeItem(productVariantId: string) { try { setCart(await removeCartItem(productVariantId)); setReservationMessage(""); } catch { setError("Không thể xóa sản phẩm."); } }
  async function reserveInventory() { try { const reservation = await reserveCart(); setReservationMessage(`Tồn kho được giữ đến ${new Intl.DateTimeFormat("vi-VN", { timeStyle: "short" }).format(new Date(reservation.expiresAtUtc))}.`); } catch { setError("Không thể giữ tồn kho. Vui lòng kiểm tra lại sản phẩm."); } }
  if (cart === null) return <p className="app-container">Đang tải giỏ hàng…</p>;
  return <section className="cart-page app-container" aria-labelledby="cart-title"><header><h1 id="cart-title">Giỏ hàng</h1><p>Giá và tồn kho sẽ được xác nhận lại khi đặt hàng.</p></header>{error ? <p className="cart-page__error" role="alert">{error}</p> : null}{reservationMessage ? <p className="cart-page__reservation" role="status">{reservationMessage}</p> : null}{cart.items.length === 0 ? <p>Giỏ hàng của bạn đang trống.</p> : <><ul className="cart-page__items">{cart.items.map((item) => <li key={item.productVariantId} className="cart-page__item"><div><h2>{item.name}</h2><p>{item.variantName}</p><strong>{currencyFormatter.format(item.unitPrice)}</strong></div><label>Số lượng<input aria-label={`Số lượng ${item.name}`} min={item.isWeighed ? 0.1 : 1} step={item.isWeighed ? 0.1 : 1} type="number" value={item.quantity} onChange={(event) => void updateQuantity(item.productVariantId, Number(event.target.value))} /></label><strong>{currencyFormatter.format(item.lineTotal)}</strong><button type="button" onClick={() => void removeItem(item.productVariantId)}>Xóa</button></li>)}</ul><footer className="cart-page__summary"><strong>Tạm tính: {currencyFormatter.format(cart.subtotal)}</strong><button type="button" onClick={() => void reserveInventory()}>Giữ tồn kho 10 phút</button></footer></>}</section>;
}
