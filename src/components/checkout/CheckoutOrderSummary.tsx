import { Link } from 'react-router-dom';
import {
    CheckCircle2,
    ShieldCheck,
    ArrowRight,
    PiggyBank,
    Info,
    Loader2,
    AlertTriangle,
} from 'lucide-react';
import { formatVND } from '../../utils/formatters';
import type { CheckoutItem, PaymentMethod, ShippingQuote } from '../../types/order.types';

interface CheckoutOrderSummaryProps {
    items: CheckoutItem[];
    subTotal: number;
    totalSavings: number;
    shippingQuote: ShippingQuote;
    isCalculatingShipping: boolean;
    paymentMethod: PaymentMethod;
    isSubmitting: boolean;
    canSubmit: boolean;
    onPlaceOrder: () => void;
}

export function CheckoutOrderSummary({
    items,
    subTotal,
    totalSavings,
    shippingQuote,
    isCalculatingShipping,
    paymentMethod,
    isSubmitting,
    canSubmit,
    onPlaceOrder,
}: CheckoutOrderSummaryProps) {
    const grandTotal = subTotal + (shippingQuote.is_supported ? shippingQuote.shipping_fee : 0);

    return (
        <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
                        Đơn hàng của bạn{' '}
                        <span className="text-xs font-semibold text-gray-500">({items.length} sản phẩm)</span>
                    </h2>
                    <Link
                        to="/cart"
                        className="inline-flex min-h-9 items-center px-2 text-xs font-bold text-[#1B4332] hover:underline"
                    >
                        Sửa
                    </Link>
                </div>

                {/* Danh sách sản phẩm trong đơn */}
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-0.5">
                    {items.map((item) => (
                        <div
                            key={item.product_id}
                            className="flex items-center justify-between gap-3 rounded-2xl bg-[#F3F8F3]/75 p-2.5"
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                    src={
                                        item.image_url ||
                                        'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=160&q=80'
                                    }
                                    alt={item.name}
                                    className="h-12 w-12 rounded-xl object-cover bg-white shrink-0"
                                />
                                <div className="min-w-0">
                                    <p className="truncate text-xs sm:text-sm font-bold text-gray-900">{item.name}</p>
                                    <p className="text-[11px] text-gray-500">
                                        {item.unit} × {item.quantity}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right shrink-0">
                                <p className="text-xs sm:text-sm font-extrabold text-gray-900">
                                    {formatVND(item.unit_price * item.quantity)}
                                </p>
                                {item.is_near_expiry ? (
                                    <span className="mt-0.5 inline-block rounded-md bg-[#DDF2E2] px-1.5 py-0.5 text-[10px] font-bold text-[#1B4332]">
                                        Ưu đãi cận hạn
                                    </span>
                                ) : (
                                    <span className="block text-[10px] text-gray-400">
                                        {item.cert_badge || 'Nông trại Farmly'}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chi tiết tiền */}
                <div className="border-t border-gray-100 pt-3.5 space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-between text-gray-600">
                        <span>Tạm tính ({items.length} sản phẩm)</span>
                        <span className="font-bold text-gray-900">{formatVND(subTotal)}</span>
                    </div>

                    <div className="flex items-start justify-between text-gray-600">
                        <div>
                            <span className="inline-flex items-center gap-1">
                                <span>Phí giao hàng</span>
                                <Info className="h-3.5 w-3.5 text-gray-400" />
                            </span>
                            <p className="text-[11px] text-gray-400">
                                {isCalculatingShipping
                                    ? 'Đang tính khoảng cách...'
                                    : shippingQuote.is_supported
                                        ? `Nội thành TP.HCM • Tuyến giao ${shippingQuote.distance_km} km`
                                        : 'Ngoài phạm vi giao hàng'}
                            </p>
                        </div>
                        <span className="font-bold text-gray-900">
                            {isCalculatingShipping ? '...' : formatVND(shippingQuote.shipping_fee)}
                        </span>
                    </div>
                </div>

                {/* Cảnh báo ngoài khu vực giao hàng (UC06 - E3) */}
                {!shippingQuote.is_supported && (
                    <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>
                            {shippingQuote.unsupported_reason ||
                                'Chưa hỗ trợ giao đến khu vực này. Vui lòng chọn địa chỉ tại nội thành TP.HCM.'}
                        </span>
                    </div>
                )}

                {/* Thông báo tiết kiệm (không ghi dấu trừ để tránh lệch phép cộng tổng) */}
                {totalSavings > 0 && (
                    <div className="flex items-center justify-between rounded-2xl bg-[#DDF2E2] px-3.5 py-2.5 text-xs font-bold text-[#1B4332]">
                        <span className="inline-flex items-center gap-1.5">
                            <PiggyBank className="h-4 w-4 shrink-0" />
                            <span>Đã tiết kiệm từ ưu đãi lô cận hạn</span>
                        </span>
                        <span>{formatVND(totalSavings)}</span>
                    </div>
                )}

                {/* Tổng thanh toán */}
                <div className="rounded-2xl bg-[#EFF3FA] p-4">
                    <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-gray-600">
                            Tổng thanh toán
                        </span>
                        <span className="text-2xl font-extrabold text-[#163622]">
                            {formatVND(grandTotal)}
                        </span>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500">
                        Giá chốt tại thời điểm đặt hàng (Đã bao gồm VAT)
                    </p>
                </div>

                {/* Nút đặt hàng (Desktop & Tablet) */}
                <button
                    type="button"
                    disabled={!canSubmit || isSubmitting}
                    onClick={onPlaceOrder}
                    className="hidden lg:inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1E462D] px-5 text-sm font-bold text-white hover:bg-[#163622] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <span>
                                {paymentMethod === 'payos'
                                    ? 'Đặt hàng & Thanh toán PayOS'
                                    : 'Xác nhận đặt hàng (COD)'}
                            </span>
                            <ArrowRight className="h-4 w-4" />
                        </>
                    )}
                </button>

                {/* Cam kết vận hành FEFO & Đổi trả 24h */}
                <div className="space-y-2 pt-1 text-[11px] text-gray-500 leading-relaxed">
                    <p className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#1E462D] shrink-0 mt-0.5" />
                        <span>
                            Đơn hàng sẽ được Sales duyệt & xuất kho chuẩn <strong>FEFO</strong> (Hết hạn trước -
                            Xuất trước).
                        </span>
                    </p>
                    <p className="flex items-start gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#1E462D] shrink-0 mt-0.5" />
                        <span>
                            Cam kết <strong>hoàn tiền 100%</strong> hoặc giao bù trong 24h nếu rau dập hỏng do
                            vận chuyển.
                        </span>
                    </p>
                </div>
            </div>
        </aside>
    );
}