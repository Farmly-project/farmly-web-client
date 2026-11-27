import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';

export function GuestCartBanner() {
    return (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3.5">
            <div className="flex items-start sm:items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                    <LogIn className="h-4 w-4" />
                </div>
                <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">
                        Bạn đang dùng giỏ hàng tạm thời
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                        Đăng nhập để tự động lưu giỏ hàng trên nhiều thiết bị, theo dõi đơn
                        hàng và đăng ký gói rau định kỳ.
                    </p>
                </div>
            </div>

            <Link
                to="/login"
                state={{ from: '/cart' }}
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-emerald-900/15 bg-white px-4 text-xs sm:text-sm font-bold text-[#1B4332] hover:bg-emerald-50 transition"
            >
                Đăng nhập ngay
            </Link>
        </div>
    );
}