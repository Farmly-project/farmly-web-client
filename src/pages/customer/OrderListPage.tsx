import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, ShoppingBag } from 'lucide-react';
import { customerOrderApi } from '../../services/orderService';
import { formatVND, formatDate } from '../../utils/formatters';
import type { OrderDetailData, OrderStatus } from '../../types/order.types';
import { resolveOrderPayment } from '../../utils/orderHelpers';

const FILTER_TABS: { key: string; label: string }[] = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ xác nhận' },
    { key: 'confirmed', label: 'Đã duyệt' },
    { key: 'shipping', label: 'Đang giao' },
    { key: 'delivered', label: 'Đã giao' },
    { key: 'cancelled', label: 'Đã hủy' },
];

const STATUS_BADGE: Record<OrderStatus, { label: string; cls: string }> = {
    pending: { label: 'Chờ xác nhận', cls: 'bg-amber-100 text-amber-800' },
    confirmed: { label: 'Đã xác nhận', cls: 'bg-emerald-100 text-[#1B4332]' },
    preparing: { label: 'Đang đóng gói', cls: 'bg-sky-100 text-sky-800' },
    shipping: { label: 'Đang giao hàng', cls: 'bg-indigo-100 text-indigo-800' },
    delivered: { label: 'Đã giao', cls: 'bg-[#DDF2E2] text-[#1B4332]' },
    cancelled: { label: 'Đã hủy', cls: 'bg-red-100 text-red-700' },
};

export function OrderListPage() {
    const [activeTab, setActiveTab] = useState<string>('ALL');
    const [orders, setOrders] = useState<OrderDetailData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);

        customerOrderApi
            .getMyOrders(activeTab)
            .then((res) => {
                if (!isMounted) return;
                const root = (res as { data?: unknown })?.data ?? res;
                const list = Array.isArray(root)
                    ? root
                    : Array.isArray((root as { items?: unknown[] })?.items)
                        ? (root as { items: unknown[] }).items
                        : Array.isArray((root as { orders?: unknown[] })?.orders)
                            ? (root as { orders: unknown[] }).orders
                            : [];
                setOrders(list as OrderDetailData[]);
            })
            .catch(() => {
                if (isMounted) setOrders([]);
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [activeTab]);

    return (
        <div className="min-h-screen bg-[#F3F8F3] pb-16 pt-6 text-gray-900">
            <div className="mx-auto max-w-4xl px-4 space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900">
                            Đơn hàng của tôi
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                            Theo dõi trạng thái xử lý, giao hàng và truy xuất lô nông sản
                        </p>
                    </div>
                    <Link
                        to="/products"
                        className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#1E462D] px-4 text-xs sm:text-sm font-bold text-white"
                    >
                        <ShoppingBag className="h-4 w-4" />
                        <span>Mua thêm</span>
                    </Link>
                </div>

                {/* Thanh lọc trạng thái */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {FILTER_TABS.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`min-h-11 shrink-0 rounded-full px-4 text-xs sm:text-sm font-bold transition ${activeTab === tab.key
                                ? 'bg-[#1E462D] text-white'
                                : 'bg-white text-gray-700 border border-emerald-900/10 hover:bg-gray-50'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Danh sách đơn */}
                {isLoading ? (
                    <div className="space-y-3 animate-pulse">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-28 rounded-3xl bg-white" />
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="rounded-3xl border border-emerald-900/10 bg-white p-10 text-center space-y-3">
                        <Package className="h-10 w-10 text-gray-400 mx-auto" />
                        <p className="text-sm font-bold text-gray-700">
                            Chưa có đơn hàng nào ở trạng thái này.
                        </p>
                        <Link
                            to="/products"
                            className="inline-flex h-11 items-center rounded-xl bg-[#1E462D] px-5 text-xs font-bold text-white"
                        >
                            Khám phá nông sản hôm nay
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map((ord) => {
                            const badge = STATUS_BADGE[ord.status] ?? STATUS_BADGE.pending;
                            resolveOrderPayment(ord);
                            return (
                                <Link
                                    key={ord.id}
                                    to={`/orders/${ord.id}`}
                                    className="flex items-center justify-between gap-4 rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-2xs hover:border-[#1E462D]/40 transition"
                                >
                                    <div className="space-y-1.5 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm sm:text-base font-extrabold text-gray-900">
                                                Đơn #{ord.order_code || ord.id}
                                            </span>
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${badge.cls}`}
                                            >
                                                {badge.label}
                                            </span>
                                            <span className="text-xs font-semibold text-gray-500">
                                                • {ord.payment_method === 'payos' ? 'PayOS' : 'COD'} (
                                                {ord.payment_status === 'paid'
                                                    ? 'Đã thanh toán'
                                                    : 'Chưa thanh toán'}
                                                )
                                            </span>
                                        </div>

                                        <p className="text-xs text-gray-500">
                                            Ngày đặt: {formatDate(ord.created_at)}
                                            {ord.items?.length
                                                ? ` • ${ord.items.length} sản phẩm`
                                                : ''}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400">Tổng tiền</p>
                                            <p className="text-base font-extrabold text-[#1B4332]">
                                                {formatVND(ord.total_amount)}
                                            </p>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-gray-400" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default OrderListPage;