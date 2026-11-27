import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Plus, PackageCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { subscriptionService } from '../../services/subscriptionService';
import { productService } from '../../services/productService';
import { ApiError } from '../../services/apiClient';
import {
    SubscriptionHeroHeader,
    SubscriptionProductSelector,
    SubscriptionScheduleForm,
    SubscriptionSummaryCard,
    SubscriptionCard,
    WEEKDAY_OPTIONS,
} from '../../components/subscriptions';
import type { SubscriptionRecord } from '../../types/subscription.types';
import type { ProductCardItem } from '../../types/product.types';
import { paymentService } from '../../services/paymentService';

function getTomorrowISO(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
}

function computePreviewDates(startDateStr: string, weekdays: string[]): string[] {
    if (!startDateStr || weekdays.length === 0) return [];
    const start = new Date(startDateStr);
    if (Number.isNaN(start.getTime())) return [];

    const targetJsDays = new Set(
        WEEKDAY_OPTIONS.filter((w: { key: string; }) => weekdays.includes(w.key)).map((w) => w.jsDay)
    );

    const dates: string[] = [];
    for (let offset = 0; offset < 30; offset++) {
        const current = new Date(start);
        current.setDate(start.getDate() + offset);
        if (targetJsDays.has(current.getDay())) {
            dates.push(current.toISOString().split('T')[0]);
        }
    }
    return dates;
}

export function SubscriptionListPage() {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();

    const [activeTab, setActiveTab] = useState<'builder' | 'my-list'>('builder');
    const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
    const [isLoadingSubs, setIsLoadingSubs] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

    const [eligibleProducts, setEligibleProducts] = useState<ProductCardItem[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);

    const [selectedQuantities, setSelectedQuantities] = useState<Record<number, number>>({});
    const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>(['TUE', 'FRI']);
    const [deliverySlot, setDeliverySlot] = useState<string>('MORNING');
    const [startDate, setStartDate] = useState<string>(getTomorrowISO());
    const [shippingAddress, setShippingAddress] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [successBanner, setSuccessBanner] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        setIsLoadingProducts(true);

        productService
            .getProducts({ allow_subscription: true, limit: 20 })
            .then((res) => {
                if (!mounted) return;
                const raw =
                    (res as unknown as { items?: ProductCardItem[]; data?: ProductCardItem[] })
                        ?.items ??
                    (res as unknown as { data?: ProductCardItem[] })?.data ??
                    [];
                setEligibleProducts(raw);

                if (raw.length > 0) {
                    const initial: Record<number, number> = { [raw[0].id]: 1 };
                    if (raw[1]) initial[raw[1].id] = 1;
                    setSelectedQuantities(initial);
                }
            })
            .catch(() => {
                if (mounted) setEligibleProducts([]);
            })
            .finally(() => {
                if (mounted) setIsLoadingProducts(false);
            });

        return () => {
            mounted = false;
        };
    }, []);

    const loadMySubscriptions = useCallback(async () => {
        if (!isAuthenticated) return;
        setIsLoadingSubs(true);
        try {
            const raw = await subscriptionService.getMySubscriptions();
            const list = Array.isArray(raw)
                ? raw
                : (raw as unknown as { data?: SubscriptionRecord[]; subscriptions?: SubscriptionRecord[] })
                    ?.data ??
                (raw as unknown as { subscriptions?: SubscriptionRecord[] })?.subscriptions ??
                [];
            setSubscriptions(list);
            if (list.length > 0) {
                setActiveTab('my-list');
            }
        } catch {
            setSubscriptions([]);
        } finally {
            setIsLoadingSubs(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthLoading && isAuthenticated) {
            loadMySubscriptions();
        }
    }, [isAuthLoading, isAuthenticated, loadMySubscriptions]);

    const previewDates = useMemo(
        () => computePreviewDates(startDate, selectedWeekdays),
        [startDate, selectedWeekdays]
    );

    const selectedItemsSummary = useMemo(
        () =>
            eligibleProducts
                .filter((p) => (selectedQuantities[p.id] ?? 0) > 0)
                .map((p) => {
                    const quantity = selectedQuantities[p.id];
                    const unitPrice = Number(p.base_price);
                    return {
                        product: p,
                        quantity,
                        unitPrice,
                        lineSubtotal: unitPrice * quantity,
                    };
                }),
        [eligibleProducts, selectedQuantities]
    );

    const subtotalPerDelivery = useMemo(
        () => selectedItemsSummary.reduce((sum, item) => sum + item.lineSubtotal, 0),
        [selectedItemsSummary]
    );

    const shippingPerDelivery = subtotalPerDelivery >= 200000 ? 0 : 15000;
    const totalPackageAmount =
        (subtotalPerDelivery + shippingPerDelivery) * previewDates.length;

    const toggleWeekday = (dayKey: string) => {
        setSelectedWeekdays((prev) =>
            prev.includes(dayKey)
                ? prev.length > 1
                    ? prev.filter((d) => d !== dayKey)
                    : prev
                : [...prev, dayKey]
        );
    };

    const updateItemQty = (productId: number, delta: number) => {
        setSelectedQuantities((prev) => {
            const nextQty = Math.max(0, (prev[productId] ?? 0) + delta);
            const copy = { ...prev };
            if (nextQty === 0) {
                delete copy[productId];
            } else {
                copy[productId] = nextQty;
            }
            return copy;
        });
    };

    const getPayOSCheckoutUrl = (res: unknown): string | null => {
        if (!res || typeof res !== 'object') return null;
        const r = res as Record<string, unknown>;
        const d1 =
            r.data && typeof r.data === 'object'
                ? (r.data as Record<string, unknown>)
                : r;
        const d2 =
            d1.data && typeof d1.data === 'object'
                ? (d1.data as Record<string, unknown>)
                : d1;

        const url =
            d2.checkoutUrl ??
            d2.checkout_url ??
            d2.paymentUrl ??
            d2.payment_url ??
            d1.checkoutUrl ??
            d1.checkout_url ??
            d1.paymentUrl ??
            d1.payment_url ??
            r.checkoutUrl ??
            r.checkout_url ??
            r.paymentUrl ??
            r.payment_url;

        return typeof url === 'string' && url.length > 0 ? url : null;
    };

    const handleCreateSubscription = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setSuccessBanner(null);

        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/subscriptions' } });
            return;
        }
        if (!startDate || startDate < getTomorrowISO()) {
            setFormError('Ngày bắt đầu giao gói phải từ ngày mai trở đi.');
            return;
        }
        if (selectedWeekdays.length === 0) {
            setFormError('Vui lòng chọn ít nhất 1 ngày giao cố định trong tuần.');
            return;
        }
        if (selectedItemsSummary.length === 0) {
            setFormError('Vui lòng chọn ít nhất 1 loại nông sản cho gói định kỳ.');
            return;
        }
        if (!shippingAddress.trim()) {
            setFormError('Vui lòng nhập địa chỉ nhận nông sản định kỳ tại TP.HCM.');
            return;
        }

        setIsSubmitting(true);
        try {
            const deliveryDayNumbers = selectedWeekdays
                .map((key) => WEEKDAY_OPTIONS.find((w) => w.key === key)?.code)
                .filter((code): code is number => typeof code === 'number');

            const subRes = await subscriptionService.createSubscription({
                shipping_address: shippingAddress.trim(),
                delivery_days: deliveryDayNumbers,
                delivery_slot: deliverySlot,
                start_date: startDate,
                items: selectedItemsSummary.map((item) => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                })),
            });

            // 1. Nếu API tạo gói trả sẵn link thanh toán (giống Checkout khi có sẵn link)
            const directUrl = getPayOSCheckoutUrl(subRes);
            if (directUrl) {
                window.location.href = directUrl;
                return;
            }

            // 2. Lấy subscription_id giống cách Checkout lấy order_id rồi gọi createPayOSPayment
            const raw = (subRes ?? {}) as Record<string, unknown>;
            const dataObj =
                raw.data && typeof raw.data === 'object'
                    ? (raw.data as Record<string, unknown>)
                    : raw;
            const subObj =
                dataObj.subscription && typeof dataObj.subscription === 'object'
                    ? (dataObj.subscription as Record<string, unknown>)
                    : undefined;

            const subscriptionId = Number(
                dataObj.id ?? dataObj.subscription_id ?? subObj?.id ?? 0
            );

            if (!subscriptionId) {
                throw new Error('Không tìm thấy mã gói định kỳ sau khi tạo.');
            }

            const origin = window.location.origin;
            const paymentRes = await paymentService.createPayOSPayment({
                subscription_id: subscriptionId,
                amount: totalPackageAmount,
                description: `Goi dinh ky #${subscriptionId}`,
                return_url: `${origin}/payment/result?type=subscription&subscription_id=${subscriptionId}`,
                cancel_url: `${origin}/subscriptions?payment=cancelled`,
            });

            const payosUrl = getPayOSCheckoutUrl(paymentRes);
            if (!payosUrl) {
                throw new Error('Không nhận được đường dẫn thanh toán PayOS.');
            }

            window.location.href = payosUrl;
        } catch (err) {
            setFormError(
                err instanceof ApiError
                    ? err.message
                    : err instanceof Error
                        ? err.message
                        : 'Không thể khởi tạo thanh toán PayOS. Vui lòng thử lại.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTogglePause = async (subId: number) => {
        setActionLoadingId(subId);
        try {
            await subscriptionService.pauseSubscription(subId);
            await loadMySubscriptions();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái gói.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleCancelSubscription = async (subId: number) => {
        if (!window.confirm('Bạn chắc chắn muốn hủy gói nông sản định kỳ này?')) return;
        setActionLoadingId(subId);
        try {
            await subscriptionService.cancelSubscription(subId);
            await loadMySubscriptions();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Không thể hủy gói.');
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <div className="min-h-[85vh] bg-[#F3F8F3] pb-16 text-gray-900">
            <SubscriptionHeroHeader
                activeTab={activeTab}
                mySubscriptionCount={subscriptions.length}
                onSelectBuilder={() => setActiveTab('builder')}
                onSelectMyList={() => {
                    if (!isAuthenticated) {
                        navigate('/login', { state: { from: '/subscriptions' } });
                        return;
                    }
                    setActiveTab('my-list');
                }}
            />

            <div className="mx-auto max-w-6xl px-4 pt-6 sm:pt-8">
                {successBanner && (
                    <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-[#DDF2E2] px-4 py-3.5 text-xs sm:text-sm font-bold text-[#1B4332]">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <span>{successBanner}</span>
                    </div>
                )}

                {activeTab === 'builder' ? (
                    <form
                        onSubmit={handleCreateSubscription}
                        className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start"
                    >
                        <div className="lg:col-span-7 space-y-6">
                            <SubscriptionProductSelector
                                products={eligibleProducts}
                                isLoading={isLoadingProducts}
                                selectedQuantities={selectedQuantities}
                                onUpdateQuantity={updateItemQty}
                            />

                            <SubscriptionScheduleForm
                                selectedWeekdays={selectedWeekdays}
                                startDate={startDate}
                                minStartDate={getTomorrowISO()}
                                deliverySlot={deliverySlot}
                                shippingAddress={shippingAddress}
                                onToggleWeekday={toggleWeekday}
                                onChangeStartDate={setStartDate}
                                onChangeDeliverySlot={setDeliverySlot}
                                onChangeShippingAddress={setShippingAddress}
                            />
                        </div>

                        <div className="lg:col-span-5 lg:sticky lg:top-24">
                            <SubscriptionSummaryCard
                                selectedItems={selectedItemsSummary}
                                previewDates={previewDates}
                                subtotalPerDelivery={subtotalPerDelivery}
                                shippingPerDelivery={shippingPerDelivery}
                                totalPackageAmount={totalPackageAmount}
                                isAuthenticated={isAuthenticated}
                                isSubmitting={isSubmitting}
                                formError={formError}
                            />
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-extrabold text-gray-900">
                                    Gói nông sản định kỳ của {user?.full_name || 'bạn'}
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-500">
                                    Quản lý trạng thái hoạt động, tạm dừng hoặc xem chi tiết từng kỳ giao.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setActiveTab('builder')}
                                className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#1E462D] px-4 text-xs sm:text-sm font-bold text-white hover:bg-[#163622] transition"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Đăng ký thêm gói mới</span>
                            </button>
                        </div>

                        {isLoadingSubs ? (
                            <div className="space-y-3 animate-pulse">
                                {[1, 2].map((i) => (
                                    <div key={i} className="h-40 rounded-3xl bg-white" />
                                ))}
                            </div>
                        ) : subscriptions.length === 0 ? (
                            <div className="rounded-3xl border border-emerald-900/10 bg-white p-10 text-center space-y-3">
                                <PackageCheck className="mx-auto h-12 w-12 text-[#1B4332]/50" />
                                <h3 className="text-lg font-extrabold text-gray-900">
                                    Bạn chưa đăng ký gói rau định kỳ nào
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                                    Đăng ký gói giao cố định hàng tuần để luôn có nông sản thu hoạch sáng
                                    sớm với mức giá chốt ổn định suốt 30 ngày.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('builder')}
                                    className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1E462D] px-5 text-xs sm:text-sm font-bold text-white hover:bg-[#163622] transition"
                                >
                                    Tạo gói định kỳ đầu tiên
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {subscriptions.map((sub) => (
                                    <SubscriptionCard
                                        key={sub.id}
                                        subscription={sub}
                                        isActionLoading={actionLoadingId === sub.id}
                                        onTogglePause={handleTogglePause}
                                        onCancel={handleCancelSubscription}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default SubscriptionListPage;