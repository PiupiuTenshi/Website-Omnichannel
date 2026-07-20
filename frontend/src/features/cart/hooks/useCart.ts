import { useContext } from "react";
import { CartContext, type CartContextValue } from "./cartContext";

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (context === null) {
    throw new Error("useCart must be used within CartProvider.");
  }

  return context;
}
