import { requestJson } from "../../../shared/api/apiClient";
import type { Cart, CartReservation } from "../types/cartTypes";

const CART_SESSION_KEY = "grocery-store-cart-session";

export function getCartSessionId(): string {
  const existingSessionId = window.localStorage.getItem(CART_SESSION_KEY);
  if (existingSessionId !== null) return existingSessionId;
  const sessionId = crypto.randomUUID();
  window.localStorage.setItem(CART_SESSION_KEY, sessionId);
  return sessionId;
}

function cartHeaders(): HeadersInit { return { "X-Cart-Session": getCartSessionId() }; }
export function getCart(): Promise<Cart> { return requestJson<Cart>("/cart", { headers: cartHeaders() }); }
export function setCartItem(productVariantId: string, quantity: number): Promise<Cart> { return requestJson<Cart>("/cart/items", { method: "PUT", headers: cartHeaders(), body: JSON.stringify({ productVariantId, quantity }) }); }
export function removeCartItem(productVariantId: string): Promise<Cart> { return requestJson<Cart>(`/cart/items/${productVariantId}`, { method: "DELETE", headers: cartHeaders() }); }
export function reserveCart(): Promise<CartReservation> { return requestJson<CartReservation>("/cart/reservations", { method: "POST", headers: cartHeaders() }); }
