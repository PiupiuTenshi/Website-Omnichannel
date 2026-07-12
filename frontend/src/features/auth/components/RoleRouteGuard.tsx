import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types/authTypes";

interface RoleRouteGuardProps {
  allowedRoles?: UserRole[];
}

export function RoleRouteGuard({ allowedRoles }: RoleRouteGuardProps) {
  const { session } = useAuth();
  const location = useLocation();

  if (session === null) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles !== undefined && !allowedRoles.some((role) => session.roles.includes(role))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
