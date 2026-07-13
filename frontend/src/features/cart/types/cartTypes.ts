export interface CartItem { productVariantId: string; name: string; variantName: string; quantity: number; unitPrice: number; lineTotal: number; isWeighed: boolean; }
export interface Cart { shoppingCartId: string; items: CartItem[]; subtotal: number; }
export interface CartReservation { expiresAtUtc: string; reservedItemCount: number; }
