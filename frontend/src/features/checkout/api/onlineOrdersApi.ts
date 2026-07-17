import { requestJson } from "../../../shared/api/apiClient";
import { getActiveAccessToken } from "../../auth/hooks/authSession";
import { getCartSessionId } from "../../cart/api/cartApi";

export interface OnlineOrder {
  onlineOrderId: string;
  orderCode: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  shippingFee: number | null;
  total: number;
  distanceKm: number | null;
  managerMessage: string | null;
  createdAtUtc: string;
}

function headers(accessToken?: string): HeadersInit {
  const h: Record<string, string> = { "X-Cart-Session": getCartSessionId() };
  const token = accessToken ?? getActiveAccessToken();
  if (token !== null) {
    h["Authorization"] = `Bearer ${token}`;
  }
  return h;
}

export function checkoutOrder(payload: { recipientName: string; recipientPhoneNumber: string; deliveryAddress: string; paymentMethod: "Cod" | "BankTransfer" }): Promise<OnlineOrder> {
  return requestJson<OnlineOrder>("/online-orders/checkout", { method: "POST", headers: headers(), body: JSON.stringify(payload) });
}

export function getOnlineOrder(orderId: string, accessToken?: string): Promise<OnlineOrder> {
  return requestJson<OnlineOrder>(`/online-orders/${orderId}`, { headers: headers(accessToken) });
}

export function acceptQuote(orderId: string): Promise<OnlineOrder> {
  return requestJson<OnlineOrder>(`/online-orders/${orderId}/accept-quote`, { method: "POST", headers: headers() });
}

export function cancelOrder(orderId: string, accessToken?: string): Promise<OnlineOrder> {
  return requestJson<OnlineOrder>(`/online-orders/${orderId}/cancel`, { method: "POST", headers: headers(accessToken) });
}

export function setShippingQuote(orderId: string, shippingFee: number, message: string, accessToken: string): Promise<OnlineOrder> {
  return requestJson<OnlineOrder>(`/online-orders/${orderId}/shipping-quote`, {
    method: "PUT",
    headers: headers(accessToken),
    body: JSON.stringify({ shippingFee, message })
  });
}

export function confirmCodPayment(orderId: string, accessToken: string): Promise<OnlineOrder> {
  return requestJson<OnlineOrder>(`/online-orders/${orderId}/confirm-cod-payment`, { method: "POST", headers: headers(accessToken) });
}

export function markDelivering(orderId: string, accessToken: string): Promise<OnlineOrder> {
  return requestJson<OnlineOrder>(`/online-orders/${orderId}/delivering`, { method: "POST", headers: headers(accessToken) });
}

export function markDelivered(orderId: string, accessToken: string): Promise<OnlineOrder> {
  return requestJson<OnlineOrder>(`/online-orders/${orderId}/delivered`, { method: "POST", headers: headers(accessToken) });
}

export function markDeliveryFailed(orderId: string, accessToken: string): Promise<OnlineOrder> {
  return requestJson<OnlineOrder>(`/online-orders/${orderId}/delivery-failed`, { method: "POST", headers: headers(accessToken) });
}

export function markReturned(orderId: string, accessToken: string): Promise<OnlineOrder> {
  return requestJson<OnlineOrder>(`/online-orders/${orderId}/returned`, { method: "POST", headers: headers(accessToken) });
}
