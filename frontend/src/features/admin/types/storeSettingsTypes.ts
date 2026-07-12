export interface StoreSettings {
  name: string;
  email: string | null;
  address: string;
  isOnlineOrderingEnabled: boolean;
  contactNumbers: string[];
  rowVersion: string;
}

export interface StoreSettingsDraft {
  name: string;
  email: string;
  address: string;
  isOnlineOrderingEnabled: boolean;
  contactNumbers: string[];
  rowVersion: string;
}
