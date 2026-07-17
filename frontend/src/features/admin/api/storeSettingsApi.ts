import { requestJson } from "../../../shared/api/apiClient";
import type { StoreSettings, StoreSettingsDraft } from "../types/storeSettingsTypes";

export function getStoreSettings(accessToken: string): Promise<StoreSettings> {
  return requestJson<StoreSettings>("/store-settings", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
}

export function getPublicStoreSettings(): Promise<StoreSettings> {
  return requestJson<StoreSettings>("/store-settings/public");
}

export function updateStoreSettings(accessToken: string, draft: StoreSettingsDraft): Promise<StoreSettings> {
  return requestJson<StoreSettings>("/store-settings", {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(draft)
  });
}
