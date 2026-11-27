/*
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Layouts
import { MainLayout } from '../layouts/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { FarmStaffLayout } from '../layouts/FarmStaffLayout';
import { SalesLayout } from '../layouts/SalesLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Public Pages
import { HomePage } from '../pages/public/HomePage';
import { ProductListPage } from '../pages/public/ProductListPage';
import { ProductDetailPage } from '../pages/public/ProductDetailPage';
import { TraceabilityPage } from '../pages/public/TraceabilityPage';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';

// Customer Pages
import { CartPage } from '../pages/customer/CartPage';
import { CheckoutPage } from '../pages/customer/CheckoutPage';
import { PaymentResultPage } from '../pages/customer/PaymentResultPage';
import { OrderListPage } from '../pages/customer/OrderListPage';
import { OrderDetailPage } from '../pages/customer/OrderDetailPage';
import { SubscriptionListPage } from '../pages/customer/SubscriptionListPage';
import { SubscriptionDetailPage } from '../pages/customer/SubscriptionDetailPage';
import { ComplaintCreatePage } from '../pages/customer/ComplaintCreatePage';
import { ProfilePage } from '../pages/customer/ProfilePage';

// Farm Staff Pages
import { BatchListPage } from '../pages/farm/BatchListPage';
import { BatchCreatePage } from '../pages/farm/BatchCreatePage';
import { FarmingLogPage } from '../pages/farm/FarmingLogPage';
import { InventoryAuditPage } from '../pages/farm/InventoryAuditPage';
import { InventoryDisposalPage } from '../pages/farm/InventoryDisposalPage';

// Sales Pages
import { OrderConfirmPage } from '../pages/sales/OrderConfirmPage';
import { SubscriptionShortagePage } from '../pages/sales/SubscriptionShortagePage';
import { FlashSaleConfigPage } from '../pages/sales/FlashSaleConfigPage';
import { ComplaintQueuePage } from '../pages/sales/ComplaintQueuePage';

// Admin Pages
import { OverviewDashboardPage } from '../pages/admin/OverviewDashboardPage';
import { ProductManagementPage } from '../pages/admin/ProductManagementPage';
import { CategoryManagementPage } from '../pages/admin/CategoryManagementPage';
import { StaffManagementPage } from '../pages/admin/StaffManagementPage';
import { SystemSettingsPage } from '../pages/admin/SystemSettingsPage';

export function AppRoutes() {
    return (

            <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            <Route element={<MainLayout />}>

                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductListPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/trace/:batchCode" element={<TraceabilityPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/payment/result" element={<PaymentResultPage />} />

                <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/orders" element={<OrderListPage />} />
                    <Route path="/orders/:id" element={<OrderDetailPage />} />
                    <Route path="/orders/:orderItemId/complaint" element={<ComplaintCreatePage />} />
                    <Route path="/subscriptions" element={<SubscriptionListPage />} />
                    <Route path="/subscriptions/:id" element={<SubscriptionDetailPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['FARM_STAFF']} />}>
                <Route path="/farm" element={<FarmStaffLayout />}>
                    <Route index element={<Navigate to="batches" replace />} />
                    <Route path="batches" element={<BatchListPage />} />
                    <Route path="batches/create" element={<BatchCreatePage />} />
                    <Route path="batches/:batchId/logs" element={<FarmingLogPage />} />
                    <Route path="inventory/audit" element={<InventoryAuditPage />} />
                    <Route path="inventory/disposal" element={<InventoryDisposalPage />} />
                </Route>
            </Route>


            <Route element={<ProtectedRoute allowedRoles={['SALES']} />}>
                <Route path="/sales" element={<SalesLayout />}>
                    <Route index element={<Navigate to="orders" replace />} />
                    <Route path="orders" element={<OrderConfirmPage />} />
                    <Route path="subscriptions/shortage" element={<SubscriptionShortagePage />} />
                    <Route path="flash-sale" element={<FlashSaleConfigPage />} />
                    <Route path="complaints" element={<ComplaintQueuePage />} />
                </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<OverviewDashboardPage />} />
                    <Route path="products" element={<ProductManagementPage />} />
                    <Route path="categories" element={<CategoryManagementPage />} />
                    <Route path="staff" element={<StaffManagementPage />} />
                    <Route path="settings" element={<SystemSettingsPage />} />
                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
*/
