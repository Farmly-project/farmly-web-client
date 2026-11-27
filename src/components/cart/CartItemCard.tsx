import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, AlertTriangle, Sparkles } from 'lucide-react';
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

export function CartItemCard({
    item,
    isChecked,
    isBusy,
    onToggle,
    onChangeQuantity,
    onRemove,
}: CartItemCardProps) {
    const isOutOfStock =
        item.is_available === false ||
        (item.available_stock !== undefined && item.available_stock <= 0);

    const isExceedStock =
        !isOutOfStock &&
        item.available_stock !== undefined &&
        item.quantity >= item.available_stock;

    const isOverLimit =
        !isOutOfStock &&
        item.available_stock !== undefined &&
        item.quantity > item.available_stock;

    const discountPercent =
        item.original_price && item.original_price > item.unit_price
            ? Math.round(
                ((item.original_price - item.unit_price) / item.original_price) * 100
            )
            : 0;

    return (
        <div
            className={`rounded-2xl border bg-white p-4 sm:p-5 shadow-2xs transition ${isOutOfStock
                ? 'border-gray-200 opacity-70'
                : isChecked
                    ? 'border-[#1E462D]/30'
                    : 'border-emerald-900/10'
                }`}
        >
            <div className="flex items-start gap-3 sm:gap-4">
                {/* Checkbox (Vùng bấm >= 44px) */}
                <label className="flex min-h-11 min-w-8 items-center justify-center cursor-pointer pt-1">
                    <input
                        type="checkbox"
                        checked={isChecked && !isOutOfStock}
                        disabled={isOutOfStock}
                        onChange={() => onToggle(item.id)}
                        aria-label={`Chọn ${item.product_name}`}
                        className="h-5 w-5 rounded-md border-gray-300 text-[#1E462D] focus:ring-[#1E462D] disabled:opacity-40"
                    />
                </label>

                {/* Ảnh sản phẩm */}
                <Link
                    to={`/products/${item.product_id}`}
                    className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl bg-[#F4F6F9] border border-gray-100"
                >
                    {item.image_url ? (
                        <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#1B4332]">
                            FARMLY
                        </div>
                    )}

                    {discountPercent > 0 && !isOutOfStock && (
                        <span className="absolute top-1.5 left-1.5 rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                            -{discountPercent}%
                        </span>
                    )}
                </Link>

                {/* Nội dung & Stepper */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            {item.is_near_expiry && !isOutOfStock && (
                                <span className="mb-1 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                                    <Sparkles className="h-3 w-3" />
                                    Ưu đãi lô cận hạn
                                </span>
                            )}

                            <Link
                                to={`/products/${item.product_id}`}
                                className="block text-sm sm:text-base font-extrabold text-gray-900 hover:text-[#1B4332] truncate"
                            >
                                {item.product_name}
                            </Link>

                            <p className="mt-0.5 text-xs text-gray-500">
                                Đơn vị: {item.unit}
                                {item.category_note ? ` • ${item.category_note}` : ''}
                                {item.available_stock !== undefined &&
                                    !isOutOfStock &&
                                    ` • Tồn khả dụng: ${item.available_stock} ${item.unit}`}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => onRemove(item.id)}
                            disabled={isBusy}
                            aria-label={`Xóa ${item.product_name}`}
                            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Cảnh báo ngoại lệ UC06 - E2 */}
                    {isOutOfStock && (
                        <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>
                                Sản phẩm hiện đã hết lô còn hạn hoặc ngừng kinh doanh. Vui lòng
                                xóa khỏi giỏ.
                            </span>
                        </div>
                    )}

                    {!isOutOfStock &&
                        item.available_stock !== undefined &&
                        (isOverLimit || item.available_stock <= 5) && (
                            <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                                <span>
                                    {isOverLimit
                                        ? `Chỉ còn ${item.available_stock} ${item.unit} khả dụng trong các lô còn hạn. Vui lòng giảm số lượng.`
                                        : `Chỉ còn ${item.available_stock} ${item.unit} khả dụng trong kho.`}
                                </span>
                            </div>
                        )}

                    {/* Giá & Nút +/- */}
                    <div className="mt-3.5 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">Đơn giá:</span>
                                {item.original_price &&
                                    item.original_price > item.unit_price && (
                                        <span className="text-xs text-gray-400 line-through">
                                            {formatVND(item.original_price)}
                                        </span>
                                    )}
                                <span className="text-xs font-bold text-gray-700">
                                    {formatVND(item.unit_price)}
                                </span>
                            </div>
                            <p className="mt-0.5 text-base sm:text-lg font-extrabold text-[#1B4332]">
                                {formatVND(item.unit_price * item.quantity)}
                            </p>
                        </div>

                        <div className="inline-flex h-11 items-center rounded-xl bg-[#F4F6F9] p-1 border border-gray-200/70">
                            <button
                                type="button"
                                disabled={isBusy || isOutOfStock || item.quantity <= 1}
                                onClick={() =>
                                    onChangeQuantity(
                                        item.id,
                                        item.quantity - 1,
                                        item.available_stock
                                    )
                                }
                                aria-label="Giảm số lượng"
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 hover:bg-white disabled:opacity-35 transition"
                            >
                                <Minus className="h-4 w-4" />
                            </button>

                            <span className="min-w-9 text-center text-sm font-extrabold text-gray-900 select-none">
                                {item.quantity}
                            </span>

                            <button
                                type="button"
                                disabled={isBusy || isOutOfStock || isExceedStock}
                                onClick={() =>
                                    onChangeQuantity(
                                        item.id,
                                        item.quantity + 1,
                                        item.available_stock
                                    )
                                }
                                aria-label="Tăng số lượng"
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 hover:bg-white disabled:opacity-35 transition"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}