import { Link } from 'react-router-dom';
import { ShoppingCart, Star, ShieldCheck, Calendar, Flame } from 'lucide-react';
import type { ProductCardItem } from '../../types/product.types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ProductCardProps {
    product: ProductCardItem;
    onAddToCart: (productId: number) => void;
    isAdding?: boolean;
}

function getDaysUntilExpiry(expDateStr: string | null): number | null {
    if (!expDateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expDateStr);
    expDate.setHours(0, 0, 0, 0);
    return Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function ProductCard({
    product,
    onAddToCart,
    isAdding = false,
}: ProductCardProps) {
    const availableQty = Number(product.available_quantity ?? 0);
    const isOutOfStock = availableQty <= 0;

    // Kiểm tra Flash Sale theo trường has_flash_sale và flash_sale_price từ API
    const activeFlashSalePrice =
        product.has_flash_sale &&
            product.flash_sale_price !== null &&
            product.flash_sale_price < product.base_price
            ? product.flash_sale_price
            : null;

    const displayPrice = activeFlashSalePrice ?? product.base_price;

    // Tính số ngày còn lại trước hạn sử dụng gần nhất (FEFO)
    const daysUntilExpiry = getDaysUntilExpiry(product.nearest_exp_date);
    const isNearExpiry =
        !isOutOfStock && daysUntilExpiry !== null && daysUntilExpiry <= 2;

    const imageUrl =
        product.primary_image ||
        product.images?.[0]?.image_url ||
        '/images/placeholder-veg.webp';

    const certifications = Array.isArray(product.certifications)
        ? product.certifications
        : [];

    return (
        <div className="group flex flex-col justify-between rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all">
            {/* Phần trên: Ảnh & Các nhãn trạng thái */}
            <div>
                <Link
                    to={`/products/${product.id}`}
                    className="relative block aspect-square w-full bg-gray-100 overflow-hidden"
                >
                    <img
                        src={imageUrl}
                        alt={product.name}
                        loading="lazy"
                        className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${isOutOfStock ? 'opacity-50 grayscale' : ''
                            }`}
                    />

                    {/* Góc trên trái: Nhãn Flash Sale / Cận hạn & Gói định kỳ */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {(activeFlashSalePrice || isNearExpiry) && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                                <Flame className="h-3 w-3" />
                                {activeFlashSalePrice ? 'Xả kho cận hạn' : 'Sắp hết hạn'}
                            </span>
                        )}
                        {product.category?.allow_subscription && (
                            <span className="inline-block rounded-md bg-emerald-700/90 px-2 py-0.5 text-[11px] font-medium text-white">
                                Có gói định kỳ
                            </span>
                        )}
                    </div>

                    {/* Góc trên phải: Chứng nhận (nếu API trả về) */}
                    {certifications.length > 0 && (
                        <span className="absolute top-2 right-2 inline-flex items-center gap-0.5 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 shadow-sm">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            {typeof certifications[0] === 'string'
                                ? certifications[0]
                                : certifications[0].cert_name}
                        </span>
                    )}

                    {/* Overlay khi hết hàng */}
                    {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="rounded-lg bg-gray-900/90 px-3 py-1.5 text-xs font-semibold text-white">
                                Tạm hết hàng
                            </span>
                        </div>
                    )}
                </Link>

                {/* Nội dung thông tin sản phẩm */}
                <div className="p-3">
                    {/* Danh mục & Đánh giá */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span className="truncate">{product.category?.name ?? 'Nông sản sạch'}</span>
                        {(product.rating_summary?.count ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-0.5 font-medium text-amber-600">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                {product.rating_summary!.average.toFixed(1)} ({product.rating_summary!.count})
                            </span>
                        )}
                    </div>

                    {/* Tên sản phẩm */}
                    <Link to={`/products/${product.id}`}>
                        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 hover:text-emerald-700">
                            {product.name}
                        </h3>
                    </Link>

                    {/* Mô tả ngắn */}
                    {product.short_description && (
                        <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                            {product.short_description}
                        </p>
                    )}

                    {/* Thông tin lô FEFO gần nhất & Tồn kho khả dụng */}
                    {!isOutOfStock && (
                        <div className="mt-2 rounded-lg bg-emerald-50/70 px-2 py-1.5 text-[11px] text-emerald-900 space-y-0.5">
                            {product.nearest_exp_date && (
                                <div className="flex items-center justify-between gap-1">
                                    <span className="inline-flex items-center gap-1">
                                        <Calendar className="h-3 w-3 text-emerald-600 shrink-0" />
                                        HSD: <strong>{formatDate(product.nearest_exp_date)}</strong>
                                    </span>
                                    {daysUntilExpiry !== null && daysUntilExpiry >= 0 && (
                                        <span
                                            className={`font-semibold ${daysUntilExpiry <= 2 ? 'text-red-600' : 'text-emerald-700'
                                                }`}
                                        >
                                            Còn {daysUntilExpiry} ngày
                                        </span>
                                    )}
                                </div>
                            )}
                            <div className="flex items-center justify-between text-gray-600">
                                <span>Bảo quản: {product.preservation_days} ngày</span>
                                <span className="font-medium text-gray-800">
                                    Còn {availableQty} {product.unit}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Phần dưới: Giá bán & Nút Thêm vào giỏ */}
            <div className="px-3 pb-3 pt-1 flex items-end justify-between gap-2">
                <div>
                    {activeFlashSalePrice !== null && (
                        <div className="text-xs text-gray-400 line-through">
                            {formatCurrency(product.base_price)}
                        </div>
                    )}
                    <div className="flex items-baseline gap-1">
                        <span
                            className={`text-base font-bold ${activeFlashSalePrice !== null ? 'text-red-600' : 'text-emerald-700'
                                }`}
                        >
                            {formatCurrency(displayPrice)}
                        </span>
                        <span className="text-xs text-gray-500">/{product.unit}</span>
                    </div>
                </div>

                <button
                    type="button"
                    disabled={isOutOfStock || isAdding}
                    onClick={() => onAddToCart(product.id)}
                    aria-label={`Thêm ${product.name} vào giỏ hàng`}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                    <ShoppingCart className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}