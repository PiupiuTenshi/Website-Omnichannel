import { requestJson } from "../../../shared/api/apiClient";
import type { OnlineOrder } from "../../checkout/api/onlineOrdersApi";
import type { AccountProfile, UpdateAccountProfilePayload } from "../types/accountTypes";

export interface ContactChangeRequestResult {
  verificationChannel: "Email" | "Phone";
}

function authorization(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export function getAccountProfile(accessToken: string): Promise<AccountProfile> {
  return requestJson<AccountProfile>("/account/profile", { headers: authorization(accessToken) });
}

export function updateAccountProfile(accessToken: string, payload: UpdateAccountProfilePayload): Promise<AccountProfile> {
  return requestJson<AccountProfile>("/account/profile", {
    method: "PUT",
    headers: authorization(accessToken),
    body: JSON.stringify(payload)
  });
}


export function getMyOrders(accessToken: string): Promise<OnlineOrder[]> {
  return requestJson<OnlineOrder[]>("/account/orders", { headers: authorization(accessToken) });
}

export function requestContactChange(accessToken: string, channel: "Email" | "Phone", newValue: string): Promise<ContactChangeRequestResult> {
  return requestJson<ContactChangeRequestResult>("/account/contact-changes", {
    method: "POST",
    headers: authorization(accessToken),
    body: JSON.stringify({ channel, newValue })
  });
}

export function confirmContactChange(accessToken: string, channel: "Email" | "Phone", code: string): Promise<AccountProfile> {
  return requestJson<AccountProfile>("/account/contact-changes/confirm", {
    method: "POST",
    headers: authorization(accessToken),
    body: JSON.stringify({ channel, code })
  });
}
