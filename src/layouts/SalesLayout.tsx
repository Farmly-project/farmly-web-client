import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    ClipboardCheck,
    Flame,
    PackageSearch,
    MessageSquareWarning,
    LogOut,
    Menu,
    X,
    Sprout,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from '../components/layout/NotificationBell';

const SALES_NAV_ITEMS = [
    {
        to: '/sales/orders',
        label: 'Duyệt đơn & FEFO',
        icon: ClipboardCheck,
    },
    {
        to: '/sales/flash-sale',
        label: 'Xả hàng cận hạn',
        icon: Flame,
    },
    {
        to: '/sales/subscription-shortage',
        label: 'Thiếu hàng gói',
        icon: PackageSearch,
    },
    {
        to: '/sales/complaints',
        label: 'Khiếu nại & Đổi trả',
        icon: MessageSquareWarning,
    },
];

export function SalesLayout() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout?.();
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role');
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen bg-[#F3F8F3] text-gray-900 flex flex-col">
            {/* Topbar */}
            <header className="sticky top-0 z-30 border-b border-emerald-900/10 bg-white/95 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen((v) => !v)}
                            aria-label="Mở menu điều hướng Sales"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 lg:hidden"
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>

                        <NavLink to="/sales/orders" className="flex items-center gap-2.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E462D] text-white">
                                <Sprout className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-sm font-extrabold tracking-tight text-[#1E462D]">
                                    FARMLY SALES
                                </div>
                                <div className="text-[11px] font-medium text-gray-500">
                                    Điều phối đơn & CSKH
                                </div>
                            </div>
                        </NavLink>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-1.5">
                        {SALES_NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) =>
                                        `inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3.5 text-xs font-bold transition ${isActive
                                            ? 'bg-[#1E462D] text-white shadow-sm'
                                            : 'text-gray-700 hover:bg-[#DDF2E2]/70 hover:text-[#1E462D]'
                                        }`
                                    }
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{item.label}</span>
                                </NavLink>
                            );
                        })}
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        <NotificationBell />
                        <div className="hidden sm:block text-right mr-1">
                            <div className="text-xs font-bold text-gray-900">
                                {user?.full_name || 'Nhân viên Sales'}
                            </div>
                            <div className="text-[11px] font-semibold uppercase text-emerald-700">
                                SALES
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">Đăng xuất</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Drawer */}
                {mobileMenuOpen && (
                    <div className="border-t border-gray-100 bg-white px-4 py-3 space-y-1.5 lg:hidden">
                        {SALES_NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `flex min-h-[44px] items-center gap-2.5 rounded-xl px-3.5 text-sm font-bold transition ${isActive
                                            ? 'bg-[#1E462D] text-white'
                                            : 'text-gray-700 hover:bg-[#DDF2E2]/60'
                                        }`
                                    }
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{item.label}</span>
                                </NavLink>
                            );
                        })}
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
                <Outlet />
            </main>
        </div>
    );
}

export default SalesLayout;