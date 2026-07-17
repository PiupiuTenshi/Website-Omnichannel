import { requestJson } from "../../../shared/api/apiClient";
import type { UserAccountSummary } from "../types/userManagementTypes";

export function getUsers(accessToken: string): Promise<UserAccountSummary[]> {
  return requestJson<UserAccountSummary[]>("/users", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
}

export function createUser(
  accessToken: string,
  payload: Record<string, string>
): Promise<void> {
  return requestJson<void>("/users", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload)
  });
}

export function changeUserRole(
  accessToken: string,
  userId: string,
  role: string
): Promise<void> {
  return requestJson<void>(`/users/${userId}/role`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ role })
  });
}

export function setUserActivation(
  accessToken: string,
  userId: string,
  isActive: boolean
): Promise<void> {
  return requestJson<void>(`/users/${userId}/activation`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ isActive })
  });
}

export function deleteUser(
  accessToken: string,
  userId: string
): Promise<void> {
  return requestJson<void>(`/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` }
  });
}
