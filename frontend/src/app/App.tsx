import { AppRouter } from "./router/AppRouter";
import { AuthProvider } from "../features/auth";
import { CartProvider } from "../features/cart";

export function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRouter />
      </CartProvider>
    </AuthProvider>
  );
}
