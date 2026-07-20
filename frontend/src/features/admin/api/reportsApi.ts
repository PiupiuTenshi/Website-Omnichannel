import { requestJson } from "../../../shared/api/apiClient";

export interface ReportingDashboard {
  revenue: Array<{ date: string; revenue: number }>;
  bestSellers: Array<{ productVariantId: string; productName: string; variantName: string; quantitySold: number; revenue: number }>;
  slowSellers: Array<{ productVariantId: string; productName: string; variantName: string; quantitySold: number; revenue: number }>;
  lowStock: Array<{ productVariantId: string; productName: string; variantName: string; availableQuantity: number; expiresAtUtc: string | null }>;
  expiringSoon: Array<{ productVariantId: string; productName: string; variantName: string; availableQuantity: number; expiresAtUtc: string | null }>;
}

export function getReportingDashboard(accessToken: string, from: string, to: string): Promise<ReportingDashboard> {
  const parameters = new URLSearchParams({ fromUtc: `${from}T00:00:00.000Z`, toUtc: `${to}T23:59:59.999Z` });
  return requestJson<ReportingDashboard>(`/admin/reports?${parameters}`, { headers: { Authorization: `Bearer ${accessToken}` } });
}
