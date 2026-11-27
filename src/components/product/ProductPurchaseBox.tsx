import { useState } from 'react';
import { ShoppingCart, Zap, Truck, Minus, Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const WEEKDAYS = [
    { key: 'TUE', label: 'Thứ 3' },
    { key: 'THU', label: 'Thứ 5' },
    { key: 'SAT', label: 'Thứ 7' },
];

interface ProductPurchaseBoxProps {
    productId: number;
    unit: string;
    activePrice: number;
    availableStock: number;
    allowSubscription: boolean;
    isOutOfStock: boolean;
    isSubmitting: boolean;
    onAddToCart: (productId: number, quantity: number, redirectCheckout: boolean) => void;
    onSubscribe: (quantity: number, weekdays: string[]) => void;
}

export function ProductPurchaseBox({
    productId,
    unit,
    activePrice,
    availableStock,
    allowSubscription,
    isOutOfStock,
    isSubmitting,
    onAddToCart,
    onSubscribe,
}: ProductPurchaseBoxProps) {
    const [purchaseMode, setPurchaseMode] = useState<'single' | 'subscription'>('single');
    const [quantity, setQuantity] = useState(1);
    const [selectedDays, setSelectedDays] = useState<string[]>(['TUE', 'SAT']);

    const toggleWeekday = (dayKey: string) => {
        setSelectedDays((prev) =>
            prev.includes(dayKey)
                ? prev.length > 1
                    ? prev.filter((d) => d !== dayKey)
                    : prev
                : [...prev, dayKey]
        );
    };

    return (
        <>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
                    <button
                        type="button"
                        onClick={() => setPurchaseMode('single')}
                        className={`flex h-11 items-center justify-center gap-1.5 rounded-lg text-sm font-bold transition ${purchaseMode === 'single'
                                ? 'bg-[#1B5E20] text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <ShoppingCart className="h-4 w-4" />
                        Mua Lẻ
                    </button>

                    <button
                        type="button"
                        disabled={!allowSubscription}
                        onClick={() => setPurchaseMode('subscription')}
                        className={`relative flex h-11 items-center justify-center gap-1.5 rounded-lg text-sm font-bold transition ${purchaseMode === 'subscription'
                                ? 'bg-[#1B5E20] text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 disabled:opacity-40'
                            }`}
                    >
                        <span>Gói Rau Định Kỳ</span>
                        <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                            GIẢM 15%
                        </span>
                    </button>
                </div>

                {purchaseMode === 'single' ? (
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Chọn số lượng:</span>
                            <div className="inline-flex items-center rounded-xl border border-gray-200 bg-white">
                                <button
                                    type="button"
                                    disabled={isOutOfStock}
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                    aria-label="Giảm số lượng"
                                    className="flex h-11 w-11 items-center justify-center text-gray-600 hover:bg-gray-50 rounded-l-xl disabled:opacity-40"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-10 text-center text-sm font-bold">{quantity}</span>
                                <button
                                    type="button"
                                    disabled={isOutOfStock}
                                    onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                                    aria-label="Tăng số lượng"
                                    className="flex h-11 w-11 items-center justify-center text-gray-600 hover:bg-gray-50 rounded-r-xl disabled:opacity-40"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <p className="flex items-center gap-1.5 text-xs text-emerald-700">
                            <Truck className="h-4 w-4 shrink-0" />
                            Đặt hàng giao ngay nếu đặt trước 11:30 sáng nay tại TP.HCM
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3 rounded-xl bg-[#F1F8E9] p-3 text-xs">
                        <div className="font-bold text-[#1B5E20]">
                            Chọn ngày giao cố định mỗi tuần (Gói 1 tháng):
                        </div>
                        <div className="flex gap-2">
                            {WEEKDAYS.map((day) => {
                                const active = selectedDays.includes(day.key);
                                return (
                                    <button
                                        key={day.key}
                                        type="button"
                                        onClick={() => toggleWeekday(day.key)}
                                        className={`flex-1 h-10 rounded-lg font-bold border transition ${active
                                                ? 'bg-[#1B5E20] text-white border-[#1B5E20]'
                                                : 'bg-white text-gray-700 border-gray-200'
                                            }`}
                                    >
                                        {day.label}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="text-gray-600">
                            Đơn giá ưu đãi gói:{' '}
                            <strong className="text-[#1B5E20]">
                                {formatCurrency(Math.round(activePrice * 0.85))}
                            </strong>{' '}
                            /{unit} (Chốt giá cố định suốt 30 ngày)
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                        type="button"
                        disabled={isOutOfStock || isSubmitting}
                        onClick={() =>
                            purchaseMode === 'single'
                                ? onAddToCart(productId, quantity, true)
                                : onSubscribe(quantity, selectedDays)
                        }
                        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1B5E20] px-4 text-sm font-bold text-white shadow-sm hover:bg-emerald-900 active:scale-[0.99] disabled:bg-gray-300 transition"
                    >
                        <Zap className="h-4 w-4" />
                        {purchaseMode === 'single' ? 'Đặt Ngay' : 'Đăng Ký Gói'}
                    </button>

                    <button
                        type="button"
                        disabled={isOutOfStock || isSubmitting}
                        onClick={() => onAddToCart(productId, quantity, false)}
                        className="flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#1B5E20] bg-[#E8F5E9] px-4 text-sm font-bold text-[#1B5E20] hover:bg-emerald-100 active:scale-[0.99] disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 transition"
                    >
                        <ShoppingCart className="h-4 w-4" />
                        Thêm Vào Giỏ
                    </button>
                </div>
            </div>

            {/* Thanh action cố định trên Mobile */}
            <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center gap-2 border-t border-gray-200 bg-white p-3 shadow-lg md:hidden">
                <button
                    type="button"
                    disabled={isOutOfStock || isSubmitting}
                    onClick={() => onAddToCart(productId, quantity, false)}
                    className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#1B5E20] bg-[#E8F5E9] text-xs font-bold text-[#1B5E20] disabled:opacity-40"
                >
                    <ShoppingCart className="h-4 w-4" />
                    Thêm Giỏ
                </button>
                <button
                    type="button"
                    disabled={isOutOfStock || isSubmitting}
                    onClick={() =>
                        purchaseMode === 'single'
                            ? onAddToCart(productId, quantity, true)
                            : onSubscribe(quantity, selectedDays)
                    }
                    className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1B5E20] text-xs font-bold text-white disabled:bg-gray-300"
                >
                    <Zap className="h-4 w-4" />
                    {purchaseMode === 'single' ? 'Đặt Ngay' : 'Đăng Ký Gói'}
                </button>
            </div>
        </>
    );
}