import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    CheckCircle2,
    XCircle,
    Clock,
    Receipt,
    Package,
    ShoppingBag,
    RefreshCw,
    ArrowRight,
    Loader2,
    ShieldCheck,
} from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { customerOrderApi } from '../../services/orderService';
import { paymentService } from '../../services/paymentService';
import { ApiError } from '../../services/apiClient';
import { formatVND, formatDate } from '../../utils/formatters';
import type { OrderDetailData } from '../../types/order.types';

const SLOT_LABELS: Record<string, string> = {
    MORNING: 'Buổi sáng (08:00 – 11:30)',
    AFTERNOON: 'Buổi chiều (14:00 – 17:30)',
    EVENING: 'Buổi tối (18:00 – 20:30)',
};

export function PaymentResultPage() {
    const [searchParams] = useSearchParams();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { refreshCart, removeManyFromCart } = useCart();

    // Đọc các tham số PayOS trả về trên URL
    const orderId = searchParams.get('orderId');
    const payosCode = searchParams.get('code');
    const paymentLinkId = searchParams.get('id');
    const isCancelledParam = searchParams.get('cancel') === 'true';
    const statusParam = (searchParams.get('status') || '').toUpperCase();
    const payosOrderCode = searchParams.get('orderCode');

    const isCancelled = isCancelledParam || statusParam === 'CANCELLED';
    const isPaidFromUrl =
        !isCancelled && (statusParam === 'PAID' || payosCode === '00');

    const [order, setOrder] = useState<OrderDetailData | null>(null);
    const [isLoadingOrder, setIsLoadingOrder] = useState<boolean>(Boolean(orderId));
    const [isVerifying, setIsVerifying] = useState<boolean>(isPaidFromUrl);
    const [isRetrying, setIsRetrying] = useState<boolean>(false);
    const [retryError, setRetryError] = useState<string | null>(null);
    const hasSyncedRef = useRef(false);

    // Tải thông tin đơn hàng từ API #43
    const loadOrderInfo = useCallback(async () => {
        if (!orderId || !isAuthenticated) {
            setIsLoadingOrder(false);
            return;
        }

        setIsLoadingOrder(true);
        try {
            const raw = await customerOrderApi.getOrderById(orderId);
            const normalized =
                (raw as unknown as { order?: OrderDetailData; data?: OrderDetailData })
                    ?.order ??
                (raw as unknown as { data?: OrderDetailData })?.data ??
                raw;
            setOrder(normalized);
        } catch {
            // Giữ nguyên giao diện từ query params nếu chưa tải được chi tiết đơn
        } finally {
            setIsLoadingOrder(false);
        }
    }, [orderId, isAuthenticated]);

    // Chờ AuthContext khôi phục token xong mới gọi API
    useEffect(() => {
        if (isAuthLoading) return;

        // Nếu không phải luồng PAID (VD: CANCELLED) -> chỉ tải thông tin đơn
        if (!isPaidFromUrl || !orderId) {
            loadOrderInfo();
            return;
        }

        // Tránh chạy trùng 2 lần trong React StrictMode
        if (hasSyncedRef.current) return;
        hasSyncedRef.current = true;

        async function verifyAndSyncOrder() {
            setIsVerifying(true);
            try {
                // 1. Báo Backend kiểm tra với PayOS và cập nhật payments.status = 'paid'
                await paymentService.verifyPayOSPayment({
                    order_id: Number(orderId),
                    order_code: payosOrderCode,
                    payment_link_id: paymentLinkId,
                    status: statusParam,
                });
            } catch {
                // Bỏ qua nếu webhook đã cập nhật sang 'paid' trước đó
            } finally {
                setIsVerifying(false);
            }

            // 2. Xóa các món đã đặt khỏi giỏ hàng (UC06 - Bước 7)
            const storageKey = `pending_payos_cart_${orderId}`;
            const rawIds = sessionStorage.getItem(storageKey);
            if (rawIds) {
                try {
                    const itemIds = JSON.parse(rawIds) as string[];
                    if (itemIds.length > 0) {
                        await removeManyFromCart(itemIds);
                    }
                } finally {
                    sessionStorage.removeItem(storageKey);
                }
            }

            await refreshCart();
            // 3. Tải lại đơn hàng sau khi DB đã cập nhật 'paid'
            await loadOrderInfo();
        }

        verifyAndSyncOrder();
    }, [
        isAuthLoading,
        isPaidFromUrl,
        orderId,
        payosOrderCode,
        paymentLinkId,
        statusParam,
        refreshCart,
        removeManyFromCart,
        loadOrderInfo,
    ]);

    // Thanh toán lại qua PayOS nếu giao dịch trước bị hủy (UC06 - E4)
    const handleRetryPayment = async () => {
        if (!orderId) return;
        setIsRetrying(true);
        setRetryError(null);

        try {
            const origin = window.location.origin;
            const res = await paymentService.createPayOSPayment({
                order_id: Number(orderId),
                return_url: `${origin}/payments/return/payos?orderId=${orderId}`,
                cancel_url: `${origin}/payments/return/payos?orderId=${orderId}&status=CANCELLED`,
            });

            if (res?.checkout_url) {
                window.location.href = res.checkout_url;
                return;
            }
            setRetryError('Không nhận được đường dẫn thanh toán từ PayOS.');
        } catch (err) {
            setRetryError(
                err instanceof ApiError
                    ? err.message
                    : 'Không thể tạo lại liên kết thanh toán PayOS.'
            );
        } finally {
            setIsRetrying(false);
        }
    };

    // Kiểm tra trạng thái thanh toán đồng bộ cả từ DB lẫn URL
    const rawOrder = order as unknown as {
        payment_status?: string;
        payment?: { status?: string };
        payments?: Array<{ status?: string }>;
    } | null;

    const dbPaymentStatus = (
        rawOrder?.payment_status ??
        rawOrder?.payment?.status ??
        rawOrder?.payments?.[0]?.status ??
        ''
    ).toLowerCase();

    const isConfirmedPaid = dbPaymentStatus === 'paid' || isPaidFromUrl;

    return (
        <div className="min-h-[80vh] bg-[#F3F8F3] px-4 py-8 sm:py-12 text-gray-900">
            <div className="mx-auto max-w-xl">
                <div className="overflow-hidden rounded-3xl border border-emerald-900/10 bg-white shadow-xs">
                    {/* Header trạng thái giao dịch */}
                    {isConfirmedPaid ? (
                        <div className="bg-[#1E462D] px-6 py-8 text-center text-white">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#DDF2E2] text-[#1B4332]">
                                <CheckCircle2 className="h-9 w-9" />
                            </div>
                            <span className="mt-4 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-wide uppercase">
                                {isVerifying
                                    ? 'Đang đồng bộ hóa đơn...'
                                    : 'Giao dịch PayOS hoàn tất'}
                            </span>
                            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold">
                                Thanh toán thành công!
                            </h1>
                            <p className="mt-2 text-xs sm:text-sm text-emerald-100/90 max-w-md mx-auto leading-relaxed">
                                Đơn hàng của bạn đã được ghi nhận ở trạng thái{' '}
                                <strong>Chờ xác nhận</strong>. Nhân viên Sales sẽ duyệt đơn và
                                xuất lô thu hoạch tươi nhất theo chuẩn FEFO.
                            </p>
                        </div>
                    ) : isCancelled ? (
                        <div className="bg-amber-50 border-b border-amber-200/80 px-6 py-8 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                                <XCircle className="h-9 w-9" />
                            </div>
                            <span className="mt-4 inline-block rounded-full bg-amber-200/70 px-3 py-1 text-xs font-bold text-amber-900 uppercase">
                                Giao dịch đã hủy
                            </span>
                            <h1 className="mt-2 text-2xl font-extrabold text-gray-900">
                                Thanh toán chưa hoàn tất
                            </h1>
                            <p className="mt-2 text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                                Bạn đã hủy phiên chuyển khoản VietQR.{' '}
                                <strong className="text-gray-900">
                                    Các sản phẩm trong giỏ hàng vẫn được giữ nguyên
                                </strong>{' '}
                                để bạn thanh toán lại hoặc đổi sang COD.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-sky-50 border-b border-sky-200/80 px-6 py-8 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                                <Clock className="h-9 w-9" />
                            </div>
                            <h1 className="mt-4 text-2xl font-extrabold text-gray-900">
                                Đang xác nhận giao dịch
                            </h1>
                            <p className="mt-2 text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
                                Hệ thống đang đối soát kết quả từ cổng thanh toán PayOS. Vui
                                lòng kiểm tra lại trong chi tiết đơn hàng.
                            </p>
                        </div>
                    )}

                    {/* Chi tiết biên lai giao dịch & đơn hàng */}
                    <div className="p-6 sm:p-8 space-y-5">
                        <div className="rounded-2xl border border-gray-100 bg-[#F8FAF8] p-4 space-y-2.5 text-xs sm:text-sm">
                            <div className="flex items-center gap-2 font-extrabold text-gray-900 pb-1 border-b border-gray-200/70">
                                <Receipt className="h-4 w-4 text-[#1B4332]" />
                                <span>Thông tin giao dịch</span>
                            </div>

                            {orderId && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Mã đơn hàng Farmly:</span>
                                    <span className="font-extrabold text-gray-900">
                                        #{order?.order_code || orderId}
                                    </span>
                                </div>
                            )}

                            {payosOrderCode && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Mã giao dịch PayOS:</span>
                                    <span className="font-mono font-bold text-gray-800">
                                        {payosOrderCode}
                                    </span>
                                </div>
                            )}

                            {paymentLinkId && (
                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-500 shrink-0">Mã tham chiếu:</span>
                                    <span className="font-mono text-xs text-gray-600 truncate">
                                        {paymentLinkId}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Phương thức:</span>
                                <span className="font-bold text-[#1B4332]">
                                    Chuyển khoản VietQR (PayOS)
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Trạng thái:</span>
                                <span
                                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${isConfirmedPaid
                                            ? 'bg-[#DDF2E2] text-[#1B4332]'
                                            : 'bg-amber-100 text-amber-800'
                                        }`}
                                >
                                    {isConfirmedPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                </span>
                            </div>

                            {/* Thông tin bổ sung tải từ API đơn hàng */}
                            {isLoadingOrder || isVerifying ? (
                                <div className="pt-2 space-y-2 animate-pulse">
                                    <div className="h-4 w-2/3 rounded bg-gray-200" />
                                    <div className="h-5 w-1/2 rounded bg-gray-200" />
                                </div>
                            ) : (
                                order && (
                                    <>
                                        {(order.delivery_date || order.delivery_slot) && (
                                            <div className="flex justify-between gap-3 pt-1 border-t border-gray-200/70">
                                                <span className="text-gray-500 shrink-0">
                                                    Lịch giao dự kiến:
                                                </span>
                                                <span className="font-semibold text-gray-800 text-right">
                                                    {order.delivery_date
                                                        ? formatDate(order.delivery_date)
                                                        : ''}
                                                    {order.delivery_slot
                                                        ? ` • ${SLOT_LABELS[order.delivery_slot] || order.delivery_slot}`
                                                        : ''}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-baseline pt-2 border-t border-gray-200/70">
                                            <span className="font-bold text-gray-700">
                                                Tổng thanh toán:
                                            </span>
                                            <span className="text-xl font-extrabold text-[#1B4332]">
                                                {formatVND(order.total_amount)}
                                            </span>
                                        </div>
                                    </>
                                )
                            )}
                        </div>

                        {retryError && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                                {retryError}
                            </div>
                        )}

                        {/* Các nút điều hướng tiếp theo */}
                        {isConfirmedPaid ? (
                            <div className="space-y-2.5 pt-1">
                                <Link
                                    to={orderId ? `/orders/${orderId}` : '/orders'}
                                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1E462D] px-5 text-sm font-bold text-white hover:bg-[#163622] transition"
                                >
                                    <Package className="h-4 w-4" />
                                    <span>Xem chi tiết & theo dõi đơn hàng</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Link>

                                <Link
                                    to="/products"
                                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-900/15 bg-[#F3F8F3] px-5 text-sm font-bold text-[#1B4332] hover:bg-[#DDF2E2]/70 transition"
                                >
                                    <ShoppingBag className="h-4 w-4" />
                                    <span>Tiếp tục mua nông sản</span>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2.5 pt-1">
                                {orderId && (
                                    <button
                                        type="button"
                                        disabled={isRetrying}
                                        onClick={handleRetryPayment}
                                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1E462D] px-5 text-sm font-bold text-white hover:bg-[#163622] disabled:opacity-60 transition"
                                    >
                                        {isRetrying ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="h-4 w-4" />
                                        )}
                                        <span>Thanh toán lại qua PayOS</span>
                                    </button>
                                )}

                                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                    <Link
                                        to="/cart"
                                        className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-xs sm:text-sm font-bold text-gray-800 hover:bg-gray-50 transition"
                                    >
                                        Quay lại giỏ hàng
                                    </Link>

                                    {orderId && (
                                        <Link
                                            to={`/orders/${orderId}`}
                                            className="inline-flex h-11 items-center justify-center rounded-xl border border-emerald-900/15 bg-[#F3F8F3] px-4 text-xs sm:text-sm font-bold text-[#1B4332] hover:bg-[#DDF2E2]/70 transition"
                                        >
                                            Xem đơn #{orderId}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-2 pt-2 text-xs text-gray-500">
                            <ShieldCheck className="h-4 w-4 text-[#1B4332] shrink-0" />
                            <span>
                                Đổi trả / hoàn tiền trong 24h nếu nông sản bị dập hỏng khi giao
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PaymentResultPage;