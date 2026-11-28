import Mainlayout from "./layouts/MainLayout";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProductListPage } from "./pages/public/ProductListPage";
import { ProductDetailPage } from "./pages/public/ProductDetailPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import CartPage from "./pages/customer/CartPage";
import HomePage from "./pages/public/HomePage";
import ProfilePage from "./pages/customer/ProfilePage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import CheckoutPage from "./pages/customer/CheckoutPage";
import OrderListPage from "./pages/customer/OrderListPage";
import OrderDetailPage from "./pages/customer/OrderDetailPage";
import PaymentResultPage from "./pages/customer/PaymentResultPage";
import TraceabilityPage from "./pages/public/TraceabilityPage";
import SubscriptionListPage from "./pages/customer/SubscriptionListPage";

// Legacy Sales layout (giữ cho /sales/*)
import SalesLayout from "./layouts/SalesLayout";
import OrderConfirmPage from "./pages/sales/OrderConfirmPage";
import FlashSaleConfigPage from "./pages/sales/FlashSaleConfigPage";
import ComplaintQueuePage from "./pages/sales/ComplaintQueuePage";

// Legacy Dashboard layout (giữ /dashboard/* để không break bookmark cũ)
import { InternalDashboardLayout } from "./components/layout/InternalDashboard";
import { AdminOverviewPage } from "./pages/admin/AdminOverviewPage";
import { AdminSystemPage } from "./pages/admin/AdminSystemPage";
import { FarmBatchesPage } from "./pages/farm/FarmBatchesPage";
import { SalesOrdersPage } from "./pages/sales/SalesOrdersPage";
import { SalesComplaintsPage } from "./pages/sales/SalesComplaintsPage";

// Admin area mới: /admin/* với RoleGuard + AdminLayout
import { AdminLayout } from "./layouts/AdminLayout";
import { RoleGuard } from "./components/auth/RoleGuard";
import { DashboardPage } from "./pages/admin/DashboardPage";
import { AdminCatalogPage } from "./pages/admin/AdminCatalogPage";
import { AdminAccountsPage } from "./pages/admin/AdminAccountsPage";
import { AdminInventoryPage } from "./pages/admin/AdminInventoryPage";

import { useAuth } from "./hooks/useAuth";
import type { AuthUser as InternalAuthUser } from "./types/internalTypes";

function App() {
  const { user, logout } = useAuth();

  // Cast cho InternalDashboardLayout (legacy)
  const internalUser = user
    ? ({ ...user, role: user.role.trim().toLowerCase() } as InternalAuthUser)
    : null;

  const handleInternalLogout = async () => {
    await logout();
  };

  return (
    <Routes>
      {/* ═══════════════════════════════════════════════════════════
          CUSTOMER ROUTES — Public + Protected (giữ nguyên)
      ═══════════════════════════════════════════════════════════ */}
      <Route path="/" element={<Mainlayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductListPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="trace" element={<TraceabilityPage />} />
        <Route path="trace/:batchCode" element={<TraceabilityPage />} />
        <Route path="subscriptions" element={<SubscriptionListPage />} />

        {/* Customer-only routes */}
        <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
          <Route path="profile" element={<ProfilePage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="orders" element={<OrderListPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="payments/return/payos" element={<PaymentResultPage />} />
        </Route>
      </Route>

      {/* ═══════════════════════════════════════════════════════════
          LEGACY SALES ROUTES — /sales/* (giữ cho Sales dùng /sales)
      ═══════════════════════════════════════════════════════════ */}
      <Route element={<ProtectedRoute allowedRoles={["sales", "admin"]} />}>
        <Route path="/sales" element={<SalesLayout />}>
          <Route index element={<Navigate to="orders" replace />} />
          <Route path="orders" element={<OrderConfirmPage />} />
          <Route path="flash-sale" element={<FlashSaleConfigPage />} />
          <Route path="complaints" element={<ComplaintQueuePage />} />
        </Route>
      </Route>

      {/* ═══════════════════════════════════════════════════════════
          LEGACY DASHBOARD ROUTES — /dashboard/*
          Giữ để không break bookmark / link cũ
      ═══════════════════════════════════════════════════════════ */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["admin", "farm_staff", "sales"]} />
        }
      >
        <Route
          path="/dashboard"
          element={
            internalUser ? (
              <InternalDashboardLayout
                user={internalUser}
                onLogout={handleInternalLogout}
              />
            ) : null
          }
        >
          <Route index element={<Navigate to="admin/overview" replace />} />

          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="admin/overview" element={<AdminOverviewPage />} />
            <Route path="admin/catalog" element={<AdminCatalogPage />} />
            <Route path="admin/accounts" element={<AdminAccountsPage />} />
            <Route path="admin/settings" element={<AdminSystemPage />} />
          </Route>

          <Route
            element={<ProtectedRoute allowedRoles={["admin", "farm_staff"]} />}
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

          <Route element={<ProtectedRoute allowedRoles={["admin", "sales"]} />}>
            <Route path="sales/orders" element={<SalesOrdersPage />} />
            <Route path="sales/complaints" element={<SalesComplaintsPage />} />
          </Route>
        </Route>
      </Route>

      {/* ═══════════════════════════════════════════════════════════
          ADMIN ROUTES MỚI — /admin/*
          Dùng RoleGuard + AdminLayout (sidebar phân quyền)
          Hỗ trợ role: admin | sales | warehouse
      ═══════════════════════════════════════════════════════════ */}
      <Route element={<RoleGuard />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />

          {/* Admin-only */}
          <Route element={<RoleGuard allowedRoles={["admin"]} />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="catalog" element={<AdminCatalogPage />} />
            <Route path="accounts" element={<AdminAccountsPage />} />
            <Route path="settings" element={<AdminSystemPage />} />
            <Route
              path="farm/batches"
              element={<FarmBatchesPage key="admin-farm-batches" defaultView="batches" />}
            />
            <Route
              path="farm/disposals"
              element={<FarmBatchesPage key="admin-farm-disposals" defaultView="disposals" />}
            />
          </Route>

          {/* Admin + Sales */}
          <Route element={<RoleGuard allowedRoles={["admin", "sales"]} />}>
            <Route path="orders" element={<SalesOrdersPage />} />
            <Route path="complaints" element={<SalesComplaintsPage />} />
          </Route>

          {/* Admin + Warehouse */}
          <Route element={<RoleGuard allowedRoles={["admin"]} />}>
            <Route
              path="inventory"
              element={<AdminInventoryPage key="alerts" defaultTab="alerts" />}
            />
            <Route
              path="inventory/batches"
              element={<AdminInventoryPage key="batches" defaultTab="batches" />}
            />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
