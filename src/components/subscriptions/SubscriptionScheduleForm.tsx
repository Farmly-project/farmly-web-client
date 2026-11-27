import { MapPin } from 'lucide-react';

export const WEEKDAY_OPTIONS = [
    { key: 'MON', code: 1, label: 'Thứ 2', jsDay: 1 },
    { key: 'TUE', code: 2, label: 'Thứ 3', jsDay: 2 },
    { key: 'WED', code: 3, label: 'Thứ 4', jsDay: 3 },
    { key: 'THU', code: 4, label: 'Thứ 5', jsDay: 4 },
    { key: 'FRI', code: 5, label: 'Thứ 6', jsDay: 5 },
    { key: 'SAT', code: 6, label: 'Thứ 7', jsDay: 6 },
];

export const DELIVERY_SLOTS = [
    { key: 'MORNING', label: 'Buổi sáng (08:00 – 11:30)' },
    { key: 'AFTERNOON', label: 'Buổi chiều (14:00 – 17:30)' },
    { key: 'EVENING', label: 'Buổi tối (18:00 – 20:30)' },
];

interface SubscriptionScheduleFormProps {
    selectedWeekdays: string[];
    startDate: string;
    minStartDate: string;
    deliverySlot: string;
    shippingAddress: string;
    onToggleWeekday: (dayKey: string) => void;
    onChangeStartDate: (val: string) => void;
    onChangeDeliverySlot: (val: string) => void;
    onChangeShippingAddress: (val: string) => void;
}

export function SubscriptionScheduleForm({
    selectedWeekdays,
    startDate,
    minStartDate,
    deliverySlot,
    shippingAddress,
    onToggleWeekday,
    onChangeStartDate,
    onChangeDeliverySlot,
    onChangeShippingAddress,
}: SubscriptionScheduleFormProps) {
    return (
        <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 sm:p-6 shadow-xs space-y-5">
            <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B4332]">
                    Bước 2 / 2
                </span>
                <h2 className="text-lg font-extrabold text-gray-900">
                    Lịch giao cố định & Địa chỉ nhận
                </h2>
            </div>

            {/* Chọn các thứ giao trong tuần */}
            <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">
                    Chọn các thứ giao trong tuần (có thể chọn nhiều ngày):
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {WEEKDAY_OPTIONS.map((day) => {
                        const active = selectedWeekdays.includes(day.key);
                        return (
                            <button
                                key={day.key}
                                type="button"
                                onClick={() => onToggleWeekday(day.key)}
                                className={`min-h-[44px] rounded-xl text-xs font-bold border transition ${active
                                    ? 'bg-[#1E462D] text-white border-[#1E462D]'
                                    : 'bg-[#F8FAF8] text-gray-700 border-gray-200 hover:border-emerald-400'
                                    }`}
                            >
                                {day.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Ngày bắt đầu & Khung giờ giao */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Ngày bắt đầu chu kỳ (từ ngày mai):
                    </label>
                    <input
                        type="date"
                        min={minStartDate}
                        value={startDate}
                        onChange={(e) => onChangeStartDate(e.target.value)}
                        className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm font-semibold text-gray-900 focus:border-[#1B4332] focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Khung giờ giao hàng:
                    </label>
                    <select
                        value={deliverySlot}
                        onChange={(e) => onChangeDeliverySlot(e.target.value)}
                        className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-900 focus:border-[#1B4332] focus:outline-none"
                    >
                        {DELIVERY_SLOTS.map((slot) => (
                            <option key={slot.key} value={slot.key}>
                                {slot.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Địa chỉ giao hàng */}
            <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Địa chỉ giao định kỳ (Nội thành TP.HCM):
                </label>
                <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[#1B4332]" />
                    <input
                        type="text"
                        value={shippingAddress}
                        onChange={(e) => onChangeShippingAddress(e.target.value)}
                        placeholder="VD: 31 Trần Hưng Đạo, Phường 15, Quận 5, TP. Hồ Chí Minh"
                        className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-3.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1B4332] focus:outline-none"
                    />
                </div>
            </div>
        </div>
    );
}