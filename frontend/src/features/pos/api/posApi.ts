import { requestJson } from "../../../shared/api/apiClient";
import type { CheckoutPosRequest, CheckoutPosResponse, PosProduct } from "../types/posTypes";

export function searchPosProducts(accessToken: string, query: string): Promise<PosProduct[]> {
  const parameters = new URLSearchParams();
  parameters.set("query", query);
  return requestJson<PosProduct[]>(`/admin/pos/products?${parameters.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
}

export function checkoutPos(accessToken: string, request: CheckoutPosRequest): Promise<CheckoutPosResponse> {
  return requestJson<CheckoutPosResponse>("/admin/pos/checkout", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(request)
  });
}
