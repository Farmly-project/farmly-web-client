import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { AuthUser, InternalRole } from "../types/internalTypes";

interface InternalGuardProps {
  user: AuthUser | null;
  loading?: boolean;
  allowedRoles: InternalRole[];
}

function getDefaultDashboardPath(role: string): string {
  switch (role) {
    case "admin":
      return "/dashboard/admin/overview";
    case "farm_staff":
      return "/dashboard/farm/batches";
    case "sales":
      return "/dashboard/sales/orders";
    default:
      return "/";
  }
}

export function InternalGuard({
  user,
  loading = false,
  allowedRoles,
}: InternalGuardProps) {
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Đang xác thực quyền truy cập...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  const role = user.role.trim().toLowerCase();

  if (role === "customer") {
    return <Navigate to="/" replace />;
  }

  if (role !== "admin" && !allowedRoles.includes(role as InternalRole)) {
    return <Navigate to={getDefaultDashboardPath(role)} replace />;
  }

  return <Outlet />;
}
