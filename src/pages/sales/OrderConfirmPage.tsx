// import { useEffect, useState, useCallback } from 'react';
// import {
//     CheckCircle2,
//     RefreshCw,
//     PackageCheck,
//     Truck,
//     XCircle,
//     Search,
// } from 'lucide-react';
// import { orderService } from '../../services/orderService';
// import { ApiError } from '../../services/apiClient';
// import { formatCurrency, formatDate } from '../../utils/formatters';

// interface SalesOrderItem {
//     id: number;
//     product_name?: string;
//     quantity: number;
//     unit_price?: number;
// }

// interface SalesOrderRow {
//     id: number;
//     order_code?: string;
//     customer_name?: string;
//     customer_phone?: string;
//     shipping_address?: string;
//     status: string;
//     payment_method?: string;
//     payment_status?: string;
//     total_amount: number;
//     shipping_fee?: number;
//     created_at?: string;
//     items?: SalesOrderItem[];
// }

// const STATUS_TABS = [
//     { key: 'pending', label: 'Chờ xác nhận' },
//     { key: 'confirmed', label: 'Đã duyệt (FEFO)' },
//     { key: 'preparing', label: 'Đang đóng gói' },
//     { key: 'shipping', label: 'Đang giao' },
//     { key: 'delivered', label: 'Đã giao' },
//     { key: 'all', label: 'Tất cả' },
// ];

// const STATUS_BADGE_MAP: Record<string, { text: string; className: string }> = {
//     pending: {
//         text: 'Chờ xác nhận',
//         className: 'bg-amber-100 text-amber-800 border-amber-200',
//     },
//     confirmed: {
//         text: 'Đã duyệt (Đã trừ FEFO)',
//         className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
//     },
//     preparing: {
//         text: 'Đang đóng gói',
//         className: 'bg-sky-100 text-sky-800 border-sky-200',
//     },
//     shipping: {
//         text: 'Đang giao hàng',
//         className: 'bg-indigo-100 text-indigo-800 border-indigo-200',
//     },
//     delivered: {
//         text: 'Đã giao thành công',
//         className: 'bg-green-100 text-green-900 border-green-200',
//     },
//     cancelled: {
//         text: 'Đã hủy',
//         className: 'bg-red-100 text-red-800 border-red-200',
//     },
// };

// export function OrderConfirmPage() {
//     const [activeStatus, setActiveStatus] = useState<string>('pending');
//     const [orders, setOrders] = useState<SalesOrderRow[]>([]);
//     const [searchQuery, setSearchQuery] = useState('');
//     const [loading, setLoading] = useState(false);
//     const [processingId, setProcessingId] = useState<number | null>(null);
//     const [errorMsg, setErrorMsg] = useState<string | null>(null);
//     const [successMsg, setSuccessMsg] = useState<string | null>(null);

//     const loadOrders = useCallback(async () => {
//         setLoading(true);
//         setErrorMsg(null);
//         try {
//             const params = activeStatus === 'all' ? undefined : { status: activeStatus };
//             const res = await orderService.getOrders(params);
//             const raw = res as unknown as {
//                 data?: SalesOrderRow[] | { items?: SalesOrderRow[]; orders?: SalesOrderRow[] };
//                 items?: SalesOrderRow[];
//                 orders?: SalesOrderRow[];
//             };

//             const list = Array.isArray(raw?.data)
//                 ? raw.data
//                 : raw?.data?.items ??
//                 raw?.data?.orders ??
//                 raw?.items ??
//                 raw?.orders ??
//                 (Array.isArray(res) ? (res as unknown as SalesOrderRow[]) : []);

//             setOrders(list);
//         } catch (err) {
//             setErrorMsg(
//                 err instanceof ApiError
//                     ? err.message
//                     : 'Không thể tải danh sách đơn hàng.'
//             );
//         } finally {
//             setLoading(false);
//         }
//     }, [activeStatus]);

//     useEffect(() => {
//         loadOrders();
//     }, [loadOrders]);

//     const handleConfirmFefo = async (orderId: number) => {
//         setProcessingId(orderId);
//         setErrorMsg(null);
//         setSuccessMsg(null);
//         try {
//             await orderService.confirmOrder(orderId);
//             setSuccessMsg(
//                 `Đã duyệt đơn #${orderId} và tự động trừ tồn kho theo lô gần hết hạn (FEFO).`
//             );
//             await loadOrders();
//         } catch (err) {
//             setErrorMsg(
//                 err instanceof ApiError
//                     ? err.message
//                     : `Không thể duyệt đơn #${orderId} (kiểm tra tồn kho FEFO hoặc trạng thái đơn).`
//             );
//         } finally {
//             setProcessingId(null);
//         }
//     };

//     const handleUpdateStatus = async (
//         orderId: number,
//         nextStatus: 'preparing' | 'shipping' | 'delivered' | 'cancelled'
//     ) => {
//         setProcessingId(orderId);
//         setErrorMsg(null);
//         setSuccessMsg(null);
//         try {
//             await orderService.updateOrderStatus(orderId, { status: nextStatus });
//             setSuccessMsg(`Đã cập nhật trạng thái đơn #${orderId} sang "${nextStatus}".`);
//             await loadOrders();
//         } catch (err) {
//             setErrorMsg(
//                 err instanceof ApiError
//                     ? err.message
//                     : `Không thể cập nhật trạng thái đơn #${orderId}.`
//             );
//         } finally {
//             setProcessingId(null);
//         }
//     };

//     const filteredOrders = orders.filter((order) => {
//         if (!searchQuery.trim()) return true;
//         const q = searchQuery.toLowerCase();
//         return (
//             String(order.id).includes(q) ||
//             (order.order_code || '').toLowerCase().includes(q) ||
//             (order.customer_name || '').toLowerCase().includes(q) ||
//             (order.customer_phone || '').toLowerCase().includes(q)
//         );
//     });

//     return (
//         <div className="space-y-6">
//             {/* Header */}
//             <div className="flex flex-wrap items-center justify-between gap-3">
//                 <div>
//                     <h1 className="text-2xl font-extrabold text-gray-900">
//                         Duyệt đơn hàng & Xuất kho FEFO
//                     </h1>
//                     <p className="mt-1 text-xs sm:text-sm text-gray-600">
//                         Kiểm tra đơn chờ xác nhận và kích hoạt phân bổ lô có hạn sử dụng gần nhất trước.
//                     </p>
//                 </div>

//                 <button
//                     type="button"
//                     onClick={loadOrders}
//                     disabled={loading}
//                     className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
//                 >
//                     <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
//                     <span>Làm mới</span>
//                 </button>
//             </div>

//             {/* Alerts */}
//             {successMsg && (
//                 <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-900">
//                     <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
//                     <span>{successMsg}</span>
//                 </div>
//             )}

//             {errorMsg && (
//                 <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs sm:text-sm font-semibold text-red-800">
//                     {errorMsg}
//                 </div>
//             )}

//             {/* Filter Tabs & Search */}
//             <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
//                 <div className="flex items-center gap-2 overflow-x-auto pb-1">
//                     {STATUS_TABS.map((tab) => {
//                         const active = activeStatus === tab.key;
//                         return (
//                             <button
//                                 key={tab.key}
//                                 type="button"
//                                 onClick={() => setActiveStatus(tab.key)}
//                                 className={`min-h-11 shrink-0 rounded-xl px-4 text-xs font-bold transition ${active
//                                     ? 'bg-[#1E462D] text-white'
//                                     : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                                     }`}
//                             >
//                                 {tab.label}
//                             </button>
//                         );
//                     })}
//                 </div>

//                 <div className="relative">
//                     <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
//                     <input
//                         type="text"
//                         value={searchQuery}
//                         onChange={(e) => setSearchQuery(e.target.value)}
//                         placeholder="Tìm theo mã đơn, tên khách hàng hoặc số điện thoại..."
//                         className="h-11 w-full rounded-xl border border-gray-200 pl-10 pr-4 text-sm focus:border-[#1E462D] focus:outline-none"
//                     />
//                 </div>
//             </div>

//             {/* Order Cards */}
//             {loading ? (
//                 <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
//                     Đang tải danh sách đơn hàng...
//                 </div>
//             ) : filteredOrders.length === 0 ? (
//                 <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
//                     Không có đơn hàng nào trong trạng thái này.
//                 </div>
//             ) : (
//                 <div className="space-y-4">
//                     {filteredOrders.map((order) => {
//                         const badge = STATUS_BADGE_MAP[order.status] ?? {
//                             text: order.status,
//                             className: 'bg-gray-100 text-gray-800 border-gray-200',
//                         };
//                         const isBusy = processingId === order.id;

//                         return (
//                             <div
//                                 key={order.id}
//                                 className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm space-y-4"
//                             >
//                                 <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3">
//                                     <div>
//                                         <div className="flex flex-wrap items-center gap-2">
//                                             <span className="text-base font-extrabold text-gray-900">
//                                                 Đơn hàng #{order.order_code || order.id}
//                                             </span>
//                                             <span
//                                                 className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badge.className}`}
//                                             >
//                                                 {badge.text}
//                                             </span>
//                                             {order.payment_method && (
//                                                 <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold text-gray-700">
//                                                     {order.payment_method.toUpperCase()}
//                                                 </span>
//                                             )}
//                                         </div>
//                                         <p className="mt-1 text-xs text-gray-500">
//                                             Khách hàng: <strong className="text-gray-800">{order.customer_name || 'Khách hàng'}</strong>
//                                             {order.customer_phone ? ` • ${order.customer_phone}` : ''}
//                                             {order.created_at ? ` • Tạo lúc ${formatDate(order.created_at)}` : ''}
//                                         </p>
//                                         {order.shipping_address && (
//                                             <p className="mt-0.5 text-xs text-gray-600">
//                                                 Địa chỉ giao: {order.shipping_address}
//                                             </p>
//                                         )}
//                                     </div>

//                                     <div className="text-left sm:text-right">
//                                         <div className="text-xs text-gray-500">Tổng thanh toán</div>
//                                         <div className="text-lg font-extrabold text-[#1E462D]">
//                                             {formatCurrency(order.total_amount || 0)}
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* Action Buttons */}
//                                 <div className="flex flex-wrap items-center justify-end gap-2.5">
//                                     {order.status === 'pending' && (
//                                         <>
//                                             <button
//                                                 type="button"
//                                                 disabled={isBusy}
//                                                 onClick={() => handleUpdateStatus(order.id, 'cancelled')}
//                                                 className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 transition"
//                                             >
//                                                 <XCircle className="h-4 w-4" />
//                                                 <span>Hủy đơn</span>
//                                             </button>
//                                             <button
//                                                 type="button"
//                                                 disabled={isBusy}
//                                                 onClick={() => handleConfirmFefo(order.id)}
//                                                 className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[#1E462D] px-4 text-xs font-bold text-white hover:bg-[#163622] disabled:opacity-50 transition"
//                                             >
//                                                 <CheckCircle2 className="h-4 w-4" />
//                                                 <span>{isBusy ? 'Đang trừ kho FEFO...' : 'Duyệt đơn'}</span>
//                                             </button>
//                                         </>
//                                     )}

//                                     {order.status === 'confirmed' && (
//                                         <button
//                                             type="button"
//                                             disabled={isBusy}
//                                             onClick={() => handleUpdateStatus(order.id, 'preparing')}
//                                             className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-sky-700 px-4 text-xs font-bold text-white hover:bg-sky-800 disabled:opacity-50 transition"
//                                         >
//                                             <PackageCheck className="h-4 w-4" />
//                                             <span>Chuyển sang Đóng gói</span>
//                                         </button>
//                                     )}

//                                     {order.status === 'preparing' && (
//                                         <button
//                                             type="button"
//                                             disabled={isBusy}
//                                             onClick={() => handleUpdateStatus(order.id, 'shipping')}
//                                             className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-indigo-700 px-4 text-xs font-bold text-white hover:bg-indigo-800 disabled:opacity-50 transition"
//                                         >
//                                             <Truck className="h-4 w-4" />
//                                             <span>Bắt đầu giao hàng</span>
//                                         </button>
//                                     )}

//                                     {order.status === 'shipping' && (
//                                         <button
//                                             type="button"
//                                             disabled={isBusy}
//                                             onClick={() => handleUpdateStatus(order.id, 'delivered')}
//                                             className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[#1E462D] px-4 text-xs font-bold text-white hover:bg-[#163622] disabled:opacity-50 transition"
//                                         >
//                                             <CheckCircle2 className="h-4 w-4" />
//                                             <span>Xác nhận Đã giao</span>
//                                         </button>
//                                     )}
//                                 </div>
//                             </div>
//                         );
//                     })}
//                 </div>
//             )}
//         </div>
//     );
// }

// export default OrderConfirmPage;

export function OrderConfirmPage() {
    return (
        <div className="rounded-2xl border border-emerald-900/10 bg-white p-6">
            <h1 className="text-xl font-extrabold text-gray-900">Quản lý đơn hàng</h1>
            <p className="mt-2 text-sm text-gray-600">Chức năng đang được cập nhật.</p>
        </div>
    );
}

export default OrderConfirmPage;
