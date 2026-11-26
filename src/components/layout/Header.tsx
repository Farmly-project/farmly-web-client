import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Search, ShoppingBasket, User, Menu, X } from "lucide-react";
import "../../../public/Css/Header.css"
interface HeaderProps {
    cartCount?: number;
}

const navItems = [
    { label: "Trang chủ", path: "/" },
    { label: "Tất cả sản phẩm", path: "/products" },
    { label: "Gói định kỳ", path: "/subscriptions" },
    { label: "Flash Sale", path: "/flash-sale" },
    { label: "Truy xuất QR", path: "/qr-trace" },
];

export default function Header({ cartCount = 3 }: HeaderProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("Tìm kiếm:", searchQuery);
        setIsMobileMenuOpen(false);
        setIsMobileSearchOpen(false);
    };

    return (
        <header className="w-full bg-farmly-mint border-b border-farmly-soft sticky top-0 z-50">
            {/* Top Announcement Bar - Đồng bộ màu xanh mint */}
            <div className="w-full bg-farmly-cream py-2 px-3 sm:px-4 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-semibold tracking-wider text-neutral-900 uppercase">
                <span className="w-2 h-2 rounded-full bg-farmly-dot shrink-0"></span>
                <p className="text-center line-clamp-2 sm:line-clamp-1">
                    MINH BẠCH TUYỆT ĐỐI: ĐƠN HÀNG ĐƯỢC GIAO TRONG 6 GIỜ - ĐẠT CHỨNG NHẬN VÀ DUY NHẤT TỪ MỘT NÔNG TRẠI.
                </p>
            </div>

            {/* Main Header Row */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 pt-1.5 flex items-center justify-between gap-4">
                {/* 1. Logo Brand */}
                <Link
                    to="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 shrink-0 group"
                >
                    <svg
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-7 h-7 sm:w-[30px] sm:h-[30px] text-farmly-dark transition-transform duration-200 group-hover:scale-105"
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

                {/* 2. Pill Navigation Menu - Đã thêm overflow-hidden và inline-flex để không bao giờ lệch khung */}
                <nav className="hidden lg:inline-flex items-center bg-white border border-farmly-soft rounded-full p-1 shadow-xs overflow-hidden shrink-0">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === "/"}
                            className={({ isActive }) =>
                                `inline-flex items-center justify-center lg:px-4 xl:px-5 py-2 rounded-full lg:text-[13px] xl:text-sm font-semibold leading-none transition-all duration-200 whitespace-nowrap select-none ${isActive
                                    ? "bg-farmly-dark text-white shadow-xs"
                                    : "text-neutral-800 hover:text-farmly-dark hover:bg-neutral-50"
                                }`
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* 3. Right Actions: Search, Cart, Profile, Mobile Menu */}
                <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                    {/* Search Input */}
                    <form
                        onSubmit={handleSearch}
                        className="hidden md:flex items-center bg-white border border-farmly-soft rounded-full px-3.5 py-2 md:w-52 lg:w-44 xl:w-64 focus-within:ring-2 focus-within:ring-neutral-300 transition"
                    >
                        <Search className="w-4 h-4 text-neutral-500 mr-2 shrink-0" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm ..."
                            className="w-full bg-transparent text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none"
                        />
                    </form>

                    {/* Mobile Search Toggle */}
                    <button
                        type="button"
                        onClick={() => {
                            setIsMobileSearchOpen(!isMobileSearchOpen);
                            setIsMobileMenuOpen(false);
                        }}
                        aria-label="Mở tìm kiếm"
                        className="md:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-farmly-soft flex items-center justify-center text-farmly-dark hover:bg-neutral-50 transition"
                    >
                        <Search className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
                    </button>

                    {/* Cart Button with Badge */}
                    <Link
                        to="/cart"
                        aria-label="Giỏ hàng"
                        className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-farmly-soft flex items-center justify-center text-farmly-dark hover:bg-neutral-50 transition"
                    >
                        <ShoppingBasket className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1.5 -right-1 w-5 h-5 rounded-full bg-farmly-badge text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    {/* User Profile Button */}
                    <Link
                        to="/profile"
                        aria-label="Tài khoản cá nhân"
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-farmly-dark text-white flex items-center justify-center hover:opacity-90 transition shadow-xs"
                    >
                        <User className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
                    </Link>

                    {/* Mobile Hamburger Menu */}
                    <button
                        type="button"
                        onClick={() => {
                            setIsMobileMenuOpen(!isMobileMenuOpen);
                            setIsMobileSearchOpen(false);
                        }}
                        aria-label="Mở menu điều hướng"
                        aria-expanded={isMobileMenuOpen}
                        className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-farmly-soft flex items-center justify-center text-farmly-dark hover:bg-neutral-50 transition"
                    >
                        {isMobileMenuOpen ? (
                            <X className="w-5 h-5 stroke-[2]" />
                        ) : (
                            <Menu className="w-5 h-5 stroke-[2]" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Search Bar */}
            {isMobileSearchOpen && (
                <div className="md:hidden px-3 pb-3 border-t border-farmly-soft pt-2.5 bg-farmly-mint">
                    <form
                        onSubmit={handleSearch}
                        className="flex items-center bg-white border border-farmly-soft rounded-full px-3.5 py-2"
                    >
                        <Search className="w-4 h-4 text-neutral-500 mr-2 shrink-0" />
                        <input
                            type="text"
                            autoFocus
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm rau củ, trái cây, mã QR..."
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
                                end={item.path === "/"}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActive
                                        ? "bg-farmly-dark text-white"
                                        : "text-neutral-800 hover:bg-farmly-mint hover:text-farmly-dark"
                                    }`
                                }
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