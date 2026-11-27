import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import useCart from '../../hooks/useCart';
import { authService } from '../../services/authService';
import { checkoutOrderService } from '../../services/orderService';
import { paymentService } from '../../services/paymentService';
import { ApiError } from '../../services/apiClient';
import { formatVND } from '../../utils/formatters';
import type { CustomerAddress } from '../../types/auth.types';
import type {
    CheckoutItem,
    DeliveryTimeSlot,
    PaymentMethod,
    ShippingQuote,
} from '../../types/order.types';
import {
    CheckoutAddressCard,
    CheckoutDeliveryCard,
    CheckoutPaymentCard,
    CheckoutOrderSummary,
    type DeliveryDateOption,
} from '../../components/checkout';

function buildDeliveryDateOptions(): DeliveryDateOption[] {
    const options: DeliveryDateOption[] = [];
    const labels = ['Hôm nay', 'Ngày mai'];

    for (let i = 0; i < 2; i += 1) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        options.push({
            value: `${yyyy}-${mm}-${dd}`,
            label: `${labels[i]} (${dd}/${mm})`,
        });
    }
    return options;
}

export function CheckoutPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { items: cartItems, refreshCart } = useCart();

    const dateOptions = useMemo(() => buildDeliveryDateOptions(), []);

    // Lấy các sản phẩm được truyền từ CartPage hoặc mặc định toàn bộ sản phẩm khả dụng trong giỏ
    const checkoutItems: CheckoutItem[] = useMemo(() => {
        const stateItems = (location.state as { selectedItems?: CheckoutItem[] } | null)?.selectedItems;
        if (Array.isArray(stateItems) && stateItems.length > 0) {
            return stateItems;
        }

        return cartItems
            .filter((item) => item.is_available !== false && item.quantity > 0)
            .map((item) => {
                const originalPrice = item.original_price ?? undefined;

                return {
                    cart_item_id: item.id,
                    product_id: item.product_id,
                    name: item.product_name,
                    unit: item.unit,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    original_price: originalPrice,
                    image_url: item.image_url ?? null,
                    is_near_expiry: Boolean(
                        item.is_near_expiry_deal || (originalPrice && originalPrice > item.unit_price)
                    ),
                };
            });
    }, [location.state, cartItems]);

    const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(dateOptions[0].value);
    const [selectedSlot, setSelectedSlot] = useState<DeliveryTimeSlot>('AFTERNOON');
    const [note, setNote] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('payos');

    const [shippingQuote, setShippingQuote] = useState<ShippingQuote>({
        shipping_fee: 20000,
        distance_km: 6.5,
        is_supported: true,
    });
    const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const showNotification = useCallback((type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        window.setTimeout(() => setToast(null), 3500);
    }, []);

    // Nếu giỏ hàng trống thì quay lại /cart
    useEffect(() => {
        if (checkoutItems.length === 0) {
            navigate('/cart', { replace: true });
        }
    }, [checkoutItems.length, navigate]);

    // Tải sổ địa chỉ giao hàng của khách (API #9)
    useEffect(() => {
        let isMounted = true;
        authService
            .getAddresses()
            .then((list) => {
                if (!isMounted) return;
                const safeList = Array.isArray(list) ? list : [];
                setAddresses(safeList);
                const defaultAddr = safeList.find((a) => a.is_default) || safeList[0];
                if (defaultAddr) {
                    setSelectedAddressId(defaultAddr.id);
                }
            })
            .catch(() => {
                // Giữ danh sách rỗng để khách thêm mới
            });

        return () => {
            isMounted = false;
        };
    }, []);

    // Tính phí vận chuyển động mỗi khi đổi địa chỉ nhận hàng (API #41 - UC17)
    useEffect(() => {
        const activeAddr = addresses.find((a) => a.id === selectedAddressId);
        if (!activeAddr) return;

        let isMounted = true;
        setIsCalculatingShipping(true);

        const totalQty = checkoutItems.reduce((sum, i) => sum + i.quantity, 0);
        checkoutOrderService
            .calculateShipping({
                address_id: activeAddr.id,
                province: activeAddr.province,
                district: activeAddr.district,
                ward: activeAddr.ward,
                total_items: totalQty,
            })
            .then((quote) => {
                if (isMounted && quote) {
                    setShippingQuote({
                        shipping_fee: Number(quote.shipping_fee ?? 20000),
                        distance_km: Number(quote.distance_km ?? 6.5),
                        is_supported: quote.is_supported !== false,
                        unsupported_reason: quote.unsupported_reason,
                    });
                }
            })
            .catch(() => {
                // Kiểm tra nhanh phạm vi TP.HCM ở client nếu API chưa bật
                const isHcm = /hồ chí minh|hcm|thủ đức/i.test(activeAddr.province || '');
                if (isMounted) {
                    setShippingQuote(
                        isHcm
                            ? { shipping_fee: 20000, distance_km: 6.5, is_supported: true }
                            : {
                                shipping_fee: 0,
                                distance_km: 0,
                                is_supported: false,
                                unsupported_reason: 'Chưa hỗ trợ giao đến khu vực ngoài TP. Hồ Chí Minh.',
                            }
                    );
                }
            })
            .finally(() => {
                if (isMounted) setIsCalculatingShipping(false);
            });

        return () => {
            isMounted = false;
        };
    }, [addresses, selectedAddressId, checkoutItems]);

    const { subTotal, totalSavings } = useMemo(() => {
        return checkoutItems.reduce(
            (acc, item) => {
                const lineTotal = item.unit_price * item.quantity;
                const saving =
                    item.original_price && item.original_price > item.unit_price
                        ? (item.original_price - item.unit_price) * item.quantity
                        : 0;
                return {
                    subTotal: acc.subTotal + lineTotal,
                    totalSavings: acc.totalSavings + saving,
                };
            },
            { subTotal: 0, totalSavings: 0 }
        );
    }, [checkoutItems]);

    const grandTotal = subTotal + (shippingQuote.is_supported ? shippingQuote.shipping_fee : 0);
    const canSubmit =
        checkoutItems.length > 0 &&
        selectedAddressId !== null &&
        shippingQuote.is_supported &&
        !isCalculatingShipping;

    // Xử lý đặt hàng (UC06 - API #38 & API #47)
    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            showNotification('error', 'Vui lòng chọn hoặc thêm địa chỉ nhận hàng.');
            return;
        }
        if (!shippingQuote.is_supported) {
            showNotification('error', 'Địa chỉ hiện tại nằm ngoài khu vực giao hàng.');
            return;
        }

        setIsSubmitting(true);
        try {
            const orderPayload = {
                address_id: selectedAddressId,
                delivery_date: selectedDate,
                delivery_slot: selectedSlot,
                ...(note.trim() ? { note: note.trim() } : {}),
                payment_method: paymentMethod,
                items: checkoutItems.map((i) => ({
                    product_id: i.product_id,
                    quantity: i.quantity,
                    unit_price: i.unit_price,
                })),
            };

            const createdOrder = await checkoutOrderService.checkoutFromCart(orderPayload);

            // 1. Luồng PayOS: Giữ nguyên giỏ hàng, chỉ chuyển sang cổng thanh toán
            if (paymentMethod === 'payos') {
                const orderedCartItemIds = checkoutItems
                    .map((i) => i.cart_item_id)
                    .filter((id): id is string => Boolean(id));

                sessionStorage.setItem(
                    `pending_payos_cart_${createdOrder.id}`,
                    JSON.stringify(orderedCartItemIds)
                );

                const origin = window.location.origin;
                const paymentRes = await paymentService.createPayOSPayment({
                    order_id: createdOrder.id,
                    return_url: `${origin}/payments/return/payos?orderId=${createdOrder.id}`,
                    cancel_url: `${origin}/cart?payment=cancelled&orderId=${createdOrder.id}`,
                });

                if (paymentRes?.checkout_url) {
                    window.location.href = paymentRes.checkout_url;
                    return;
                }
            }

            // 2. Luồng COD: Đồng bộ lại giỏ hàng ngay và chuyển sang chi tiết đơn
            await refreshCart();
            navigate(`/orders/${createdOrder.id}`, {
                replace: true,
                state: { justOrdered: true },
            });
        } catch (err) {
            const msg =
                err instanceof ApiError
                    ? err.message
                    : 'Không thể tạo đơn hàng lúc này. Vui lòng kiểm tra tồn kho và thử lại.';
            showNotification('error', msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F8F3] pb-24 lg:pb-12 text-gray-900">
            {toast && (
                <div
                    role="status"
                    className={`fixed bottom-20 lg:bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-lg ${toast.type === 'success' ? 'bg-[#1E462D]' : 'bg-red-600'
                        }`}
                >
                    {toast.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-[#DDF2E2] shrink-0" />
                    ) : (
                        <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{toast.text}</span>
                </div>
            )}

            {/* Thanh tiến trình 3 bước (NFR-U04) */}
            <div className="border-b border-emerald-900/10 bg-white">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
                    <Link
                        to="/cart"
                        className="inline-flex min-h-11 items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1B4332] hover:opacity-80"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Quay lại giỏ hàng</span>
                    </Link>

                    <ol className="flex items-center gap-2 sm:gap-3 text-xs font-bold">
                        <li className="inline-flex items-center gap-1.5 text-[#1B4332]">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#DDF2E2]">
                                <Check className="h-3 w-3" />
                            </span>
                            <span className="hidden sm:inline">Giỏ hàng</span>
                        </li>
                        <span className="text-gray-300">—</span>
                        <li className="inline-flex items-center gap-1.5 text-[#163622]">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1E462D] text-[11px] text-white">
                                2
                            </span>
                            <span>Thanh toán & Giao hàng</span>
                        </li>
                        <span className="text-gray-300">—</span>
                        <li className="inline-flex items-center gap-1.5 text-gray-400">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[11px]">
                                3
                            </span>
                            <span className="hidden sm:inline">Hoàn tất</span>
                        </li>
                    </ol>
                </div>
            </div>

            {/* Nội dung chính 12 cột */}
            <div className="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
                    <div className="lg:col-span-8 space-y-5">
                        <CheckoutAddressCard
                            addresses={addresses}
                            selectedAddressId={selectedAddressId}
                            defaultRecipientName={user?.full_name || ''}
                            defaultPhone={user?.phone || ''}
                            onSelectAddress={setSelectedAddressId}
                            onAddressAdded={(created) => setAddresses((prev) => [...prev, created])}
                            onNotify={showNotification}
                        />

                        <CheckoutDeliveryCard
                            dateOptions={dateOptions}
                            selectedDate={selectedDate}
                            selectedSlot={selectedSlot}
                            note={note}
                            onSelectDate={setSelectedDate}
                            onSelectSlot={setSelectedSlot}
                            onChangeNote={setNote}
                        />

                        <CheckoutPaymentCard
                            selectedMethod={paymentMethod}
                            onSelectMethod={setPaymentMethod}
                        />
                    </div>

                    <CheckoutOrderSummary
                        items={checkoutItems}
                        subTotal={subTotal}
                        totalSavings={totalSavings}
                        shippingQuote={shippingQuote}
                        isCalculatingShipping={isCalculatingShipping}
                        paymentMethod={paymentMethod}
                        isSubmitting={isSubmitting}
                        canSubmit={canSubmit}
                        onPlaceOrder={handlePlaceOrder}
                    />
                </div>
            </div>

            {/* Thanh thanh toán ghim đáy màn hình Mobile 360px (NFR-U01, NFR-U02) */}
            <div className="fixed bottom-0 inset-x-0 z-30 border-t border-emerald-900/10 bg-white/95 backdrop-blur-xs px-4 py-3 shadow-lg lg:hidden">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[11px] font-medium text-gray-500">Tổng thanh toán</p>
                        <p className="text-lg font-extrabold text-[#163622] leading-tight">
                            {formatVND(grandTotal)}
                        </p>
                    </div>

                    <button
                        type="button"
                        disabled={!canSubmit || isSubmitting}
                        onClick={handlePlaceOrder}
                        className="inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#1E462D] px-5 text-sm font-bold text-white hover:bg-[#163622] disabled:opacity-50 transition"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <span>{paymentMethod === 'payos' ? 'Thanh toán PayOS' : 'Đặt hàng COD'}</span>
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CheckoutPage;