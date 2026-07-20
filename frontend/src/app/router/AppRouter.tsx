import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { StoreSettingsPage, AdminDashboardPage, ManagerDashboardPage, SellerDashboardPage, AuditLogsPage, ReportsPage, UserManagementPage, AdminOrdersPage, PromotionsPage } from "../../features/admin";
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage, RoleRouteGuard, VerifyAccountPage } from "../../features/auth";
import { AccountPage } from "../../features/account";
import { CatalogPage, ProductDetailPage, ProductFormPage, AdminProductsPage } from "../../features/catalog";
import { CartPage } from "../../features/cart";
import { CheckoutPage } from "../../features/checkout";
import { OrderTrackingPage } from "../../features/orders";
import { InventoryBatchesPage, InventoryReceivePage, LowStockPage, SuppliersPage } from "../../features/inventory";
import { PosPage, PriceTagPage } from "../../features/pos";
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
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
      { path: "verify", element: <VerifyAccountPage /> },
      {
        element: <RoleRouteGuard />,
        children: [{ path: "account", element: <AccountPage /> }]
      },
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
          { path: "admin/audit-logs", element: <AuditLogsPage /> },
          { path: "admin/users", element: <UserManagementPage /> }
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
          { path: "seller/dashboard", element: <SellerDashboardPage /> },
          { path: "seller/price-tags", element: <PriceTagPage /> }
        ]
      },
      {
        element: <RoleRouteGuard allowedRoles={["Admin", "Manager", "Seller"]} />,
        children: [
          { path: "manager/pos", element: <PosPage /> }
        ]
      },
      {
        element: <RoleRouteGuard allowedRoles={["Admin", "Manager"]} />,
        children: [
          { path: "manager/reports", element: <ReportsPage /> },
          { path: "manager/store-settings", element: <StoreSettingsPage /> },
          { path: "manager/products/new", element: <ProductFormPage /> },
          { path: "manager/products", element: <AdminProductsPage /> },
          { path: "manager/promotions", element: <PromotionsPage /> },
          { path: "manager/orders", element: <AdminOrdersPage /> },
          { path: "manager/inventory/suppliers", element: <SuppliersPage /> },
          { path: "manager/inventory/receive", element: <InventoryReceivePage /> },
          { path: "manager/inventory/batches", element: <InventoryBatchesPage /> },
          { path: "manager/inventory/low-stock", element: <LowStockPage /> }
        ]
      }
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
