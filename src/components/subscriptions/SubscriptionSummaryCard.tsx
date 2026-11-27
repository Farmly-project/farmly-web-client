import {
    CalendarDays,
    ArrowRight,
    ShieldCheck,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { formatVND, formatDate } from '../../utils/formatters';
import type { ProductCardItem } from '../../types/product.types';

export interface SelectedSubscriptionLine {
    product: ProductCardItem;
    quantity: number;
    unitPrice: number;
    lineSubtotal: number;
}

interface SubscriptionSummaryCardProps {
    selectedItems: SelectedSubscriptionLine[];
    previewDates: string[];
    subtotalPerDelivery: number;
    shippingPerDelivery: number;
    totalPackageAmount: number;
    isAuthenticated: boolean;
    isSubmitting: boolean;
    formError: string | null;
}

export function SubscriptionSummaryCard({
    selectedItems,
    previewDates,
    subtotalPerDelivery,
    shippingPerDelivery,
    totalPackageAmount,
    isAuthenticated,
    isSubmitting,
    formError,
}: SubscriptionSummaryCardProps) {
    const deliveryCount = previewDates.length;

    return (
        <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base sm:text-lg font-extrabold text-gray-900">
                    Tóm tắt gói định kỳ 1 tháng
                </h3>
                <span className="rounded-full bg-[#DDF2E2] px-3 py-1 text-xs font-extrabold text-[#1B4332]">
                    {deliveryCount} kỳ giao
                </span>
            </div>

            {/* Danh sách món mỗi kỳ */}
            {selectedItems.length > 0 ? (
                <div className="space-y-2 text-xs sm:text-sm">
                    {selectedItems.map((row) => (
                        <div
                            key={row.product.id}
                            className="flex items-center justify-between text-gray-700"
                        >
                            <span>
                                {row.product.name} × <strong>{row.quantity}</strong>{' '}
                                {row.product.unit}
                            </span>
                            <span className="font-bold text-gray-900">
                                {formatVND(row.lineSubtotal)}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-amber-700 bg-amber-50 rounded-xl p-3">
                    Chưa chọn nông sản nào cho gói định kỳ.
                </p>
            )}

            {/* Lịch giao dự kiến */}
            {previewDates.length > 0 && (
                <div className="rounded-2xl bg-[#F8FAF8] border border-gray-100 p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1B4332]">
                        <CalendarDays className="h-4 w-4" />
                        <span>Lịch giao dự kiến ({previewDates.length} ngày):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                        {previewDates.map((d, idx) => (
                            <span
                                key={d}
                                className="rounded-lg bg-white border border-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-700"
                            >
                                Kỳ {idx + 1}: {formatDate(d)}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Chi tiết tính tiền */}
            <div className="space-y-2 border-t border-gray-100 pt-3 text-xs sm:text-sm">
                <div className="flex justify-between text-gray-600">
                    <span>Tiền nông sản / mỗi kỳ:</span>
                    <span className="font-bold text-gray-900">
                        {formatVND(subtotalPerDelivery)}
                    </span>
                </div>
                <div className="flex justify-between text-gray-600">
                    <span>Phí giao hàng / mỗi kỳ:</span>
                    <span className="font-bold text-gray-900">
                        {shippingPerDelivery === 0
                            ? 'Miễn phí (Đơn ≥ 200k)'
                            : formatVND(shippingPerDelivery)}
                    </span>
                </div>
                <div className="flex justify-between text-gray-600">
                    <span>Số kỳ giao trong 30 ngày:</span>
                    <span className="font-bold text-[#1B4332]">× {deliveryCount} kỳ</span>
                </div>

                <div className="flex items-baseline justify-between border-t border-gray-200/80 pt-3">
                    <span className="font-extrabold text-gray-900">
                        Tổng thanh toán gói:
                    </span>
                    <span className="text-2xl font-extrabold text-[#1B4332]">
                        {formatVND(totalPackageAmount)}
                    </span>
                </div>
            </div>

            {formError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                </div>
            )}

            <button
                type="submit"
                disabled={isSubmitting || deliveryCount === 0}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1E462D] px-5 text-sm font-extrabold text-white hover:bg-[#163622] disabled:opacity-50 transition"
            >
                {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <>
                        <span>
                            {isAuthenticated
                                ? 'Xác nhận & Thanh toán gói qua PayOS'
                                : 'Đăng nhập để đăng ký gói'}
                        </span>
                        <ArrowRight className="h-4 w-4" />
                    </>
                )}
            </button>

            <div className="flex items-center gap-2 text-[11px] text-gray-500 pt-1">
                <ShieldCheck className="h-4 w-4 text-[#1B4332] shrink-0" />
                <span>
                    Thu hộ 0đ mỗi lần giao • Đổi sản phẩm tương đương hoặc hoàn tiền nếu
                    nông trại thiếu hàng kỳ đó.
                </span>
            </div>
        </div>
    );
}