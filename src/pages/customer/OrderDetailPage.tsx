import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useSearchParams, useLocation } from 'react-router-dom';
import {
    ArrowLeft,
    Package,
    MapPin,
    Calendar,
    CreditCard,
    QrCode,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    Truck,
    RefreshCw,
    Loader2,
    Star,
    MessageSquareWarning,
} from 'lucide-react';
import { customerOrderApi } from '../../services/orderService';
import { paymentService } from '../../services/paymentService';
import { ApiError } from '../../services/apiClient';
import { useCart } from '../../hooks/useCart';
import { formatVND, formatDate } from '../../utils/formatters';
import type { OrderDetailData, OrderStatus } from '../../types/order.types';
import { resolveOrderPayment } from '../../utils/orderHelpers';

const STATUS_META: Record<
    OrderStatus,
    { label: string; badgeClass: string; step: number }
> = {
    pending: {
        label: 'Chờ xác nhận',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        step: 1,
    },
    confirmed: {
        label: 'Đã xác nhận (Đã gán lô FEFO)',
        badgeClass: 'bg-emerald-100 text-[#1B4332] border-emerald-200',
        step: 2,
    },
    preparing: {
        label: 'Đang đóng gói lạnh',
        badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
        step: 3,
    },
    shipping: {
        label: 'Đang giao hàng',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        step: 4,
    },
    delivered: {
        label: 'Đã giao thành công',
        badgeClass: 'bg-[#DDF2E2] text-[#1B4332] border-emerald-300',
        step: 5,
    },
    cancelled: {
        label: 'Đã hủy',
        badgeClass: 'bg-red-100 text-red-700 border-red-200',
        step: 0,
    },
};

const SLOT_LABELS: Record<string, string> = {
    MORNING: 'Buổi sáng (08:00 – 11:30)',
    AFTERNOON: 'Buổi chiều (14:00 – 17:30)',
    EVENING: 'Buổi tối (18:00 – 20:30)',
};

export function OrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const { refreshCart, removeManyFromCart } = useCart();

    // Đọc tham số callback từ PayOS trên URL
    const payosStatus = searchParams.get('status')?.toUpperCase();
    const payosCancel = searchParams.get('cancel') === 'true';
    const payosCode = searchParams.get('code');
    const payosOrderCode = searchParams.get('orderCode');

    const isPayosCancelled = payosCancel || payosStatus === 'CANCELLED';
    const isPayosPaid =
        !isPayosCancelled && (payosStatus === 'PAID' || payosCode === '00');
    const justOrdered = Boolean(
        (location.state as { justOrdered?: boolean } | null)?.justOrdered
    );

    const [order, setOrder] = useState<OrderDetailData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
    const [bannerMsg, setBannerMsg] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    const fetchOrderDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        setErrorMsg(null);
        try {
            const raw = await customerOrderApi.getOrderById(id);
            const normalized =
                (raw as unknown as { order?: OrderDetailData })?.order ?? raw;
            setOrder(normalized);
        } catch (err) {
            setErrorMsg(
                err instanceof ApiError
                    ? err.message
                    : 'Không thể tải thông tin đơn hàng.'
            );
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchOrderDetail();
    }, [fetchOrderDetail]);

    // Nếu PayOS báo thanh toán thành công (PAID) -> mới xóa sản phẩm khỏi giỏ hàng
    useEffect(() => {
        if (!isPayosPaid || !id) return;

        async function finalizePaidCart() {
            const storageKey = `pending_payos_cart_${id}`;
            const rawIds = sessionStorage.getItem(storageKey);
            if (rawIds) {
                try {
                    const itemIds = JSON.parse(rawIds) as string[];
                    if (itemIds.length > 0) {
                        await removeManyFromCart(itemIds);
                    }
                } catch {
                    // Bỏ qua nếu webhook đã xóa
                } finally {
                    sessionStorage.removeItem(storageKey);
                }
            }
            await refreshCart();
        }

        finalizePaidCart();
    }, [isPayosPaid, id, refreshCart, removeManyFromCart]);

    // Thanh toán lại PayOS cho đơn hàng chưa thanh toán
    const handleRetryPayOS = async () => {
        if (!order) return;
        setIsActionLoading(true);
        setBannerMsg(null);
        try {
            const origin = window.location.origin;
            const res = await paymentService.createPayOSPayment({
                order_id: order.id,
                return_url: `${origin}/orders/${order.id}`,
                cancel_url: `${origin}/orders/${order.id}`,
            });
            if (res?.checkout_url) {
                window.location.href = res.checkout_url;
                return;
            }
            setBannerMsg({
                type: 'error',
                text: 'Không nhận được liên kết thanh toán từ PayOS.',
            });
        } catch (err) {
            setBannerMsg({
                type: 'error',
                text:
                    err instanceof ApiError
                        ? err.message
                        : 'Không thể khởi tạo lại giao dịch PayOS.',
            });
        } finally {
            setIsActionLoading(false);
        }
    };

    // Hủy đơn hàng khi trạng thái còn pending (API #46)
    const handleCancelOrder = async () => {
        if (!order) return;
        if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này không?')) return;

        setIsActionLoading(true);
        setBannerMsg(null);
        try {
            await customerOrderApi.cancelOrder(
                order.id,
                'Khách hàng hủy đơn trên trang chi tiết'
            );
            await fetchOrderDetail();
            setBannerMsg({
                type: 'success',
                text: 'Đã hủy đơn hàng thành công. Sản phẩm trong giỏ hàng của bạn vẫn được giữ nguyên.',
            });
        } catch (err) {
            setBannerMsg({
                type: 'error',
                text:
                    err instanceof ApiError
                        ? err.message
                        : 'Không thể hủy đơn hàng lúc này.',
            });
        } finally {
            setIsActionLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F3F8F3] py-8">
                <div className="mx-auto max-w-4xl px-4 space-y-4 animate-pulse">
                    <div className="h-8 w-48 rounded-xl bg-white" />
                    <div className="h-36 rounded-3xl bg-white" />
                    <div className="h-64 rounded-3xl bg-white" />
                </div>
            </div>
        );
    }

    if (errorMsg || !order) {
        return (
            <div className="min-h-[70vh] bg-[#F3F8F3] flex items-center justify-center px-4">
                <div className="max-w-md w-full rounded-3xl bg-white p-8 text-center border border-emerald-900/10 space-y-4">
                    <XCircle className="h-10 w-10 text-red-500 mx-auto" />
                    <h1 className="text-lg font-extrabold text-gray-900">
                        {errorMsg || 'Không tìm thấy đơn hàng'}
                    </h1>
                    <Link
                        to="/orders"
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1E462D] px-6 text-sm font-bold text-white"
                    >
                        Xem danh sách đơn hàng
                    </Link>
                </div>
            </div>
        );
    }

    const statusInfo = STATUS_META[order.status] ?? STATUS_META.pending;
    const hasPayosParams = Boolean(payosOrderCode || payosStatus || payosCancel);
    const { method: resolvedPaymentMethod, status: resolvedPaymentStatus } =
        resolveOrderPayment(order, hasPayosParams);
    const isUnpaidPayOS =
        resolvedPaymentMethod === 'payos' &&
        resolvedPaymentStatus !== 'paid' &&
        order.status !== 'cancelled';

    const recipientName =
        order.address?.recipient_name || order.recipient_name || 'Khách hàng Farmly';
    const recipientPhone = order.address?.phone || order.recipient_phone || '';
    const fullAddress = order.address
        ? [
            order.address.address_line,
            order.address.ward,
            order.address.district,
            order.address.province,
        ]
            .filter(Boolean)
            .join(', ')
        : order.shipping_address || 'Địa chỉ nhận hàng đã lưu';

    // Kiểm tra điều kiện khiếu nại trong vòng 24 giờ sau khi nhận hàng (UC03 / UC15)
    const canComplain =
        order.status === 'delivered' &&
        (!order.delivered_at ||
            Date.now() - new Date(order.delivered_at).getTime() <= 24 * 60 * 60 * 1000);

    return (
        <div className="min-h-screen bg-[#F3F8F3] pb-16 pt-6 text-gray-900">
            <div className="mx-auto max-w-4xl px-4 space-y-5">
                {/* Điều hướng quay lại */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                        to="/orders"
                        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-[#1B4332] hover:underline"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Danh sách đơn hàng</span>
                    </Link>

                    <Link
                        to="/cart"
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-emerald-900/15 bg-white px-3.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                    >
                        <span>Về giỏ hàng</span>
                    </Link>
                </div>

                {/* Banner thông báo khi PayOS redirect về với cancel=true & status=CANCELLED */}
                {isPayosCancelled && (
                    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5 space-y-3">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h2 className="text-sm sm:text-base font-extrabold text-amber-950">
                                    Giao dịch thanh toán PayOS đã bị hủy
                                    {payosOrderCode ? ` (Mã GD: #${payosOrderCode})` : ''}
                                </h2>
                                <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                                    Bạn chưa hoàn tất chuyển khoản VietQR nên{' '}
                                    <strong>các sản phẩm trong giỏ hàng vẫn được giữ nguyên</strong>.
                                    Bạn có thể bấm thanh toán lại bên dưới hoặc hủy đơn này để đặt lại bằng COD.
                                </p>
                            </div>
                        </div>

                        {isUnpaidPayOS && (
                            <div className="flex flex-wrap gap-2.5 pl-8">
                                <button
                                    type="button"
                                    disabled={isActionLoading}
                                    onClick={handleRetryPayOS}
                                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1E462D] px-4 text-xs sm:text-sm font-bold text-white hover:bg-[#163622] disabled:opacity-60"
                                >
                                    {isActionLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-4 w-4" />
                                    )}
                                    <span>Thanh toán lại qua PayOS</span>
                                </button>

                                {order.status === 'pending' && (
                                    <button
                                        type="button"
                                        disabled={isActionLoading}
                                        onClick={handleCancelOrder}
                                        className="inline-flex h-11 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-xs sm:text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                                    >
                                        <span>Hủy đơn này</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Banner khi PayOS thanh toán thành công hoặc vừa đặt COD */}
                {(isPayosPaid || justOrdered) && !isPayosCancelled && (
                    <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-[#DDF2E2] p-4 text-sm text-[#163622]">
                        <CheckCircle2 className="h-5 w-5 text-[#1B4332] shrink-0 mt-0.5" />
                        <div>
                            <p className="font-extrabold">
                                {isPayosPaid
                                    ? 'Thanh toán PayOS thành công!'
                                    : 'Đặt hàng thành công!'}
                            </p>
                            <p className="text-xs mt-0.5">
                                Đơn hàng đang ở trạng thái Chờ xác nhận. Nhân viên Sales sẽ duyệt đơn và phân bổ lô thu hoạch tươi nhất theo chuẩn FEFO.
                            </p>
                        </div>
                    </div>
                )}

                {bannerMsg && (
                    <div
                        className={`rounded-2xl border p-3.5 text-xs sm:text-sm font-semibold ${bannerMsg.type === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                            : 'border-red-200 bg-red-50 text-red-700'
                            }`}
                    >
                        {bannerMsg.text}
                    </div>
                )}

                {/* Header thông tin đơn hàng */}
                <section className="rounded-3xl border border-emerald-900/10 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                                    Đơn hàng #{order.order_code || order.id}
                                </h1>
                                <span
                                    className={`rounded-full border px-3 py-1 text-xs font-bold ${statusInfo.badgeClass}`}
                                >
                                    {statusInfo.label}
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Ngày đặt: {formatDate(order.created_at)}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {isUnpaidPayOS && !isPayosCancelled && (
                                <button
                                    type="button"
                                    disabled={isActionLoading}
                                    onClick={handleRetryPayOS}
                                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1E462D] px-4 text-xs sm:text-sm font-bold text-white hover:bg-[#163622]"
                                >
                                    <QrCode className="h-4 w-4" />
                                    <span>Thanh toán PayOS ngay</span>
                                </button>
                            )}

                            {order.status === 'pending' && !isPayosCancelled && (
                                <button
                                    type="button"
                                    disabled={isActionLoading}
                                    onClick={handleCancelOrder}
                                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-xs sm:text-sm font-bold text-red-700 hover:bg-red-100"
                                >
                                    <XCircle className="h-4 w-4" />
                                    <span>Hủy đơn hàng</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Thanh tiến trình đơn hàng */}
                    {order.status !== 'cancelled' && (
                        <div className="grid grid-cols-5 gap-1.5 pt-1 text-center">
                            {[
                                { step: 1, label: 'Chờ xác nhận', icon: Clock },
                                { step: 2, label: 'Đã duyệt FEFO', icon: CheckCircle2 },
                                { step: 3, label: 'Đóng gói', icon: Package },
                                { step: 4, label: 'Đang giao', icon: Truck },
                                { step: 5, label: 'Hoàn tất', icon: CheckCircle2 },
                            ].map((s) => {
                                const Icon = s.icon;
                                const active = statusInfo.step >= s.step;
                                return (
                                    <div key={s.step} className="flex flex-col items-center gap-1">
                                        <div
                                            className={`flex h-9 w-9 items-center justify-center rounded-full ${active
                                                ? 'bg-[#1E462D] text-white'
                                                : 'bg-gray-100 text-gray-400'
                                                }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <span
                                            className={`text-[11px] font-bold leading-tight ${active ? 'text-[#1B4332]' : 'text-gray-400'
                                                }`}
                                        >
                                            {s.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Thông tin giao hàng & Thanh toán */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <section className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-2xs space-y-2.5">
                        <div className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
                            <MapPin className="h-4 w-4 text-[#1B4332]" />
                            <span>Địa chỉ & Thời gian giao hàng</span>
                        </div>
                        <div className="text-xs sm:text-sm space-y-1 text-gray-700">
                            <p className="font-bold text-gray-900">
                                {recipientName} {recipientPhone && `• ${recipientPhone}`}
                            </p>
                            <p>{fullAddress}</p>
                            {(order.delivery_date || order.delivery_slot) && (
                                <p className="flex items-center gap-1.5 pt-1 text-xs font-semibold text-[#1B4332]">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>
                                        {order.delivery_date ? formatDate(order.delivery_date) : ''}
                                        {order.delivery_slot
                                            ? ` • ${SLOT_LABELS[order.delivery_slot] || order.delivery_slot}`
                                            : ''}
                                    </span>
                                </p>
                            )}
                            {order.note && (
                                <p className="text-xs text-gray-500 italic pt-1">
                                    Ghi chú: “{order.note}”
                                </p>
                            )}
                        </div>
                    </section>

                    <section className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-2xs space-y-2.5">
                        <div className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
                            <CreditCard className="h-4 w-4 text-[#1B4332]" />
                            <span>Thông tin thanh toán</span>
                        </div>
                        <div className="text-xs sm:text-sm space-y-1.5 text-gray-700">
                            <div className="flex justify-between">
                                <span>Phương thức:</span>
                                <span className="font-bold text-gray-900">
                                    {resolvedPaymentMethod === 'payos'
                                        ? 'Chuyển khoản VietQR (PayOS)'
                                        : 'Thanh toán khi nhận hàng (COD)'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Trạng thái thanh toán:</span>
                                <span
                                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${resolvedPaymentStatus === 'paid'
                                            ? 'bg-[#DDF2E2] text-[#1B4332]'
                                            : 'bg-amber-100 text-amber-800'
                                        }`}
                                >
                                    {resolvedPaymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                </span>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Danh sách sản phẩm & Chi tiết phân bổ lô FEFO (order_details) */}
                <section className="rounded-3xl border border-emerald-900/10 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
                    <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
                        Sản phẩm đã đặt ({order.items?.length || 0})
                    </h2>

                    <div className="divide-y divide-gray-100">
                        {(order.items || []).map((item) => {
                            const lineTotal =
                                item.subtotal ?? Number(item.unit_price) * Number(item.quantity);
                            return (
                                <div key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <img
                                                src={
                                                    item.image_url ||
                                                    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=200&q=80'
                                                }
                                                alt={item.product_name}
                                                className="h-14 w-14 rounded-xl object-cover bg-gray-100 shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <Link
                                                    to={`/products/${item.product_id}`}
                                                    className="text-sm font-bold text-gray-900 hover:text-[#1B4332] line-clamp-1"
                                                >
                                                    {item.product_name}
                                                </Link>
                                                <p className="text-xs text-gray-500">
                                                    {formatVND(item.unit_price)} / {item.unit} × {item.quantity}
                                                </p>
                                            </div>
                                        </div>

                                        <span className="text-sm font-extrabold text-gray-900 shrink-0">
                                            {formatVND(lineTotal)}
                                        </span>
                                    </div>

                                    {/* Hiển thị các lô hàng đã xuất theo FEFO sau khi Sales duyệt đơn */}
                                    {item.order_details && item.order_details.length > 0 && (
                                        <div className="ml-17 rounded-xl bg-[#F3F8F3] px-3 py-2 text-xs space-y-1">
                                            <p className="font-bold text-[#1B4332]">
                                                Lô thu hoạch xuất kho (FEFO):
                                            </p>
                                            {item.order_details.map((lot, idx) => (
                                                <div
                                                    key={lot.id ?? idx}
                                                    className="flex flex-wrap items-center justify-between gap-2 text-gray-700"
                                                >
                                                    <span>
                                                        • Mã lô:{' '}
                                                        <strong className="font-mono">
                                                            {lot.batch_code || `#${lot.batch_id}`}
                                                        </strong>{' '}
                                                        (SL: {lot.quantity} {item.unit})
                                                    </span>
                                                    {lot.batch_code && (
                                                        <Link
                                                            to={`/trace/${lot.batch_code}`}
                                                            className="font-bold text-[#1B4332] underline"
                                                        >
                                                            Truy xuất QR
                                                        </Link>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Nút Đánh giá & Khiếu nại 24h khi đơn đã giao (UC14, UC15) */}
                                    {order.status === 'delivered' && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            <Link
                                                to={`/products/${item.product_id}`}
                                                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#DDF2E2] px-3 text-xs font-bold text-[#1B4332]"
                                            >
                                                <Star className="h-3.5 w-3.5" />
                                                <span>Đánh giá sản phẩm</span>
                                            </Link>

                                            {canComplain && (
                                                <Link
                                                    to={`/orders/${order.id}/complaint?itemId=${item.id}`}
                                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 text-xs font-bold text-amber-900"
                                                >
                                                    <MessageSquareWarning className="h-3.5 w-3.5" />
                                                    <span>Khiếu nại / Đổi trả (24h)</span>
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Tổng kết tiền đơn hàng */}
                    <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Tạm tính tiền hàng</span>
                            <span className="font-semibold text-gray-900">
                                {formatVND(order.subtotal)}
                            </span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Phí vận chuyển</span>
                            <span className="font-semibold text-gray-900">
                                {order.shipping_fee === 0
                                    ? 'Miễn phí'
                                    : formatVND(order.shipping_fee)}
                            </span>
                        </div>
                        <div className="flex justify-between items-baseline border-t border-gray-100 pt-3">
                            <span className="text-sm font-extrabold uppercase text-gray-800">
                                Tổng thanh toán
                            </span>
                            <span className="text-2xl font-extrabold text-[#1B4332]">
                                {formatVND(order.total_amount)}
                            </span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default OrderDetailPage;