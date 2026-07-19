export interface AccountProfile {
  userId: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  defaultDeliveryAddress: string | null;
  roles: string[];
}

export interface UpdateAccountProfilePayload {
  displayName: string;
  defaultDeliveryAddress: string;
}
