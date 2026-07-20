import { requestJson } from "../../../shared/api/apiClient";

export interface AuditLogEntry {
  id: number;
  time: string;
  user: string;
  role: string;
  action: string;
  module: string;
  ip: string;
  status: "Success" | "Warning" | "Error";
}

export function getAuditLogs(accessToken: string): Promise<AuditLogEntry[]> {
  return requestJson<AuditLogEntry[]>("/audit-logs", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
}
