import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getCart, removeCartItem, setCartItem } from "../api/cartApi";
import type { Cart } from "../types/cartTypes";

interface CartContextValue {
  cart: Cart | null;
  itemCount: number;
  addItem: (productVariantId: string, quantity: number) => Promise<void>;
  updateItem: (productVariantId: string, quantity: number) => Promise<void>;
  removeItem: (productVariantId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const mutationVersion = useRef(0);
  const sessionVersion = useRef(0);

  const refreshCart = useCallback(async () => {
    const requestedMutationVersion = mutationVersion.current;
    const requestedSessionVersion = sessionVersion.current;
    const loadedCart = await getCart();
    if (requestedMutationVersion === mutationVersion.current && requestedSessionVersion === sessionVersion.current) {
      setCart(loadedCart);
    }
  }, []);

  useEffect(() => {
    void refreshCart().catch(() => setCart(null));
    const refreshForNewSession = () => {
      sessionVersion.current += 1;
      setCart(null);
      void refreshCart().catch(() => setCart(null));
    };
    window.addEventListener("grocery-store-cart-session-changed", refreshForNewSession);
    return () => window.removeEventListener("grocery-store-cart-session-changed", refreshForNewSession);
  }, [refreshCart]);

  const updateItem = useCallback(async (productVariantId: string, quantity: number) => {
    mutationVersion.current += 1;
    setCart(await setCartItem(productVariantId, quantity));
  }, []);

  const addItem = useCallback(async (productVariantId: string, quantity: number) => {
    const currentCart = cart ?? await getCart();
    const existingItem = currentCart.items.find((item) => item.productVariantId === productVariantId);
    mutationVersion.current += 1;
    setCart(await setCartItem(productVariantId, (existingItem?.quantity ?? 0) + quantity));
  }, [cart]);

  const removeItem = useCallback(async (productVariantId: string) => {
    mutationVersion.current += 1;
    setCart(await removeCartItem(productVariantId));
  }, []);

  const value = useMemo<CartContextValue>(() => ({
    cart,
    itemCount: cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0,
    addItem,
    updateItem,
    removeItem,
    refreshCart
  }), [addItem, cart, refreshCart, removeItem, updateItem]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (context === null) throw new Error("useCart must be used within CartProvider.");
  return context;
}
