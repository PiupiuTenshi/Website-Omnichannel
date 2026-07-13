import { requestJson } from "../../../shared/api/apiClient";
import type { InventoryBatch, LowStockItem, ReceiveInventoryPayload, Supplier, SupplierPayload } from "../types/inventoryTypes";

export function getSuppliers(accessToken: string): Promise<Supplier[]> {
  return requestJson<Supplier[]>("/admin/inventory/suppliers", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
}

export function createSupplier(accessToken: string, payload: SupplierPayload): Promise<Supplier> {
  return requestJson<Supplier>("/admin/inventory/suppliers", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload)
  });
}

export function getBatches(accessToken: string, productVariantId?: string): Promise<InventoryBatch[]> {
  const parameters = new URLSearchParams();
  if (productVariantId) parameters.set("productVariantId", productVariantId);
  const queryString = parameters.toString() ? `?${parameters.toString()}` : "";

  return requestJson<InventoryBatch[]>(`/admin/inventory/batches${queryString}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
}

export function receiveInventory(accessToken: string, payload: ReceiveInventoryPayload): Promise<InventoryBatch> {
  return requestJson<InventoryBatch>("/admin/inventory/receipts", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload)
  });
}

export function adjustInventory(
  accessToken: string,
  inventoryBatchId: string,
  quantityDelta: number,
  reason: string
): Promise<InventoryBatch> {
  return requestJson<InventoryBatch>(`/admin/inventory/batches/${inventoryBatchId}/adjustments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ quantityDelta, reason })
  });
}

export function getLowStockItems(accessToken: string, minimumAvailableQuantity?: number): Promise<LowStockItem[]> {
  const parameters = new URLSearchParams();
  if (minimumAvailableQuantity !== undefined) parameters.set("minimumAvailableQuantity", minimumAvailableQuantity.toString());
  const queryString = parameters.toString() ? `?${parameters.toString()}` : "";

  return requestJson<LowStockItem[]>(`/admin/inventory/low-stock${queryString}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
}
