import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { StoreSettingsPage, AdminDashboardPage, ManagerDashboardPage, SellerDashboardPage, AuditLogsPage } from "../../features/admin";
import { LoginPage, RegisterPage, RoleRouteGuard, VerifyAccountPage } from "../../features/auth";
import { CatalogPage, ProductDetailPage, ProductFormPage } from "../../features/catalog";
import { CartPage } from "../../features/cart";
import { CheckoutPage } from "../../features/checkout";
import { OrderTrackingPage } from "../../features/orders";
import { InventoryBatchesPage, InventoryReceivePage, LowStockPage, SuppliersPage } from "../../features/inventory";
import { PosPage } from "../../features/pos";
import { PublicLayout } from "../../layouts/PublicLayout";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { FoundationPage } from "../../pages/FoundationPage";
import { NotFoundPage } from "../../pages/NotFoundPage";

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <CatalogPage /> },
      { path: "foundation", element: <FoundationPage /> },
      { path: "products/:slug", element: <ProductDetailPage /> },
      { path: "cart", element: <CartPage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "orders/:orderId", element: <OrderTrackingPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "verify", element: <VerifyAccountPage /> },
      { path: "*", element: <NotFoundPage /> }
    ]
  },
  {
    element: <DashboardLayout />,
    children: [
      {
        element: <RoleRouteGuard allowedRoles={["Admin"]} />,
        children: [
          { path: "admin/dashboard", element: <AdminDashboardPage /> },
          { path: "admin/audit-logs", element: <AuditLogsPage /> }
        ]
      },
      {
        element: <RoleRouteGuard allowedRoles={["Manager"]} />,
        children: [
          { path: "manager/dashboard", element: <ManagerDashboardPage /> }
        ]
      },
      {
        element: <RoleRouteGuard allowedRoles={["Seller"]} />,
        children: [
          { path: "seller/dashboard", element: <SellerDashboardPage /> }
        ]
      },
      {
        element: <RoleRouteGuard allowedRoles={["Admin", "Manager", "Seller"]} />,
        children: [
          { path: "admin/pos", element: <PosPage /> }
        ]
      },
      {
        element: <RoleRouteGuard allowedRoles={["Admin", "Manager"]} />,
        children: [
          { path: "admin/store-settings", element: <StoreSettingsPage /> },
          { path: "admin/products/new", element: <ProductFormPage /> },
          { path: "admin/inventory/suppliers", element: <SuppliersPage /> },
          { path: "admin/inventory/receive", element: <InventoryReceivePage /> },
          { path: "admin/inventory/batches", element: <InventoryBatchesPage /> },
          { path: "admin/inventory/low-stock", element: <LowStockPage /> }
        ]
      }
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
