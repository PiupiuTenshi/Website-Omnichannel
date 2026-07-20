import { createContext } from "react";
import type { Cart } from "../types/cartTypes";

export interface CartContextValue {
  cart: Cart | null;
  itemCount: number;
  addItem: (productVariantId: string, quantity: number) => Promise<void>;
  updateItem: (productVariantId: string, quantity: number) => Promise<void>;
  removeItem: (productVariantId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

export const CartContext = createContext<CartContextValue | null>(null);
