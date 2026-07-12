import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { StoreSettingsPage } from "../../features/admin";
import { LoginPage, RegisterPage, RoleRouteGuard, VerifyAccountPage } from "../../features/auth";
import { PublicLayout } from "../../layouts/PublicLayout";
import { FoundationPage } from "../../pages/FoundationPage";
import { NotFoundPage } from "../../pages/NotFoundPage";

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <FoundationPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "verify", element: <VerifyAccountPage /> },
      {
        element: <RoleRouteGuard allowedRoles={["Admin", "Manager"]} />,
        children: [{ path: "admin/store-settings", element: <StoreSettingsPage /> }]
      },
      { path: "*", element: <NotFoundPage /> }
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
