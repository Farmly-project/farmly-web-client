// src/components/auth/RoleGuard.tsx
// Bảo vệ route /admin/* — chặn truy cập trái phép theo role.
// verbatimModuleSyntax: import type cho mọi interface/type.

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import type { UserRole } from '../../contexts/AuthContext'

/** Role nội bộ được phép vào /admin */
const INTERNAL_ROLES: UserRole[] = ['admin', 'sales']

/** Đường dẫn mặc định theo role khi không có quyền vào route yêu cầu */
function getDefaultPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'sales':
      return '/admin/orders'
    default:
      return '/'
  }
}

interface RoleGuardProps {
  /**
   * Danh sách role được phép.
   * - Nếu undefined → cho phép mọi INTERNAL_ROLES.
   * - Admin luôn bypass allowedRoles.
   */
  allowedRoles?: UserRole[]
}

/**
 * RoleGuard — guard cho khu vực /admin/*
 *
 * Flow:
 *   isLoading        → spinner
 *   chưa đăng nhập  → /login (kèm returnTo)
 *   role=customer    → /
 *   role không nội bộ → /
 *   role không khớp allowedRoles (và không phải admin) → getDefaultPath
 *   OK               → <Outlet />
 */
export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-farmly-mint flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-farmly-dark border-t-transparent" />
          <p className="text-sm font-medium text-farmly-dark">
            Đang xác thực quyền truy cập...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  const role = user.role?.trim().toLowerCase() as UserRole

  // Khách hàng không được vào khu nội bộ
  if (role === 'customer' || !INTERNAL_ROLES.includes(role)) {
    return <Navigate to="/" replace />
  }

  // Kiểm tra allowedRoles cụ thể (admin luôn pass)
  if (allowedRoles && role !== 'admin' && !allowedRoles.includes(role)) {
    return <Navigate to={getDefaultPath(role)} replace />
  }

  return <Outlet />
}

export default RoleGuard

