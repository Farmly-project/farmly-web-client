import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { InternalGuard } from "./InternalGuard";
import { InternalDashboardLayout } from "../components/layout/InternalDashboard";
import { AdminOverviewPage } from "../pages/admin/AdminOverviewPage";
import { AdminCatalogPage } from "../pages/admin/AdminCatalogPage";
import { AdminAccountsPage } from "../pages/admin/AdminAccountsPage";
import { AdminSystemPage } from "../pages/admin/AdminSystemPage";
import { FarmBatchesPage } from "../pages/farm/FarmBatchesPage";
import { SalesOrdersPage } from "../pages/sales/SalesOrdersPage";
import { SalesComplaintsPage } from "../pages/sales/SalesComplaintsPage";
import type { AuthUser } from "../types/internalTypes";

interface AppRoutesProps {
  user: AuthUser | null;
  loading: boolean;
  onLogout: () => void;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({
  user,
  loading,
  onLogout,
}) => {
  return (
    <Routes>
      {/* Khu vực Dashboard Nội bộ (Admin full quyền vào toàn bộ 3 phân khu) */}
      <Route
        element={
          <InternalGuard
            user={user}
            loading={loading}
            allowedRoles={["admin", "farm_staff", "sales"]}
          />
        }
      >
        <Route
          path="/dashboard"
          element={
            user ? (
              <InternalDashboardLayout user={user} onLogout={onLogout} />
            ) : null
          }
        >
          {/* Phân khu 1: Chỉ Admin */}
          <Route
            element={<InternalGuard user={user} allowedRoles={["admin"]} />}
          >
            <Route path="admin/overview" element={<AdminOverviewPage />} />
            <Route path="admin/catalog" element={<AdminCatalogPage />} />
            <Route path="admin/accounts" element={<AdminAccountsPage />} />
            <Route path="admin/settings" element={<AdminSystemPage />} />
          </Route>

          {/* Phân khu 2: Farm Staff + Admin */}
          <Route
            element={
              <InternalGuard user={user} allowedRoles={["farm_staff"]} />
            }
          >
            <Route
              path="farm/batches"
              element={<FarmBatchesPage key="farm-batches" defaultView="batches" />}
            />
            <Route
              path="farm/disposals"
              element={<FarmBatchesPage key="farm-disposals" defaultView="disposals" />}
            />
          </Route>

          {/* Phân khu 3: Sales + Admin */}
          <Route
            element={<InternalGuard user={user} allowedRoles={["sales"]} />}
          >
            <Route path="sales/orders" element={<SalesOrdersPage />} />
            <Route path="sales/complaints" element={<SalesComplaintsPage />} />
          </Route>
        </Route>
      </Route>

      <Route
        path="*"
        element={<Navigate to="/dashboard/admin/overview" replace />}
      />
    </Routes>
  );
};
