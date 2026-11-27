import type { FarmingLogItem } from '../../types/product.types';
import { formatDate } from '../../utils/formatters';

interface FarmingLogTimelineProps {
    batchCode?: string;
    description: string;
    logs: FarmingLogItem[];
}

export function FarmingLogTimeline({
    batchCode,
    description,
    logs,
}: FarmingLogTimelineProps) {
    if (!logs || logs.length === 0) return null;

    return (
        <section className="mt-12 space-y-4">
            <div className="space-y-1">
                {batchCode && (
                    <div className="text-xs font-bold uppercase tracking-wider text-[#1B5E20]">
                        • HÀNH TRÌNH LÔ HÀNG #{batchCode}
                    </div>
                )}
                <h2 className="text-2xl font-extrabold text-gray-900">Nhật Ký Canh Tác Thực Địa</h2>
                <p className="max-w-2xl text-sm text-gray-600">{description}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {logs.map((log, idx) => (
                    <div
                        key={log.id}
                        className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition"
                    >
                        <div>
                            <div className="flex items-center justify-between text-[11px] mb-2">
                                <span className="rounded bg-[#E8F5E9] px-2 py-0.5 font-bold text-[#1B5E20]">
                                    {log.stage_label || `GIAI ĐOẠN ${idx + 1}`}
                                </span>
                                <span className="text-gray-400 font-medium">{formatDate(log.logged_at)}</span>
                            </div>

                            <div className="aspect-4/3 w-full overflow-hidden rounded-xl bg-gray-100 mb-3">
                                <img
                                    src={log.evidence_image_url || '/images/placeholder-veg.webp'}
                                    alt={log.title}
                                    loading="lazy"
                                    className="h-full w-full object-cover"
                                />
                            </div>

                            <h3 className="text-sm font-bold text-gray-900 mb-1">{log.title}</h3>
                            <p className="text-xs leading-relaxed text-gray-600">{log.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}