import { Link } from 'react-router-dom';
import { Clock, PauseCircle, PlayCircle, XCircle } from 'lucide-react';
import { formatVND, formatDate } from '../../utils/formatters';
import { WEEKDAY_OPTIONS } from './SubscriptionScheduleForm';
import type {
    SubscriptionRecord,
    SubscriptionStatus,
} from '../../types/subscription.types';

const STATUS_META: Record<
    SubscriptionStatus,
    { label: string; badgeClass: string }
> = {
    active: {
        label: 'Đang hoạt động',
        badgeClass: 'bg-[#DDF2E2] text-[#1B4332]',
    },
    paused: {
        label: 'Đang tạm dừng',
        badgeClass: 'bg-amber-100 text-amber-800',
    },
    pending_payment: {
        label: 'Chờ thanh toán',
        badgeClass: 'bg-sky-100 text-sky-800',
    },
    cancelled: {
        label: 'Đã hủy gói',
        badgeClass: 'bg-red-100 text-red-700',
    },
    completed: {
        label: 'Đã hoàn tất chu kỳ',
        badgeClass: 'bg-gray-100 text-gray-700',
    },
};

interface SubscriptionCardProps {
    subscription: SubscriptionRecord;
    isActionLoading: boolean;
    onTogglePause: (id: number) => void;
    onCancel: (id: number) => void;
}

export function SubscriptionCard({
    subscription: sub,
    isActionLoading,
    onTogglePause,
    onCancel,
}: SubscriptionCardProps) {
    const statusInfo = STATUS_META[sub.status] ?? STATUS_META.active;
    const weekdayText = (sub.delivery_weekdays || [])
        .map((k) => WEEKDAY_OPTIONS.find((w) => w.key === k)?.label || k)
        .join(', ');

    return (
        <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                    <span className="text-base sm:text-lg font-extrabold text-gray-900">
                        Gói #{sub.subscription_code || sub.id}
                    </span>
                    <span
                        className={`rounded-full px-3 py-0.5 text-xs font-bold ${statusInfo.badgeClass}`}
                    >
                        {statusInfo.label}
                    </span>
                </div>

                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#1B4332]" />
                    <span>
                        Hiệu lực: {formatDate(sub.start_date)} – {formatDate(sub.end_date)}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-7 space-y-1.5 text-xs sm:text-sm">
                    <p className="text-gray-700">
                        <strong>Lịch giao cố định:</strong> {weekdayText}
                    </p>
                    {sub.shipping_address && (
                        <p className="text-gray-600">
                            <strong>Địa chỉ:</strong> {sub.shipping_address}
                        </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {(sub.items || []).map((it, i) => (
                            <span
                                key={i}
                                className="rounded-lg bg-[#F3F8F3] px-2.5 py-1 text-xs font-semibold text-[#1B4332]"
                            >
                                {it.product_name || `SP #${it.product_id}`} ×{' '}
                                {it.quantity_per_delivery} {it.unit || ''}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-5 flex flex-wrap items-center justify-between md:justify-end gap-2.5">
                    <div className="text-left md:text-right mr-2">
                        <div className="text-[11px] text-gray-500">
                            Tổng giá trị gói ({sub.total_deliveries} kỳ)
                        </div>
                        <div className="text-lg font-extrabold text-[#1B4332]">
                            {formatVND(sub.total_amount)}
                        </div>
                    </div>

                    <Link
                        to={`/subscriptions/${sub.id}`}
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-emerald-900/15 bg-[#F3F8F3] px-4 text-xs font-bold text-[#1B4332] hover:bg-[#DDF2E2] transition"
                    >
                        Lịch giao chi tiết
                    </Link>

                    {sub.status === 'active' && (
                        <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => onTogglePause(sub.id)}
                            className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition disabled:opacity-50"
                        >
                            <PauseCircle className="h-4 w-4" />
                            <span>Tạm dừng</span>
                        </button>
                    )}

                    {sub.status === 'paused' && (
                        <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => onTogglePause(sub.id)}
                            className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#1E462D] px-3.5 text-xs font-bold text-white hover:bg-[#163622] transition disabled:opacity-50"
                        >
                            <PlayCircle className="h-4 w-4" />
                            <span>Tiếp tục</span>
                        </button>
                    )}

                    {(sub.status === 'active' || sub.status === 'paused') && (
                        <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => onCancel(sub.id)}
                            className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 text-xs font-bold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                        >
                            <XCircle className="h-4 w-4" />
                            <span>Hủy gói</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}