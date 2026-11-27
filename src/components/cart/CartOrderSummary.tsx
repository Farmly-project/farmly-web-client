import { ArrowRight, ShieldCheck, QrCode, RefreshCw } from 'lucide-react';
import { formatVND } from '../../utils/formatters';

interface CartOrderSummaryProps {
    selectedCount: number;
    selectedSubTotal: number;
    totalSaved: number;
    hasSelectedItems: boolean;
    hasStockIssue: boolean;
    isCustomer: boolean;
    onProceedCheckout: () => void;
}

export function CartOrderSummary({
    selectedCount,
    selectedSubTotal,
    totalSaved,
    hasSelectedItems,
    hasStockIssue,
    isCustomer,
    onProceedCheckout,
}: CartOrderSummaryProps) {
    return (
        <aside className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-xs">
                <h2 className="text-lg font-extrabold text-gray-900">
                    Tóm tắt đơn hàng
                </h2>

                <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between text-gray-600">
                        <span>Tạm tính ({selectedCount} sản phẩm)</span>
                        <span className="font-bold text-gray-900">
                            {formatVND(selectedSubTotal)}
                        </span>
                    </div>

                    <div className="flex items-start justify-between gap-4 text-gray-600">
                        <div>
                            <span>Phí giao hàng</span>
                            <p className="text-[11px] text-gray-400">
                                Giao nội thành TP.HCM theo bậc km
                            </p>
                        </div>
                        <span className="text-right text-xs font-medium text-gray-500">
                            Tính ở bước đặt hàng
                        </span>
                    </div>

                    {totalSaved > 0 && (
                        <div className="flex items-center justify-between rounded-xl bg-[#DDF2E2]/70 px-3.5 py-2.5 text-xs font-bold text-[#1B4332]">
                            <span>Đã tiết kiệm từ ưu đãi cận hạn</span>
                            <span>{formatVND(totalSaved)}</span>
                        </div>
                    )}
                </div>

                <div className="my-5 border-t border-gray-100" />

                <div className="flex items-baseline justify-between">
                    <div>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-gray-700">
                            Tổng cộng tạm tính
                        </span>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                            Đã bao gồm đóng gói bảo quản tươi
                        </p>
                    </div>
                    <span className="text-2xl font-extrabold text-[#1B4332]">
                        {formatVND(selectedSubTotal)}
                    </span>
                </div>

                {hasStockIssue && (
                    <p className="mt-3 text-xs font-semibold text-red-600">
                        Vui lòng điều chỉnh số lượng các sản phẩm vượt tồn trước khi đặt
                        hàng.
                    </p>
                )}

                <button
                    type="button"
                    disabled={!hasSelectedItems || hasStockIssue}
                    onClick={onProceedCheckout}
                    className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1E462D] px-5 text-sm font-bold text-white hover:bg-[#163622] active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span>
                        {isCustomer ? 'Tiến hành đặt hàng' : 'Đăng nhập để đặt hàng'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                </button>

                {/* 3 Cam kết chất lượng */}
                <ul className="mt-5 space-y-2.5 text-xs text-gray-600">
                    <li className="flex items-center gap-2.5">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-[#1B4332]" />
                        <span>Thu hoạch trong ngày, chuẩn VietGAP tại vườn</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                        <QrCode className="h-4 w-4 shrink-0 text-[#1B4332]" />
                        <span>Truy xuất nguồn gốc & nhật ký canh tác từng lô</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                        <RefreshCw className="h-4 w-4 shrink-0 text-[#1B4332]" />
                        <span>Hỗ trợ đổi trả / hoàn tiền trong 24h nếu dập hỏng</span>
                    </li>
                </ul>

                {/* Phương thức thanh toán hỗ trợ (COD & PayOS) */}
                <div className="mt-5 rounded-2xl bg-[#F4F6F9] p-3.5 text-center">
                    <p className="text-[11px] font-medium text-gray-500">
                        Phương thức thanh toán hỗ trợ
                    </p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                        <span className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-700">
                            COD
                        </span>
                        <span className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-[#1B4332]">
                            PayOS (VietQR)
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );
}