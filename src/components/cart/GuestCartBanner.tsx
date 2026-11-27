import { Link } from 'react-router-dom';
import { LogIn, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function GuestCartBanner() {
    const { isAuthenticated, user } = useAuth();
    const isStaffAccount = isAuthenticated && user && user.role.toUpperCase() !== 'CUSTOMER';

    return (
        <div className="mt-4 flex flex-col justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3.5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3 sm:items-center">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                    {isStaffAccount ? (
                        <ShieldAlert className="h-4 w-4" />
                    ) : (
                        <LogIn className="h-4 w-4" />
                    )}
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-900 sm:text-sm">
                        {isStaffAccount
                            ? `Bạn đang đăng nhập bằng tài khoản nội bộ (${user.role})`
                            : 'Bạn đang dùng giỏ hàng tạm thời'}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-600">
                        {isStaffAccount
                            ? 'Chỉ tài khoản Khách hàng (CUSTOMER) mới có thể tiến hành đặt hàng. Vui lòng đăng nhập tài khoản khách hàng để tiếp tục.'
                            : 'Đăng nhập để gộp giỏ hàng vào tài khoản, lưu sổ địa chỉ, theo dõi đơn hàng và đăng ký gói rau định kỳ.'}
                    </p>
                </div>
            </div>

            <Link
                to="/login"
                state={{ from: '/cart' }}
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-emerald-900/15 bg-white px-4 text-xs font-bold text-[#1B4332] transition hover:bg-emerald-50 sm:text-sm"
            >
                {isStaffAccount ? 'Đổi tài khoản' : 'Đăng nhập ngay'}
            </Link>
        </div>
    );
}

export default GuestCartBanner;