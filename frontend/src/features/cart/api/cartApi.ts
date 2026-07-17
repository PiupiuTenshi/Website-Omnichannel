import { requestJson } from "../../../shared/api/apiClient";
import type { Cart, CartReservation } from "../types/cartTypes";

const CART_SESSION_KEY = "grocery-store-cart-session";

let memorySessionId: string | null = null;

export function getCartSessionId(): string {
  if (memorySessionId !== null) return memorySessionId;

  // 1. Try LocalStorage
  try {
    const localId = window.localStorage.getItem(CART_SESSION_KEY);
    if (isValidSessionId(localId)) {
      return localId!;
    }
  } catch {
    // Ignore
  }

  // 2. Try SessionStorage
  try {
    const sessionId = window.sessionStorage.getItem(CART_SESSION_KEY);
    if (isValidSessionId(sessionId)) {
      return sessionId!;
    }
  } catch {
    // Ignore
  }

  const sessionId = createGuestSessionId();

  let writeSuccessful = false;

  try {
    window.localStorage.setItem(CART_SESSION_KEY, sessionId);
    if (window.localStorage.getItem(CART_SESSION_KEY) === sessionId) {
      writeSuccessful = true;
    }
  } catch {
    // Ignore
  }

  try {
    window.sessionStorage.setItem(CART_SESSION_KEY, sessionId);
    if (window.sessionStorage.getItem(CART_SESSION_KEY) === sessionId) {
      writeSuccessful = true;
    }
  } catch {
    // Ignore
  }

  if (!writeSuccessful) {
    memorySessionId = sessionId;
  }

  return sessionId;
}

export function startNewGuestCartSession(): void {
  const sessionId = createGuestSessionId();
  memorySessionId = sessionId;

  try {
    window.localStorage.removeItem(CART_SESSION_KEY);
    window.localStorage.setItem(CART_SESSION_KEY, sessionId);
  } catch {
    // The in-memory fallback keeps the previous guest cart isolated for this tab.
  }

  try {
    window.sessionStorage.removeItem(CART_SESSION_KEY);
    window.sessionStorage.setItem(CART_SESSION_KEY, sessionId);
  } catch {
    // The in-memory fallback keeps the previous guest cart isolated for this tab.
  }
}

function createGuestSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (character) {
    const randomValue = (Math.random() * 16) | 0;
    const variant = character === "x" ? randomValue : (randomValue & 0x3) | 0x8;
    return variant.toString(16);
  });
}

function isValidSessionId(id: string | null): boolean {
  return (
    id !== null &&
    id !== "undefined" &&
    id !== "null" &&
    id.trim() !== ""
  );
}

function getAccessToken(): string | null {
  try {
    const serializedSession = sessionStorage.getItem("grocery-store.auth-session");
    if (serializedSession === null) return null;
    const session = JSON.parse(serializedSession);
    return new Date(session.accessTokenExpiresAtUtc) > new Date() ? session.accessToken : null;
  } catch {
    return null;
  }
}

function cartHeaders(): HeadersInit {
  const sessionId = getCartSessionId();
  const headers: Record<string, string> = { "X-Cart-Session": sessionId };
  const token = getAccessToken();
  if (token !== null) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (import.meta.env.DEV) {
    console.debug("[CartAPI] cartHeaders → sessionId=%s, hasToken=%s", sessionId, token !== null);
  }
  return headers;
}

export async function getCart(): Promise<Cart> {
  if (import.meta.env.DEV) console.debug("[CartAPI] getCart() called");
  const cart = await requestJson<Cart>("/cart", { headers: cartHeaders() });
  if (import.meta.env.DEV) console.debug("[CartAPI] getCart() → %d items", cart.items.length);
  return cart;
}

export async function setCartItem(productVariantId: string, quantity: number): Promise<Cart> {
  if (import.meta.env.DEV) console.debug("[CartAPI] setCartItem(%s, %s) called", productVariantId, quantity);
  const cart = await requestJson<Cart>("/cart/items", { method: "PUT", headers: cartHeaders(), body: JSON.stringify({ productVariantId, quantity }) });
  if (import.meta.env.DEV) console.debug("[CartAPI] setCartItem() → %d items", cart.items.length);
  return cart;
}

export function removeCartItem(productVariantId: string): Promise<Cart> { return requestJson<Cart>(`/cart/items/${productVariantId}`, { method: "DELETE", headers: cartHeaders() }); }
export function mergeGuestCart(accessToken: string): Promise<Cart> { return requestJson<Cart>("/cart/merge", { method: "POST", headers: { ...cartHeaders(), Authorization: `Bearer ${accessToken}` } }); }
export function reserveCart(): Promise<CartReservation> { return requestJson<CartReservation>("/cart/reservations", { method: "POST", headers: cartHeaders() }); }
