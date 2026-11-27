import { Link } from 'react-router-dom';
import { Plus, Minus } from 'lucide-react';
import { formatVND } from '../../utils/formatters';
import type { ProductCardItem } from '../../types/product.types';

interface SubscriptionProductSelectorProps {
    products: ProductCardItem[];
    isLoading: boolean;
    selectedQuantities: Record<number, number>;
    onUpdateQuantity: (productId: number, delta: number) => void;
}

export function SubscriptionProductSelector({
    products,
    isLoading,
    selectedQuantities,
    onUpdateQuantity,
}: SubscriptionProductSelectorProps) {
    return (
        <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B4332]">
                        Bước 1 / 2
                    </span>
                    <h2 className="text-lg font-extrabold text-gray-900">
                        Chọn nông sản cho mỗi kỳ giao
                    </h2>
                </div>
                <span className="rounded-full bg-[#F3F8F3] px-3 py-1 text-xs font-bold text-[#1B4332]">
                    Chốt giá cố định 30 ngày
                </span>
            </div>

            {isLoading ? (
                <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map((n) => (
                        <div key={n} className="h-20 rounded-2xl bg-gray-100" />
                    ))}
                </div>
            ) : products.length === 0 ? (
                <p className="rounded-2xl bg-[#F8FAF8] p-4 text-xs sm:text-sm text-gray-500">
                    Hiện chưa có sản phẩm nào mở đăng ký gói định kỳ.
                </p>
            ) : (
                <div className="space-y-3">
                    {products.map((item) => {
                        const qty = selectedQuantities[item.id] ?? 0;
                        const imgSrc =
                            item.primary_image ||
                            item.images?.find((img) => img.is_primary)?.image_url ||
                            item.images?.[0]?.image_url;

                        return (
                            <div
                                key={item.id}
                                className={`flex items-center justify-between gap-3 rounded-2xl border p-3 transition ${qty > 0
                                        ? 'border-[#1B4332] bg-[#F3F8F3]/70'
                                        : 'border-gray-200/80 bg-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                                        {imgSrc ? (
                                            <img
                                                src={imgSrc}
                                                alt={item.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-gray-400">
                                                FARMLY
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <Link
                                            to={`/products/${item.id}`}
                                            className="text-sm font-extrabold text-gray-900 hover:text-[#1B4332] truncate block"
                                        >
                                            {item.name}
                                        </Link>
                                        <div className="mt-0.5 text-xs text-gray-500">
                                            <strong className="text-[#1B4332]">
                                                {formatVND(item.base_price)}
                                            </strong>{' '}
                                            / {item.unit}
                                        </div>
                                    </div>
                                </div>

                                <div className="inline-flex items-center rounded-xl border border-gray-200 bg-white shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => onUpdateQuantity(item.id, -1)}
                                        aria-label="Giảm số lượng"
                                        className="flex h-11 w-11 items-center justify-center text-gray-600 hover:bg-gray-50 rounded-l-xl"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="w-8 text-center text-sm font-extrabold">
                                        {qty}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onUpdateQuantity(item.id, 1)}
                                        aria-label="Tăng số lượng"
                                        className="flex h-11 w-11 items-center justify-center text-[#1B4332] hover:bg-emerald-50 rounded-r-xl"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}