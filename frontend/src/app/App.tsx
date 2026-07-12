import { AppRouter } from "./router/AppRouter";
import { AuthProvider } from "../features/auth";

export function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
