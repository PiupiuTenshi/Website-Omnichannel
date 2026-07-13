export type PosPaymentMethod = "Cash" | "BankTransfer";

export interface PosProduct {
  productVariantId: string;
  productName: string;
  variantName: string;
  sku: string;
  barcode: string;
  unitCode: string;
  price: number;
  availableQuantity: number;
  isWeighed: boolean;
}

export interface PosCartItem {
  productVariantId: string;
  productName: string;
  variantName: string;
  sku: string;
  barcode: string;
  unitCode: string;
  price: number;
  quantity: number;
  isWeighed: boolean;
}

export interface CheckoutPosRequest {
  items: {
    productVariantId: string;
    quantity: number;
    unitPrice: number;
  }[];
  paymentMethod: PosPaymentMethod;
  cashReceived: number | null;
}

export interface CheckoutPosResponse {
  orderId: string;
  orderCode: string;
  exactAmount: number;
  amountDue: number;
  changeAmount: number;
}
