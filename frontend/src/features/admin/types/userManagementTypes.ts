export interface UserAccountSummary {
  userId: string;
  email: string | null;
  phoneNumber: string | null;
  emailConfirmed: boolean;
  phoneNumberConfirmed: boolean;
  isActive: boolean;
  requiresInitialActivation: boolean;
  roles: string[];
}
