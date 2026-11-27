import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F3F8F3] flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1E462D] border-t-transparent" />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: `${location.pathname}${location.search}` }}
            />
        );
    }

    const normalizedRole = user.role?.toUpperCase() as UserRole;
    if (allowedRoles && !allowedRoles.includes(normalizedRole)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}