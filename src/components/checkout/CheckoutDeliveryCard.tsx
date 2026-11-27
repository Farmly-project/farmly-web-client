import { Clock, Calendar } from 'lucide-react';
import type { DeliveryTimeSlot } from '../../types/order.types';

export interface DeliveryDateOption {
    value: string; // YYYY-MM-DD
    label: string; // VD: "Hôm nay (27/11)"
}

interface CheckoutDeliveryCardProps {
    dateOptions: DeliveryDateOption[];
    selectedDate: string;
    selectedSlot: DeliveryTimeSlot;
    note: string;
    onSelectDate: (date: string) => void;
    onSelectSlot: (slot: DeliveryTimeSlot) => void;
    onChangeNote: (note: string) => void;
}

export function CheckoutDeliveryCard({
    dateOptions,
    selectedDate,
    selectedSlot,
    note,
    onSelectDate,
    onSelectSlot,
    onChangeNote,
}: CheckoutDeliveryCardProps) {
    const slots: { value: DeliveryTimeSlot; title: string; desc: string }[] = [
        {
            value: 'MORNING',
            title: 'Buổi sáng (08:00 - 11:30)',
            desc: 'Thu hoạch sáng sớm & đóng gói từ nông trại',
        },
        {
            value: 'AFTERNOON',
            title: 'Buổi chiều (14:00 - 17:30)',
            desc: 'Giao mát trong ngày bằng thùng bảo ôn tận cửa',
        },
    ];

    return (
        <section className="rounded-3xl border border-emerald-900/10 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DDF2E2] text-[#1B4332]">
                    <Clock className="h-4 w-4" />
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
                    2. Thời gian nhận hàng & Ghi chú
                </h2>
            </div>

            {/* Ngày giao dự kiến */}
            <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-2">
                    Ngày giao dự kiến
                </p>
                <div className="flex flex-wrap gap-2.5">
                    {dateOptions.map((opt) => {
                        const isActive = opt.value === selectedDate;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => onSelectDate(opt.value)}
                                className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-xs sm:text-sm font-bold transition ${isActive
                                        ? 'bg-[#1E462D] text-white shadow-2xs'
                                        : 'bg-[#EFF3FA] text-gray-700 hover:bg-gray-200/70'
                                    }`}
                            >
                                <Calendar className="h-4 w-4 shrink-0" />
                                <span>{opt.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Khung giờ nhận rau tươi */}
            <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-2">
                    Khung giờ nhận rau tươi
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {slots.map((slot) => {
                        const isActive = slot.value === selectedSlot;
                        return (
                            <button
                                key={slot.value}
                                type="button"
                                onClick={() => onSelectSlot(slot.value)}
                                className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition min-h-[72px] ${isActive
                                        ? 'border-[#1E462D]/40 bg-[#DDF2E2]/55'
                                        : 'border-transparent bg-[#EFF3FA] hover:bg-gray-200/60'
                                    }`}
                            >
                                <span
                                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${isActive ? 'border-[#1E462D]' : 'border-gray-400 bg-white'
                                        }`}
                                >
                                    {isActive && <span className="h-2.5 w-2.5 rounded-full bg-[#1E462D]" />}
                                </span>
                                <div>
                                    <p className="text-xs sm:text-sm font-extrabold text-gray-900">{slot.title}</p>
                                    <p className="mt-0.5 text-xs text-gray-600">{slot.desc}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Ghi chú đơn hàng */}
            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <label
                        htmlFor="checkout-order-note"
                        className="text-xs sm:text-sm font-bold text-gray-800"
                    >
                        Ghi chú đơn hàng
                    </label>
                    <span className="text-[11px] text-gray-400">Không bắt buộc</span>
                </div>
                <textarea
                    id="checkout-order-note"
                    rows={3}
                    maxLength={300}
                    value={note}
                    onChange={(e) => onChangeNote(e.target.value)}
                    placeholder="Ghi chú cho nông trại hoặc shipper (VD: Giao giờ hành chính, gọi trước 15 phút, gửi sảnh lễ tân...)"
                    className="w-full rounded-2xl bg-[#EFF3FA] p-3.5 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#1E462D]/20 border border-transparent focus:border-[#1E462D] focus:outline-none transition"
                />
            </div>
        </section>
    );
}