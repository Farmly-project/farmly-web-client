
import Mainlayout from './layouts/MainLayout'
import { Routes, Route } from "react-router-dom"
import { ProductListPage } from './pages/public/ProductListPage'
import { ProductDetailPage } from './pages/public/ProductDetailPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import CartPage from './pages/customer/CartPage'
import HomePage from './pages/public/HomePage'

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
        </Route>
      </Routes>
    </>
  )
}

export default App
