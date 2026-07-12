import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { StoreSettingsPage } from "../../features/admin";
import { LoginPage, RegisterPage, RoleRouteGuard, VerifyAccountPage } from "../../features/auth";
import { CatalogPage, ProductDetailPage, ProductFormPage } from "../../features/catalog";
import { PublicLayout } from "../../layouts/PublicLayout";
import { FoundationPage } from "../../pages/FoundationPage";
import { NotFoundPage } from "../../pages/NotFoundPage";

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <CatalogPage /> },
      { path: "foundation", element: <FoundationPage /> },
      { path: "products/:slug", element: <ProductDetailPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "verify", element: <VerifyAccountPage /> },
      {
        element: <RoleRouteGuard allowedRoles={["Admin", "Manager"]} />,
        children: [{ path: "admin/store-settings", element: <StoreSettingsPage /> }, { path: "admin/products/new", element: <ProductFormPage /> }]
      },
      { path: "*", element: <NotFoundPage /> }
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
