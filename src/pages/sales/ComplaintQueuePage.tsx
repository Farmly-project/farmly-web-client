import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    MessageSquareWarning,
    Search,
    RefreshCw,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Eye,
    RotateCcw,
    PackagePlus,
    HelpCircle,
    Image as ImageIcon,
    Film,
    Clock,
} from 'lucide-react';
import {
    complaintService,
    type ComplaintResolutionAction,
} from '../../services/complaintService';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ComplaintMediaItem {
    id: number;
    media_url: string;
    media_type: 'image' | 'video' | string;
}

interface ComplaintQueueItem {
    id: number;
    complaint_code: string;
    order_id: number;
    order_code: string;
    customer_name: string;
    customer_phone: string;
    product_name: string;
    unit: string;
    defect_quantity: number;
    item_total_amount: number;
    batch_code?: string;
    reason: string;
    description: string;
    requested_resolution: 'REFUND' | 'REPLACEMENT' | string;
    status: 'PENDING' | 'NEED_MORE_INFO' | 'REFUNDED' | 'REPLACEMENT' | 'REJECTED' | string;
    admin_note?: string | null;
    created_at: string;
    delivered_at?: string | null;
    media: ComplaintMediaItem[];
}

const REASON_LABELS: Record<string, string> = {
    CRUSHED: 'Dập nát khi vận chuyển',
    SPOILED: 'Hư hỏng / Úng thối',
    WRONG_ITEM: 'Giao sai sản phẩm',
    MISSING_ITEM: 'Giao thiếu số lượng',
};

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
    PENDING: {
        label: 'Chờ xử lý',
        className: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    NEED_MORE_INFO: {
        label: 'Chờ bổ sung',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    REFUNDED: {
        label: 'Đã hoàn tiền PayOS',
        className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    REPLACEMENT: {
        label: 'Đã tạo đơn giao bù',
        className: 'bg-teal-100 text-teal-800 border-teal-200',
    },
    REJECTED: {
        label: 'Đã từ chối',
        className: 'bg-red-100 text-red-700 border-red-200',
    },
};

export function ComplaintQueuePage() {
    const [complaints, setComplaints] = useState<ComplaintQueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [searchKeyword, setSearchKeyword] = useState('');

    // Modal chi tiết & duyệt khiếu nại
    const [selectedComplaint, setSelectedComplaint] =
        useState<ComplaintQueueItem | null>(null);
    const [selectedAction, setSelectedAction] =
        useState<ComplaintResolutionAction>('REFUND');
    const [refundAmount, setRefundAmount] = useState<string>('');
    const [adminNote, setAdminNote] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadComplaints = useCallback(async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const res = await complaintService.getComplaints({ limit: 100 });
            const raw = res as {
                data?:
                | Record<string, unknown>[]
                | { items?: Record<string, unknown>[]; complaints?: Record<string, unknown>[] };
                items?: Record<string, unknown>[];
                complaints?: Record<string, unknown>[];
            };

            const list = Array.isArray(raw?.data)
                ? raw.data
                : raw?.data?.items ??
                raw?.data?.complaints ??
                raw?.items ??
                raw?.complaints ??
                (Array.isArray(res) ? (res as Record<string, unknown>[]) : []);

            const normalized: ComplaintQueueItem[] = list.map((row) => {
                const orderObj = (row.order as Record<string, unknown> | undefined) ?? {};
                const itemObj = (row.order_item as Record<string, unknown> | undefined) ?? {};
                const productObj =
                    (itemObj.product as Record<string, unknown> | undefined) ??
                    (row.product as Record<string, unknown> | undefined) ??
                    {};
                const userObj =
                    (row.customer as Record<string, unknown> | undefined) ??
                    (row.profile as Record<string, unknown> | undefined) ??
                    {};

                const rawMedia = Array.isArray(row.media)
                    ? row.media
                    : Array.isArray(row.complaint_media)
                        ? row.complaint_media
                        : [];

                const media: ComplaintMediaItem[] = rawMedia.map(
                    (m: Record<string, unknown>, idx: number) => {
                        const url = String(m.media_url ?? m.url ?? '');
                        const isVideo =
                            String(m.media_type ?? '').toLowerCase().includes('video') ||
                            /\.(mp4|mov|webm)(\?|$)/i.test(url);
                        return {
                            id: Number(m.id ?? idx + 1),
                            media_url: url,
                            media_type: isVideo ? 'video' : 'image',
                        };
                    }
                );

                const defectQty = Number(row.defect_quantity ?? row.quantity ?? 1);
                const unitPrice = Number(itemObj.unit_price ?? productObj.base_price ?? 0);
                const itemTotal = Number(
                    row.item_total_amount ??
                    row.refund_amount ??
                    (unitPrice > 0 ? unitPrice * defectQty : 0)
                );

                return {
                    id: Number(row.id),
                    complaint_code: String(row.complaint_code ?? `KN-${row.id}`),
                    order_id: Number(row.order_id ?? orderObj.id ?? 0),
                    order_code: String(
                        row.order_code ?? orderObj.order_code ?? `ORD-${row.order_id ?? row.id}`
                    ),
                    customer_name: String(
                        row.customer_name ?? userObj.full_name ?? 'Khách hàng Farmly'
                    ),
                    customer_phone: String(
                        row.customer_phone ?? userObj.phone ?? orderObj.recipient_phone ?? ''
                    ),
                    product_name: String(
                        row.product_name ?? productObj.name ?? 'Nông sản Farmly'
                    ),
                    unit: String(row.unit ?? productObj.unit ?? 'túi'),
                    defect_quantity: defectQty,
                    item_total_amount: itemTotal,
                    batch_code: (row.batch_code as string | undefined) ?? undefined,
                    reason: String(row.reason ?? 'CRUSHED'),
                    description: String(row.description ?? ''),
                    requested_resolution: String(
                        row.requested_resolution ?? 'REFUND'
                    ).toUpperCase(),
                    status: String(row.status ?? 'PENDING').toUpperCase(),
                    admin_note: (row.admin_note as string | null) ?? null,
                    created_at: String(row.created_at ?? new Date().toISOString()),
                    delivered_at: (row.delivered_at as string | null) ?? null,
                    media,
                };
            });

            setComplaints(normalized);
        } catch (err) {
            setErrorMsg(
                err instanceof Error ? err.message : 'Không thể tải danh sách khiếu nại.'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadComplaints();
    }, [loadComplaints]);

    const stats = useMemo(() => {
        const pending = complaints.filter((c) => c.status === 'PENDING').length;
        const needMore = complaints.filter((c) => c.status === 'NEED_MORE_INFO').length;
        const resolved = complaints.filter((c) =>
            ['REFUNDED', 'REPLACEMENT', 'REJECTED'].includes(c.status)
        ).length;
        return { total: complaints.length, pending, needMore, resolved };
    }, [complaints]);

    const filteredComplaints = useMemo(() => {
        return complaints.filter((item) => {
            if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
            if (searchKeyword.trim()) {
                const kw = searchKeyword.trim().toLowerCase();
                const matchCode = item.complaint_code.toLowerCase().includes(kw);
                const matchOrder = item.order_code.toLowerCase().includes(kw);
                const matchName = item.customer_name.toLowerCase().includes(kw);
                const matchProd = item.product_name.toLowerCase().includes(kw);
                if (!matchCode && !matchOrder && !matchName && !matchProd) return false;
            }
            return true;
        });
    }, [complaints, statusFilter, searchKeyword]);

    const openReviewModal = (item: ComplaintQueueItem) => {
        setSelectedComplaint(item);
        const defaultAction: ComplaintResolutionAction =
            item.requested_resolution === 'REPLACEMENT' ? 'REPLACEMENT' : 'REFUND';
        setSelectedAction(defaultAction);
        setRefundAmount(String(item.item_total_amount || ''));
        setAdminNote(item.admin_note ?? '');
        setErrorMsg(null);
    };

    const handleResolveSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedComplaint) return;

        // Quy tắc nghiệp vụ UC03:
        // - BR2: Số tiền hoàn không vượt quá giá trị dòng hàng bị lỗi
        // - A1 / A2: Từ chối hoặc yêu cầu bổ sung bắt buộc nhập lý do/ghi chú
        if (selectedAction === 'REFUND') {
            const amount = Number(refundAmount);
            if (!amount || amount <= 0) {
                setErrorMsg('Vui lòng nhập số tiền hoàn hợp lệ (> 0đ).');
                return;
            }
            if (
                selectedComplaint.item_total_amount > 0 &&
                amount > selectedComplaint.item_total_amount
            ) {
                setErrorMsg(
                    `Số tiền hoàn không được vượt quá giá trị dòng hàng lỗi (${formatCurrency(
                        selectedComplaint.item_total_amount
                    )}).`
                );
                return;
            }
        }

        if (
            (selectedAction === 'REJECT' || selectedAction === 'NEED_MORE_INFO') &&
            !adminNote.trim()
        ) {
            setErrorMsg(
                selectedAction === 'REJECT'
                    ? 'Bắt buộc nhập lý do từ chối khiếu nại.'
                    : 'Vui lòng nhập thông tin cần khách hàng bổ sung.'
            );
            return;
        }

        setIsSubmitting(true);
        setErrorMsg(null);
        try {
            await complaintService.resolveComplaint(selectedComplaint.id, {
                action: selectedAction,
                refund_amount:
                    selectedAction === 'REFUND' ? Number(refundAmount) : undefined,
                admin_note: adminNote.trim() || undefined,
            });

            const actionLabelMap: Record<ComplaintResolutionAction, string> = {
                REFUND: 'đã gửi yêu cầu hoàn tiền qua PayOS',
                REPLACEMENT: 'đã tạo đơn giao bù 0đ & trừ kho FEFO',
                REJECT: 'đã từ chối khiếu nại',
                NEED_MORE_INFO: 'đã yêu cầu khách hàng bổ sung minh chứng',
            };

            setSuccessMsg(
                `Khiếu nại ${selectedComplaint.complaint_code}: ${actionLabelMap[selectedAction]}.`
            );
            setSelectedComplaint(null);
            await loadComplaints();
        } catch (err) {
            setErrorMsg(
                err instanceof Error ? err.message : 'Xử lý khiếu nại thất bại.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 mb-1.5">
                        <MessageSquareWarning className="h-3.5 w-3.5" />
                        Hậu mãi & Đổi trả trong 24 giờ
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-900">
                        Xử lý Khiếu nại & Đổi trả (UC03)
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Xác minh ảnh/video minh chứng trong 24h sau giao hàng và duyệt Hoàn tiền PayOS hoặc Giao bù FEFO.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadComplaints}
                    disabled={loading}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* Thông báo */}
            {successMsg && (
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{successMsg}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSuccessMsg(null)}
                        className="text-xs font-bold underline"
                    >
                        Đóng
                    </button>
                </div>
            )}

            {errorMsg && !selectedComplaint && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Thẻ thống kê */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
                    <div className="text-xs font-semibold text-gray-500">Tổng khiếu nại</div>
                    <div className="mt-1 text-2xl font-extrabold text-gray-900">{stats.total}</div>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-2xs">
                    <div className="text-xs font-semibold text-amber-800">Chờ Sales xử lý</div>
                    <div className="mt-1 text-2xl font-extrabold text-amber-700">{stats.pending}</div>
                </div>
                <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 shadow-2xs">
                    <div className="text-xs font-semibold text-blue-800">Chờ khách bổ sung</div>
                    <div className="mt-1 text-2xl font-extrabold text-blue-700">{stats.needMore}</div>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-2xs">
                    <div className="text-xs font-semibold text-emerald-800">Đã giải quyết</div>
                    <div className="mt-1 text-2xl font-extrabold text-emerald-700">{stats.resolved}</div>
                </div>
            </div>

            {/* Bộ lọc & Tìm kiếm */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: 'ALL', label: `Tất cả (${stats.total})` },
                        { key: 'PENDING', label: `Chờ xử lý (${stats.pending})` },
                        { key: 'NEED_MORE_INFO', label: `Chờ bổ sung (${stats.needMore})` },
                        { key: 'REFUNDED', label: 'Đã hoàn tiền' },
                        { key: 'REPLACEMENT', label: 'Đã giao bù' },
                        { key: 'REJECTED', label: 'Đã từ chối' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setStatusFilter(tab.key)}
                            className={`h-10 rounded-xl px-3.5 text-xs font-bold transition ${statusFilter === tab.key
                                    ? 'bg-[#1E462D] text-white shadow-2xs'
                                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        placeholder="Tìm mã KN, mã đơn, tên khách..."
                        className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm focus:border-[#1E462D] focus:outline-none"
                    />
                </div>
            </div>

            {/* Bảng danh sách khiếu nại */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-gray-200 bg-gray-50/80 text-xs font-bold uppercase text-gray-600">
                            <tr>
                                <th className="px-4 py-3.5">Mã KN / Đơn hàng</th>
                                <th className="px-4 py-3.5">Khách hàng</th>
                                <th className="px-4 py-3.5">Sản phẩm lỗi & Lý do</th>
                                <th className="px-4 py-3.5">Minh chứng</th>
                                <th className="px-4 py-3.5">Mong muốn</th>
                                <th className="px-4 py-3.5">Trạng thái</th>
                                <th className="px-4 py-3.5 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                                        Đang tải danh sách khiếu nại...
                                    </td>
                                </tr>
                            ) : filteredComplaints.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                                        Không có yêu cầu khiếu nại nào phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                filteredComplaints.map((item) => {
                                    const badge = STATUS_BADGES[item.status] ?? {
                                        label: item.status,
                                        className: 'bg-gray-100 text-gray-700 border-gray-200',
                                    };
                                    const isActionable =
                                        item.status === 'PENDING' || item.status === 'NEED_MORE_INFO';

                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50/70">
                                            <td className="px-4 py-3.5">
                                                <div className="font-mono text-xs font-bold text-[#1E462D]">
                                                    {item.complaint_code}
                                                </div>
                                                <div className="text-xs font-semibold text-gray-700 mt-0.5">
                                                    Đơn: {item.order_code}
                                                </div>
                                                <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDate(item.created_at)}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <div className="font-bold text-gray-900">
                                                    {item.customer_name}
                                                </div>
                                                {item.customer_phone && (
                                                    <div className="text-xs text-gray-500">
                                                        {item.customer_phone}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <div className="font-bold text-gray-900">
                                                    {item.product_name}{' '}
                                                    <span className="text-xs font-semibold text-red-600">
                                                        (×{item.defect_quantity} {item.unit})
                                                    </span>
                                                </div>
                                                <div className="text-xs text-amber-800 font-medium mt-0.5">
                                                    {REASON_LABELS[item.reason] ?? item.reason}
                                                </div>
                                                {item.batch_code && (
                                                    <div className="font-mono text-[11px] text-gray-400 mt-0.5">
                                                        Lô xuất: {item.batch_code}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5">
                                                {item.media.length > 0 ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                                        <ImageIcon className="h-3.5 w-3.5 text-[#1E462D]" />
                                                        {item.media.length} tệp đính kèm
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Không có tệp</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${item.requested_resolution === 'REPLACEMENT'
                                                            ? 'bg-teal-50 text-teal-800'
                                                            : 'bg-emerald-50 text-emerald-800'
                                                        }`}
                                                >
                                                    {item.requested_resolution === 'REPLACEMENT'
                                                        ? 'Giao bù hàng mới'
                                                        : 'Hoàn tiền'}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${badge.className}`}
                                                >
                                                    {badge.label}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3.5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => openReviewModal(item)}
                                                    className={`inline-flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold transition ${isActionable
                                                            ? 'bg-[#1E462D] text-white hover:bg-[#163622]'
                                                            : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    {isActionable ? 'Xem & Xử lý' : 'Xem chi tiết'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Xác minh minh chứng & Duyệt xử lý khiếu nại */}
            {selectedComplaint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl space-y-5 my-8">
                        <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-[#1E462D]">
                                        {selectedComplaint.complaint_code}
                                    </span>
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-xs font-semibold text-gray-600">
                                        Đơn {selectedComplaint.order_code}
                                    </span>
                                </div>
                                <h3 className="text-lg font-extrabold text-gray-900 mt-0.5">
                                    Chi tiết khiếu nại – {selectedComplaint.customer_name}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedComplaint(null)}
                                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Thông tin dòng hàng lỗi */}
                        <div className="grid grid-cols-1 gap-3 rounded-xl bg-[#F3F8F3] p-4 text-xs sm:grid-cols-2">
                            <div>
                                <span className="text-gray-500">Sản phẩm khiếu nại:</span>
                                <div className="font-bold text-gray-900 mt-0.5">
                                    {selectedComplaint.product_name} (SL lỗi:{' '}
                                    {selectedComplaint.defect_quantity} {selectedComplaint.unit})
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-500">Giá trị dòng hàng lỗi (tối đa hoàn):</span>
                                <div className="font-bold text-[#1E462D] mt-0.5">
                                    {formatCurrency(selectedComplaint.item_total_amount)}
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-500">Lý do khách chọn:</span>
                                <div className="font-bold text-amber-800 mt-0.5">
                                    {REASON_LABELS[selectedComplaint.reason] ?? selectedComplaint.reason}
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-500">Hướng xử lý khách mong muốn:</span>
                                <div className="font-bold text-gray-900 mt-0.5">
                                    {selectedComplaint.requested_resolution === 'REPLACEMENT'
                                        ? 'Giao bù sản phẩm mới (0đ)'
                                        : 'Hoàn tiền qua PayOS'}
                                </div>
                            </div>
                            {selectedComplaint.description && (
                                <div className="sm:col-span-2">
                                    <span className="text-gray-500">Mô tả chi tiết của khách:</span>
                                    <p className="mt-1 rounded-lg bg-white p-2.5 text-gray-800 border border-emerald-900/10">
                                        "{selectedComplaint.description}"
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Bộ ảnh / video minh chứng */}
                        <div>
                            <div className="text-xs font-bold text-gray-700 mb-2">
                                Ảnh / Video minh chứng đính kèm ({selectedComplaint.media.length}):
                            </div>
                            {selectedComplaint.media.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center text-xs text-gray-500">
                                    Không có ảnh hoặc video minh chứng.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {selectedComplaint.media.map((m) => (
                                        <div
                                            key={m.id}
                                            className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
                                        >
                                            {m.media_type === 'video' ? (
                                                <div className="relative">
                                                    <video
                                                        src={m.media_url}
                                                        controls
                                                        className="aspect-video w-full object-cover bg-black"
                                                    />
                                                    <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                                        <Film className="h-3 w-3" /> Video
                                                    </span>
                                                </div>
                                            ) : (
                                                <a
                                                    href={m.media_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="block aspect-video overflow-hidden"
                                                >
                                                    <img
                                                        src={m.media_url}
                                                        alt="Minh chứng khiếu nại"
                                                        className="h-full w-full object-cover hover:scale-105 transition"
                                                    />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {errorMsg && (
                            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {/* Form quyết định xử lý (chỉ hiện khi chưa chốt kết quả) */}
                        {selectedComplaint.status === 'PENDING' ||
                            selectedComplaint.status === 'NEED_MORE_INFO' ? (
                            <form onSubmit={handleResolveSubmit} className="space-y-4 border-t border-gray-100 pt-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-2">
                                        Chọn phương án xử lý của Sales:
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        {[
                                            {
                                                key: 'REFUND',
                                                label: 'Hoàn tiền PayOS',
                                                icon: RotateCcw,
                                            },
                                            {
                                                key: 'REPLACEMENT',
                                                label: 'Giao bù (FEFO)',
                                                icon: PackagePlus,
                                            },
                                            {
                                                key: 'NEED_MORE_INFO',
                                                label: 'Yêu cầu bổ sung',
                                                icon: HelpCircle,
                                            },
                                            {
                                                key: 'REJECT',
                                                label: 'Từ chối',
                                                icon: XCircle,
                                            },
                                        ].map((opt) => {
                                            const Icon = opt.icon;
                                            const active = selectedAction === opt.key;
                                            return (
                                                <button
                                                    key={opt.key}
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedAction(opt.key as ComplaintResolutionAction)
                                                    }
                                                    className={`flex h-11 items-center justify-center gap-1.5 rounded-xl border px-2.5 text-xs font-bold transition ${active
                                                            ? 'border-[#1E462D] bg-[#1E462D] text-white'
                                                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <Icon className="h-3.5 w-3.5 shrink-0" />
                                                    <span>{opt.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {selectedAction === 'REFUND' && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            Số tiền hoàn lại cho khách (VNĐ) *
                                        </label>
                                        <input
                                            type="number"
                                            min={1000}
                                            max={selectedComplaint.item_total_amount || undefined}
                                            step={500}
                                            required
                                            value={refundAmount}
                                            onChange={(e) => setRefundAmount(e.target.value)}
                                            className="h-11 w-full rounded-xl border border-gray-300 px-3.5 text-sm font-bold text-[#1E462D] focus:border-[#1E462D] focus:outline-none"
                                        />
                                    </div>
                                )}

                                {selectedAction === 'REPLACEMENT' && (
                                    <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3 text-xs text-teal-900">
                                        Hệ thống sẽ tự động tạo <strong>đơn giao bù 0đ</strong> cho{' '}
                                        <strong>
                                            {selectedComplaint.defect_quantity} {selectedComplaint.unit}{' '}
                                            {selectedComplaint.product_name}
                                        </strong>{' '}
                                        và trừ kho tự động từ lô có hạn sử dụng gần nhất (<strong>FEFO</strong>).
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        {selectedAction === 'REJECT'
                                            ? 'Lý do từ chối khiếu nại *'
                                            : selectedAction === 'NEED_MORE_INFO'
                                                ? 'Nội dung yêu cầu khách bổ sung minh chứng *'
                                                : 'Ghi chú phản hồi gửi khách hàng (tùy chọn)'}
                                    </label>
                                    <textarea
                                        rows={2}
                                        required={
                                            selectedAction === 'REJECT' ||
                                            selectedAction === 'NEED_MORE_INFO'
                                        }
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        placeholder={
                                            selectedAction === 'REJECT'
                                                ? 'Ví dụ: Hình ảnh chưa thể hiện rõ tình trạng hư hỏng của sản phẩm...'
                                                : 'Nhập lời nhắn gửi khách hàng...'
                                        }
                                        className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-[#1E462D] focus:outline-none"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedComplaint(null)}
                                        className="h-11 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                    >
                                        Đóng
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#1E462D] px-5 text-sm font-bold text-white hover:bg-[#163622] disabled:opacity-50"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        {isSubmitting ? 'Đang xử lý...' : 'Xác nhận quyết định'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-3 border-t border-gray-100 pt-4 text-xs">
                                {selectedComplaint.admin_note && (
                                    <div className="rounded-xl bg-gray-50 p-3 text-gray-700">
                                        <strong>Phản hồi của Sales:</strong> {selectedComplaint.admin_note}
                                    </div>
                                )}
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedComplaint(null)}
                                        className="h-11 rounded-xl bg-gray-900 px-5 text-sm font-bold text-white"
                                    >
                                        Đóng
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ComplaintQueuePage;