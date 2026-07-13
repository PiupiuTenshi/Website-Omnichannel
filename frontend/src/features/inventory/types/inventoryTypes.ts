export interface Supplier {
  supplierId: string;
  name: string;
  contactName: string | null;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  isActive: boolean;
}

export interface SupplierPayload {
  name: string;
  contactName?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
}

export type InventoryBatchStatus = 0 | 1 | 2 | 3; // Available, Quarantined, Depleted, Expired
export const InventoryBatchStatusLabels: Record<InventoryBatchStatus, string> = {
  0: "Khả dụng",
  1: "Cách ly/Kiểm định",
  2: "Hết hàng",
  3: "Hết hạn"
};

export interface InventoryBatch {
  inventoryBatchId: string;
  productVariantId: string;
  supplierId: string | null;
  initialQuantity: number;
  availableQuantity: number;
  unitCost: number;
  receivedAtUtc: string;
  manufacturedAtUtc: string | null;
  expiresAtUtc: string | null;
  status: InventoryBatchStatus;
}

export interface ReceiveInventoryPayload {
  productVariantId: string;
  supplierId?: string;
  quantity: number;
  unitCost: number;
  receivedAtUtc: string;
  manufacturedAtUtc?: string;
  expiresAtUtc?: string;
  reference?: string;
}

export interface LowStockItem {
  productVariantId: string;
  productName: string;
  variantName: string;
  sku: string;
  unitCode: string;
  availableQuantity: number;
  suggestedPurchaseQuantity: number;
}
