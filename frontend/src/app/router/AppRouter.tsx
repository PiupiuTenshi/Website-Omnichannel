import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { PublicLayout } from "../../layouts/PublicLayout";
import { FoundationPage } from "../../pages/FoundationPage";
import { NotFoundPage } from "../../pages/NotFoundPage";

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <FoundationPage />
      },
      {
        path: "*",
        element: <NotFoundPage />
      }
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
