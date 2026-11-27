import { Link } from 'react-router-dom';
import {
    User,
    MapPin,
    Lock,
    LogOut,
    ShoppingBag,
    CalendarSync,
    ShieldCheck,
    ChevronRight,
} from 'lucide-react';

export type ProfileTab = 'info' | 'addresses' | 'password';

interface ProfileSidebarProps {
    fullName: string;
    email: string;
    avatarUrl: string | null;
    activeTab: ProfileTab;
    onSelectTab: (tab: ProfileTab) => void;
    onLogout: () => void;
}

export const PROFILE_TABS: { key: ProfileTab; label: string; icon: typeof User }[] = [
    { key: 'info', label: 'Thông tin cá nhân', icon: User },
    { key: 'addresses', label: 'Sổ địa chỉ giao hàng', icon: MapPin },
    { key: 'password', label: 'Đổi mật khẩu', icon: Lock },
];

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'KH';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function ProfileSidebar({
    fullName,
    email,
    avatarUrl,
    activeTab,
    onSelectTab,
    onLogout,
}: ProfileSidebarProps) {
    return (
        <aside className="lg:col-span-4 space-y-4">
            {/* Thẻ tóm tắt hồ sơ */}
            <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 text-center shadow-2xs">
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={fullName}
                        className="mx-auto h-20 w-20 rounded-full object-cover border-2 border-[#DDF2E2]"
                    />
                ) : (
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#BCEAD0] text-2xl font-extrabold text-[#163622]">
                        {getInitials(fullName)}
                    </div>
                )}

                <h2 className="mt-3.5 text-lg font-extrabold text-gray-900">{fullName}</h2>
                <p className="mt-0.5 text-xs text-gray-500">{email}</p>

                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#DDF2E2] px-3 py-1 text-xs font-bold text-[#1B4332]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Khách hàng</span>
                </div>
            </div>

            {/* Menu điều hướng tài khoản & Đăng xuất */}
            <div className="rounded-3xl border border-emerald-900/10 bg-white p-3 shadow-2xs space-y-1">
                <div className="hidden lg:block space-y-1">
                    {PROFILE_TABS.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.key;
                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => onSelectTab(item.key)}
                                className={`flex w-full min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-bold transition ${isActive
                                        ? 'bg-[#1E462D] text-white'
                                        : 'text-gray-700 hover:bg-[#F3F8F3]'
                                    }`}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                    <div className="my-2 border-t border-gray-100" />
                </div>

                <button
                    type="button"
                    onClick={onLogout}
                    className="flex w-full min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-bold text-red-600 hover:bg-red-50 transition"
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span>Đăng xuất</span>
                </button>
            </div>

            {/* Truy cập nhanh */}
            <div className="rounded-3xl border border-emerald-900/10 bg-white p-4 shadow-2xs space-y-2">
                <p className="px-2 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                    Truy cập nhanh
                </p>

                <Link
                    to="/orders"
                    className="flex min-h-11 items-center justify-between rounded-2xl px-3 py-2 text-sm font-bold text-gray-800 hover:bg-[#F3F8F3] transition"
                >
                    <span className="flex items-center gap-2.5">
                        <ShoppingBag className="h-4 w-4 text-gray-500" />
                        <span>Đơn hàng của tôi</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>

                <Link
                    to="/subscriptions"
                    className="flex min-h-11 items-center justify-between rounded-2xl px-3 py-2 text-sm font-bold text-gray-800 hover:bg-[#F3F8F3] transition"
                >
                    <span className="flex items-center gap-2.5">
                        <CalendarSync className="h-4 w-4 text-gray-500" />
                        <span>Gói rau định kỳ</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="rounded-full bg-[#DDF2E2] px-2.5 py-0.5 text-[11px] font-bold text-[#1B4332]">
                            Đang kích hoạt
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                    </span>
                </Link>
            </div>
        </aside>
    );
}