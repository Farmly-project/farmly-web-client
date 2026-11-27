import React, { useState, useEffect } from "react";
import { NavLink, Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Search, ShoppingBasket, User, Menu, X, LogIn } from "lucide-react";
import "../../../public/Css/Header.css";

interface HeaderProps {
    cartCount?: number;
}

const navItems = [
    { label: "Trang chủ", path: "/", exact: true },
    { label: "Tất cả sản phẩm", path: "/products", exact: false },
    { label: "Gói định kỳ", path: "/subscriptions", exact: false },
    { label: "Flash Sale", path: "/products?flash_sale_only=true", exact: false },
    { label: "Truy xuất QR", path: "/trace", exact: false },
];

export default function Header({ cartCount = 0 }: HeaderProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

    const isAuthenticated = Boolean(localStorage.getItem("access_token"));
    const isFlashSaleActive =
        location.pathname === "/products" && searchParams.get("flash_sale_only") === "true";

    // Đồng bộ ô tìm kiếm trên Header khi từ khóa trên URL thay đổi
    useEffect(() => {
        setSearchQuery(searchParams.get("search") || "");
    }, [searchParams]);

    // Xử lý tìm kiếm theo đặc tả UC07 (bước 3-4 & ngoại lệ E2)
    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmed = searchQuery.trim();

        if (trimmed.length > 100 || (trimmed.length > 0 && /^[^a-zA-Z0-9\u00C0-\u1EF9]+$/.test(trimmed))) {
            return;
        }

        setIsMobileMenuOpen(false);
        setIsMobileSearchOpen(false);

        if (trimmed) {
            navigate(`/products?search=${encodeURIComponent(trimmed)}`);
        } else {
            navigate("/products");
        }
    };

    // Kiểm tra trạng thái active chính xác cho từng mục menu
    const checkNavActive = (itemPath: string, isRouterActive: boolean) => {
        if (itemPath === "/products?flash_sale_only=true") {
            return isFlashSaleActive;
        }
        if (itemPath === "/products") {
            return location.pathname.startsWith("/products") && !isFlashSaleActive;
        }
        return isRouterActive;
    };

    return (
        <header className="w-full bg-farmly-mint border-b border-farmly-soft sticky top-0 z-50">
            {/* Top Announcement Bar */}
            <div className="w-full bg-farmly-cream py-2 px-3 sm:px-4 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-semibold tracking-wider text-neutral-900 uppercase">
                <span className="w-2 h-2 rounded-full bg-farmly-dot shrink-0"></span>
                <p className="text-center line-clamp-2 sm:line-clamp-1">
                    MINH BẠCH TUYỆT ĐỐI: ĐƠN HÀNG ĐƯỢC GIAO TRONG 6 GIỜ - ĐẠT CHỨNG NHẬN VÀ DUY NHẤT TỪ MỘT NÔNG TRẠI.
                </p>
            </div>

            {/* Main Header Row */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3.5 pt-2 flex items-center justify-between gap-3">
                {/* 1. Logo Brand */}
                <Link
                    to="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 shrink-0 group min-h-11"
                >
                    <svg
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-7 h-7 sm:w-8 sm:h-8 text-farmly-dark transition-transform duration-200 group-hover:scale-105"
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

                    <div className="flex flex-col leading-none">
                        <span className="text-lg sm:text-xl font-extrabold tracking-tight text-farmly-dark">
                            FARMLY
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-bold tracking-[0.14em] text-neutral-600 mt-0.5 uppercase">
                            SINGLE-ORIGIN PRODUCE
                        </span>
                    </div>
                </Link>

                {/* 2. Pill Navigation Menu */}
                <nav className="hidden lg:inline-flex items-center bg-white border border-farmly-soft rounded-full p-1 shadow-xs overflow-hidden shrink-0">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.exact}
                            className={({ isActive }) => {
                                const active = checkNavActive(item.path, isActive);
                                return `inline-flex items-center justify-center min-h-9.5 lg:px-4 xl:px-5 py-2 rounded-full lg:text-[13px] xl:text-sm font-semibold leading-none transition-all duration-200 whitespace-nowrap select-none ${active
                                    ? "bg-farmly-dark text-white shadow-xs"
                                    : "text-neutral-800 hover:text-farmly-dark hover:bg-neutral-50"
                                    }`;
                            }}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* 3. Right Actions: Search, Cart, Profile, Mobile Menu */}
                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                    {/* Desktop Search Input */}
                    <form
                        onSubmit={handleSearch}
                        className="hidden md:flex items-center bg-white border border-farmly-soft rounded-full px-3.5 h-11 md:w-48 lg:w-44 xl:w-64 focus-within:ring-2 focus-within:ring-farmly-dark/20 transition"
                    >
                        <Search className="w-4 h-4 text-neutral-500 mr-2 shrink-0" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm rau củ, trái cây..."
                            className="w-full bg-transparent text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery("");
                                    if (location.pathname === "/products") navigate("/products");
                                }}
                                aria-label="Xóa từ khóa"
                                className="text-neutral-400 hover:text-neutral-600 ml-1"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </form>

                    {/* Mobile Search Toggle (>= 44x44px theo NFR-U03) */}
                    <button
                        type="button"
                        onClick={() => {
                            setIsMobileSearchOpen(!isMobileSearchOpen);
                            setIsMobileMenuOpen(false);
                        }}
                        aria-label="Mở tìm kiếm"
                        className="md:hidden w-11 h-11 rounded-full bg-white border border-farmly-soft flex items-center justify-center text-farmly-dark hover:bg-neutral-50 transition"
                    >
                        <Search className="w-5 h-5 stroke-2" />
                    </button>

                    {/* Cart Button with Badge (>= 44x44px theo NFR-U03) */}
                    <Link
                        to="/cart"
                        aria-label="Giỏ hàng"
                        className="relative w-11 h-11 rounded-full bg-white border border-farmly-soft flex items-center justify-center text-farmly-dark hover:bg-neutral-50 transition"
                    >
                        <ShoppingBasket className="w-5 h-5 stroke-2" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-farmly-badge text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                                {cartCount > 99 ? "99+" : cartCount}
                            </span>
                        )}
                    </Link>

                    {/* User Profile / Login Button */}
                    {isAuthenticated ? (
                        <Link
                            to="/profile"
                            aria-label="Tài khoản cá nhân"
                            className="w-11 h-11 rounded-full bg-farmly-dark text-white flex items-center justify-center hover:opacity-90 transition shadow-xs"
                        >
                            <User className="w-5 h-5 stroke-2" />
                        </Link>
                    ) : (
                        <Link
                            to="/login"
                            aria-label="Đăng nhập"
                            className="inline-flex items-center justify-center gap-1.5 h-11 px-3.5 rounded-full bg-farmly-dark text-white text-xs sm:text-sm font-bold hover:opacity-90 transition shadow-xs"
                        >
                            <LogIn className="w-4 h-4 shrink-0" />
                            <span className="hidden sm:inline">Đăng nhập</span>
                        </Link>
                    )}

                    {/* Mobile Hamburger Menu (>= 44x44px theo NFR-U03) */}
                    <button
                        type="button"
                        onClick={() => {
                            setIsMobileMenuOpen(!isMobileMenuOpen);
                            setIsMobileSearchOpen(false);
                        }}
                        aria-label="Mở menu điều hướng"
                        aria-expanded={isMobileMenuOpen}
                        className="lg:hidden w-11 h-11 rounded-full bg-white border border-farmly-soft flex items-center justify-center text-farmly-dark hover:bg-neutral-50 transition"
                    >
                        {isMobileMenuOpen ? (
                            <X className="w-5 h-5 stroke-2" />
                        ) : (
                            <Menu className="w-5 h-5 stroke-2" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Search Bar */}
            {isMobileSearchOpen && (
                <div className="md:hidden px-3 pb-3 border-t border-farmly-soft pt-2.5 bg-farmly-mint">
                    <form
                        onSubmit={handleSearch}
                        className="flex items-center bg-white border border-farmly-soft rounded-full px-3.5 h-11"
                    >
                        <Search className="w-4 h-4 text-neutral-500 mr-2 shrink-0" />
                        <input
                            type="text"
                            autoFocus
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm rau củ, trái cây, mã lô..."
                            className="w-full bg-transparent text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none"
                        />
                    </form>
                </div>
            )}

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="lg:hidden bg-white border-t border-farmly-soft px-4 py-4 shadow-md">
                    <nav className="flex flex-col space-y-1.5">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.exact}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) => {
                                    const active = checkNavActive(item.path, isActive);
                                    return `min-h-11 flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${active
                                        ? "bg-farmly-dark text-white"
                                        : "text-neutral-800 hover:bg-farmly-mint hover:text-farmly-dark"
                                        }`;
                                }}
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            )}
        </header>
    );
}