import { Link } from 'react-router-dom';
import { Calendar, Clock, Home, Package, QrCode, ChevronRight } from 'lucide-react';
import type { ProductDetailData } from '../../types/product.types';
import { formatDate } from '../../utils/formatters';

interface FefoBatchCardProps {
    batch: ProductDetailData['fefo_batch'];
    availableStock: number;
    unit: string;
}

export function FefoBatchCard({ batch, availableStock, unit }: FefoBatchCardProps) {
    if (!batch) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                Tạm hết hàng (Hiện chưa có lô thu hoạch mới còn hạn sử dụng).
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1B5E20]">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Lô hàng đang bán (FEFO)
                </span>
                <span className="text-xs font-mono font-bold text-gray-800">{batch.batch_code}</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl bg-[#F8FAF8] border border-gray-100 p-2.5">
                    <div className="flex items-center gap-1 text-[11px] text-gray-500">
                        <Calendar className="h-3.5 w-3.5 text-[#1B5E20]" />
                        Ngày thu hoạch
                    </div>
                    <div className="mt-0.5 text-sm font-bold text-gray-900">
                        {formatDate(batch.harvest_date)}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-medium">
                        {batch.harvest_time_note || 'Sáng sớm'}
                    </div>
                </div>

                <div className="rounded-xl bg-amber-50/80 border border-amber-200/70 p-2.5">
                    <div className="flex items-center gap-1 text-[11px] text-amber-800">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        Hạn sử dụng
                    </div>
                    <div className="mt-0.5 text-sm font-bold text-gray-900">
                        {formatDate(batch.exp_date)}
                    </div>
                    <div className="text-[11px] font-semibold text-amber-700">
                        Còn {batch.days_until_expiry} ngày
                    </div>
                </div>

                <div className="rounded-xl bg-[#F8FAF8] border border-gray-100 p-2.5">
                    <div className="flex items-center gap-1 text-[11px] text-gray-500">
                        <Home className="h-3.5 w-3.5 text-[#1B5E20]" />
                        Nơi trồng
                    </div>
                    <div className="mt-0.5 text-sm font-bold text-gray-900">
                        {batch.grow_zone || 'Nhà kính A1'}
                    </div>
                    <div className="text-[11px] text-gray-500">Nông trại Farmly</div>
                </div>

                <div className="rounded-xl bg-[#F8FAF8] border border-gray-100 p-2.5">
                    <div className="flex items-center gap-1 text-[11px] text-gray-500">
                        <Package className="h-3.5 w-3.5 text-[#1B5E20]" />
                        Tồn khả dụng
                    </div>
                    <div className="mt-0.5 text-sm font-bold text-gray-900">
                        {availableStock} {unit}
                    </div>
                    <div className="text-[11px] text-gray-500">Lô hiện tại: {batch.current_quantity}</div>
                </div>
            </div>

            <Link
                to={`/trace/${batch.batch_code}`}
                className="flex items-center justify-between rounded-xl bg-[#E8F5E9] px-3.5 py-2.5 text-xs hover:bg-emerald-100/80 transition"
            >
                <div className="flex items-center gap-2.5">
                    <QrCode className="h-5 w-5 text-[#1B5E20] shrink-0" />
                    <div>
                        <div className="font-bold text-[#1B5E20]">Quét mã QR trên túi rau</div>
                        <div className="text-gray-600">Xem hồ sơ đất, chứng nhận và người trồng</div>
                    </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#1B5E20]" />
            </Link>
        </div>
    );
}