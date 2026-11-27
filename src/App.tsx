
import Mainlayout from './layouts/MainLayout'
import { Routes, Route, Navigate } from "react-router-dom"
import { ProductListPage } from './pages/public/ProductListPage'
import { ProductDetailPage } from './pages/public/ProductDetailPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import CartPage from './pages/customer/CartPage'
import HomePage from './pages/public/HomePage'
import ProfilePage from './pages/customer/ProfilePage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import CheckoutPage from './pages/customer/CheckoutPage'
import OrderListPage from './pages/customer/OrderListPage'
import OrderDetailPage from './pages/customer/OrderDetailPage'
import PaymentResultPage from './pages/customer/PaymentResultPage'
import TraceabilityPage from './pages/public/TraceabilityPage'
import SubscriptionListPage from './pages/customer/SubscriptionListPage'
import SalesLayout from './layouts/SalesLayout'
import OrderConfirmPage from './pages/sales/OrderConfirmPage'
import FlashSaleConfigPage from './pages/sales/FlashSaleConfigPage'
import ComplaintQueuePage from './pages/sales/ComplaintQueuePage'

function App() {


  return (
    <>
      <Routes>
        <Route path="/" element={<Mainlayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/trace" element={<TraceabilityPage />} />
          <Route path="/trace/:batchCode" element={<TraceabilityPage />} />
          <Route path="subscriptions" element={<SubscriptionListPage />} />

          <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrderListPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/payments/return/payos" element={<PaymentResultPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['sales']} />}>

          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['sales']} />}>
          <Route path="/sales" element={<SalesLayout />}>
            <Route index element={<Navigate to="orders" replace />} />
            <Route path="orders" element={<OrderConfirmPage />} />
            <Route path="flash-sale" element={<FlashSaleConfigPage />} />
            <Route path="complaints" element={<ComplaintQueuePage />} />
          </Route>
        </Route>

      </Routes >
    </>
  )
}

export default App
