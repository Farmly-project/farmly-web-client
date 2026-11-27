import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, AlertTriangle } from 'lucide-react';
import type { CartItem } from '../../contexts/CartContext';
import { formatVND } from '../../utils/formatters';

interface CartItemCardProps {
    item: CartItem;
    isChecked: boolean;
    isBusy: boolean;
    onToggle: (id: string) => void;
    onChangeQuantity: (id: string, newQty: number, maxStock?: number) => void;
    onRemove: (id: string) => void;
}

const FALLBACK_IMG =
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80';

export function CartItemCard({
    item,
    isChecked,
    isBusy,
    onToggle,
    onChangeQuantity,
    onRemove,
}: CartItemCardProps) {
    const isOutOfStockOrInactive =
        item.is_available === false ||
        (item.available_stock !== undefined && item.available_stock <= 0);

    const isExceedingStock =
        !isOutOfStockOrInactive &&
        item.available_stock !== undefined &&
        item.quantity > item.available_stock;

    const isAtMaxStock =
        item.available_stock !== undefined && item.quantity >= item.available_stock;

    const lineTotal = item.unit_price * item.quantity;

    return (
        <div
            className={`rounded-2xl border bg-white p-4 shadow-2xs transition ${isOutOfStockOrInactive
                    ? 'border-gray-200 opacity-65'
                    : isExceedingStock
                        ? 'border-amber-300 bg-amber-50/20'
                        : 'border-emerald-900/10'
                }`}
        >
            <div className="flex items-start gap-3 sm:gap-4">
                {/* Checkbox chọn mua */}
                <label className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center">
                    <input
                        type="checkbox"
                        checked={isChecked && !isOutOfStockOrInactive}
                        disabled={isOutOfStockOrInactive || isBusy}
                        onChange={() => onToggle(item.id)}
                        aria-label={`Chọn ${item.product_name}`}
                        className="h-5 w-5 rounded-md border-gray-300 text-[#1E462D] focus:ring-[#1E462D] disabled:cursor-not-allowed"
                    />
                </label>

                {/* Ảnh sản phẩm */}
                <Link
                    to={`/products/${item.product_id}`}
                    className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-[#F3F8F3] sm:h-24 sm:w-24"
                >
                    <img
                        src={item.image_url || FALLBACK_IMG}
                        alt={item.product_name}
                        className="h-full w-full object-cover"
                    />
                </Link>

                {/* Thông tin sản phẩm + Stepper */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <Link
                                to={`/products/${item.product_id}`}
                                className="line-clamp-2 text-sm font-bold text-gray-900 hover:text-[#1B4332] sm:text-base"
                            >
                                {item.product_name}
                            </Link>

                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                <span>Đơn vị: {item.unit}</span>
                                {item.available_stock !== undefined && !isOutOfStockOrInactive && (
                                    <span>• Tồn khả dụng: {item.available_stock}</span>
                                )}
                                {item.is_near_expiry_deal && !isOutOfStockOrInactive && (
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                                        Xả lô cận hạn
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Nút xóa sản phẩm (≥ 44x44px) */}
                        <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => onRemove(item.id)}
                            aria-label={`Xóa ${item.product_name}`}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Cảnh báo tồn kho / ngừng bán (UC06 - E2) */}
                    {isOutOfStockOrInactive && (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span>Sản phẩm tạm hết hàng hoặc ngừng kinh doanh</span>
                        </div>
                    )}

                    {isExceedingStock && (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span>
                                Chỉ còn {item.available_stock} {item.unit} khả dụng trong lô hiện tại
                            </span>
                        </div>
                    )}

                    {/* Hàng dưới: Đơn giá - Cụm +/- - Thành tiền */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm font-extrabold text-[#1B4332] sm:text-base">
                                {formatVND(item.unit_price)}
                            </span>
                            {item.original_price && item.original_price > item.unit_price && (
                                <span className="text-xs text-gray-400 line-through">
                                    {formatVND(item.original_price)}
                                </span>
                            )}
                        </div>

                        {/* Bộ tăng giảm số lượng đạt chuẩn chạm 44x44px */}
                        <div className="flex items-center gap-3">
                            <div className="inline-flex items-center rounded-xl border border-gray-200 bg-[#F4F6F9]">
                                <button
                                    type="button"
                                    disabled={isBusy || item.quantity <= 1 || isOutOfStockOrInactive}
                                    onClick={() =>
                                        onChangeQuantity(item.id, item.quantity - 1, item.available_stock)
                                    }
                                    aria-label="Giảm số lượng"
                                    className="flex h-11 w-11 items-center justify-center rounded-l-xl text-gray-700 transition hover:bg-gray-200/70 disabled:opacity-40"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>

                                <span className="w-9 text-center text-sm font-bold text-gray-900">
                                    {item.quantity}
                                </span>

                                <button
                                    type="button"
                                    disabled={isBusy || isOutOfStockOrInactive || isAtMaxStock}
                                    onClick={() =>
                                        onChangeQuantity(item.id, item.quantity + 1, item.available_stock)
                                    }
                                    aria-label="Tăng số lượng"
                                    className="flex h-11 w-11 items-center justify-center rounded-r-xl text-gray-700 transition hover:bg-gray-200/70 disabled:opacity-40"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>

                            <span className="hidden min-w-[84px] text-right text-sm font-extrabold text-gray-900 sm:inline-block">
                                {formatVND(lineTotal)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}