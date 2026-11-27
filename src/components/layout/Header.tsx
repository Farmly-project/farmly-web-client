import { useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    Search,
    ShoppingBasket,
    User,
    Menu,
    X,
    LogOut,
    Package,
    CalendarSync,
    QrCode,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import '../../../public/Css/Header.css'
const NAV_ITEMS = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Tất cả sản phẩm', path: '/products' },
    { label: 'Gói định kỳ', path: '/subscriptions' },
    { label: 'Flash Sale', path: '/products?flash_sale_only=true' },
    { label: 'Truy xuất QR', path: '/trace/BATCH-20261127-RAU01' },
];

export function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user, logout } = useAuth();
    const { items } = useCart();

    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

    const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const isFlashSaleRoute =
        location.pathname === '/products' &&
        new URLSearchParams(location.search).get('flash_sale_only') === 'true';

    const handleSearch = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmed = searchQuery.trim();
        if (trimmed.length > 100) return;

        navigate(
            trimmed
                ? `/products?search=${encodeURIComponent(trimmed)}`
                : '/products'
        );
        setIsMobileMenuOpen(false);
        setIsMobileSearchOpen(false);
    };

    const handleLogout = async () => {
        await logout();
        setIsMobileMenuOpen(false);
        navigate('/', { replace: true });
    };

    const checkItemActive = (path: string, routerIsActive: boolean) => {
        if (path === '/products?flash_sale_only=true') {
            return isFlashSaleRoute;
        }
        if (path === '/products') {
            return routerIsActive && !isFlashSaleRoute;
        }
        return routerIsActive;
    };

    const profileDestination =
        user?.role === 'ADMIN'
            ? '/admin/dashboard'
            : user?.role === 'FARM_STAFF'
                ? '/farm/batches'
                : user?.role === 'SALES'
                    ? '/sales/orders'
                    : '/profile';

    return (
        <header className="sticky top-0 z-50 w-full border-b border-emerald-900/10 bg-[#F3F8F3]/95 backdrop-blur-xs">
            {/* Top Announcement Bar */}
            <div className="w-full bg-farmly-cream py-2 px-3 sm:px-4 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-semibold tracking-wider text-neutral-900 uppercase">
                <span className="w-2 h-2 rounded-full bg-farmly-dot shrink-0"></span>
                <p className="text-center line-clamp-2 sm:line-clamp-1">
                    MINH BẠCH TUYỆT ĐỐI: ĐƠN HÀNG ĐƯỢC GIAO TRONG 6 GIỜ - ĐẠT CHỨNG NHẬN VÀ DUY NHẤT TỪ MỘT NÔNG TRẠI.
                </p>
            </div>

            {/* Main Header Row */}
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
                {/* 1. Logo Brand */}
                <Link
                    to="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="group flex shrink-0 items-center gap-2.5"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF2E2] text-[#1B4332]">
                        <svg
                            viewBox="0 0 32 32"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 transition-transform duration-200 group-hover:scale-105"
                        >
                            <path
                                d="M26 6C16 6 7 11.5 7 21C7 23.5 8 25.5 9.5 26.5C11 27.5 13 27 15.5 26.5C23 25 26 17 26 6Z"
                                stroke="currentColor"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M7 26C11.5 21 16 17 22 13"
                                stroke="currentColor"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>

                    <div className="flex flex-col leading-none">
                        <span className="text-lg font-extrabold tracking-tight text-[#1B4332] sm:text-xl">
                            FARMLY
                        </span>
                        <span className="mt-0.5 text-[8px] font-bold tracking-[0.14em] text-gray-600 uppercase sm:text-[9px]">
                            SINGLE-ORIGIN PRODUCE
                        </span>
                    </div>
                </Link>

                {/* 2. Pill Navigation Menu (Desktop) */}
                <nav className="hidden shrink-0 items-center overflow-hidden rounded-full border border-emerald-900/10 bg-white p-1 shadow-2xs lg:inline-flex">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) => {
                                const active = checkItemActive(item.path, isActive);
                                return `inline-flex min-h-[38px] items-center justify-center rounded-full px-3.5 text-[13px] leading-none font-semibold whitespace-nowrap transition-all duration-200 select-none xl:px-4 xl:text-sm ${active
                                    ? 'bg-[#1E462D] text-white shadow-2xs'
                                    : 'text-gray-700 hover:bg-[#F3F8F3] hover:text-[#1B4332]'
                                    }`;
                            }}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* 3. Right Actions: Search, Cart, Auth/Profile, Mobile Menu */}
                <div className="flex shrink-0 items-center gap-2">
                    {/* Desktop Search Input */}
                    <form
                        onSubmit={handleSearch}
                        className="hidden items-center rounded-full border border-emerald-900/15 bg-white px-3.5 py-1.5 transition focus-within:border-[#1E462D] md:flex md:w-48 lg:w-40 xl:w-56"
                    >
                        <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            maxLength={100}
                            placeholder="Tìm rau củ, mã QR..."
                            className="h-8 w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                        />
                    </form>

                    {/* Mobile Search Toggle (≥ 44x44px) */}
                    <button
                        type="button"
                        onClick={() => {
                            setIsMobileSearchOpen((prev) => !prev);
                            setIsMobileMenuOpen(false);
                        }}
                        aria-label="Mở tìm kiếm"
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-900/15 bg-white text-[#1B4332] transition hover:bg-emerald-50 md:hidden"
                    >
                        <Search className="h-5 w-5" />
                    </button>

                    {/* Cart Button with Dynamic Badge (≥ 44x44px) */}
                    <Link
                        to="/cart"
                        aria-label="Giỏ hàng"
                        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-emerald-900/15 bg-white text-[#1B4332] transition hover:bg-emerald-50"
                    >
                        <ShoppingBasket className="h-5 w-5" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white shadow-2xs">
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    {/* User Account / Login Button */}
                    {isAuthenticated && user ? (
                        <div className="hidden items-center gap-1.5 sm:flex">
                            <Link
                                to={profileDestination}
                                aria-label="Tài khoản cá nhân"
                                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1E462D] px-3.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#163622]"
                            >
                                <User className="h-4 w-4 shrink-0" />

                            </Link>
                            <button
                                type="button"
                                onClick={handleLogout}
                                title="Đăng xuất"
                                aria-label="Đăng xuất"
                                className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-900/15 bg-white text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className="hidden h-11 items-center justify-center rounded-full bg-[#1E462D] px-4 text-xs font-bold text-white shadow-2xs transition hover:bg-[#163622] sm:inline-flex sm:text-sm"
                        >
                            Đăng nhập
                        </Link>
                    )}

                    {/* Mobile Hamburger Menu (≥ 44x44px) */}
                    <button
                        type="button"
                        onClick={() => {
                            setIsMobileMenuOpen((prev) => !prev);
                            setIsMobileSearchOpen(false);
                        }}
                        aria-label="Mở menu điều hướng"
                        aria-expanded={isMobileMenuOpen}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-900/15 bg-white text-[#1B4332] transition hover:bg-emerald-50 lg:hidden"
                    >
                        {isMobileMenuOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Search Bar */}
            {isMobileSearchOpen && (
                <div className="border-t border-emerald-900/10 bg-[#F3F8F3] px-4 py-3 md:hidden">
                    <form
                        onSubmit={handleSearch}
                        className="flex items-center rounded-full border border-emerald-900/15 bg-white px-3.5"
                    >
                        <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
                        <input
                            type="text"
                            autoFocus
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            maxLength={100}
                            placeholder="Tìm kiếm rau củ, trái cây, mã QR..."
                            className="h-11 w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                        />
                    </form>
                </div>
            )}

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="border-t border-emerald-900/10 bg-white px-4 py-4 shadow-md lg:hidden">
                    <nav className="flex flex-col space-y-1">
                        {NAV_ITEMS.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/'}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) => {
                                    const active = checkItemActive(item.path, isActive);
                                    return `flex min-h-[44px] items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors ${active
                                        ? 'bg-[#1E462D] text-white'
                                        : 'text-gray-800 hover:bg-[#F3F8F3] hover:text-[#1B4332]'
                                        }`;
                                }}
                            >
                                {item.path.includes('subscriptions') && (
                                    <CalendarSync className="h-4 w-4 shrink-0" />
                                )}
                                {item.path.includes('trace') && (
                                    <QrCode className="h-4 w-4 shrink-0" />
                                )}
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* Khối Tài khoản trên Mobile Drawer */}
                    <div className="mt-3 border-t border-gray-100 pt-3">
                        {isAuthenticated && user ? (
                            <div className="flex items-center justify-between gap-2">
                                <Link
                                    to={profileDestination}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex min-h-[44px] flex-1 items-center gap-2 rounded-xl bg-[#F3F8F3] px-3.5 text-sm font-bold text-[#1B4332]"
                                >
                                    <Package className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{user.full_name}</span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="inline-flex h-11 items-center justify-center rounded-xl border border-red-200 px-3.5 text-xs font-bold text-red-600 hover:bg-red-50"
                                >
                                    Đăng xuất
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                <Link
                                    to="/login"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1E462D] text-sm font-bold text-white"
                                >
                                    Đăng nhập
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="inline-flex h-11 items-center justify-center rounded-xl border border-emerald-900/20 text-sm font-bold text-[#1B4332]"
                                >
                                    Đăng ký
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}

export default Header;