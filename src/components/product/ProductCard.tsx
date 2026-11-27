import { Link } from 'react-router-dom';
import { ShoppingCart, Star, ShieldCheck, Calendar, Flame } from 'lucide-react';
import type { ProductCardItem } from '../../types/product.types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ProductCardProps {
    product: ProductCardItem;
    onAddToCart: (productId: number) => void;
    isAdding?: boolean;
}

export function ProductCard({
    product,
    onAddToCart,
    isAdding = false,
}: ProductCardProps) {
    const isOutOfStock = product.available_stock <= 0 || !product.fefo_batch;

    // Kiểm tra lô FEFO hiện tại có đang Flash Sale không
    const activeFlashSalePrice =
        product.fefo_batch?.flash_sale_price &&
            (!product.fefo_batch.flash_sale_ends_at ||
                new Date(product.fefo_batch.flash_sale_ends_at) > new Date())
            ? product.fefo_batch.flash_sale_price
            : null;

    const displayPrice = activeFlashSalePrice ?? product.base_price;
    const isNearExpiry =
        !isOutOfStock && (product.fefo_batch?.days_until_expiry ?? 99) <= 2;

    return (
        <div className="group flex flex-col justify-between rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all">
            {/* Phần trên: Ảnh & Các nhãn trạng thái */}
            <div>
                <Link
                    to={`/products/${product.slug}`}
                    className="relative block aspect-square w-full bg-gray-100 overflow-hidden"
                >
                    <img
                        src={product.primary_image_url || '/images/placeholder-veg.webp'}
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
                        {product.category.allow_subscription && (
                            <span className="inline-block rounded-md bg-emerald-700/90 px-2 py-0.5 text-[11px] font-medium text-white">
                                Có gói định kỳ
                            </span>
                        )}
                    </div>

                    {/* Góc trên phải: Chứng nhận VietGAP / GlobalGAP */}
                    {product.certifications.length > 0 && (
                        <span className="absolute top-2 right-2 inline-flex items-center gap-0.5 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 shadow-sm">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            {product.certifications[0]}
                        </span>
                    )}

                    {/* Overlay khi hết hàng (UC07 - A2) */}
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
                        <span className="truncate">{product.category.name}</span>
                        {product.rating_summary.count > 0 && (
                            <span className="inline-flex items-center gap-0.5 font-medium text-amber-600">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                {product.rating_summary.average.toFixed(1)} ({product.rating_summary.count})
                            </span>
                        )}
                    </div>

                    {/* Tên sản phẩm */}
                    <Link to={`/products/${product.slug}`}>
                        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 hover:text-emerald-700 min-h-10">
                            {product.name}
                        </h3>
                    </Link>

                    {/* Thông tin minh bạch của Lô FEFO hiện hành (UC07) */}
                    {!isOutOfStock && product.fefo_batch && (
                        <div className="mt-2 rounded-lg bg-emerald-50/70 px-2 py-1.5 text-[11px] text-emerald-900 space-y-0.5">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-emerald-600 shrink-0" />
                                <span>
                                    Thu hoạch: <strong>{formatDate(product.fefo_batch.harvest_date)}</strong>
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-gray-600">
                                <span>HSD: {formatDate(product.fefo_batch.exp_date)}</span>
                                <span>
                                    Còn {product.available_stock} {product.unit}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Phần dưới: Giá bán & Nút Thêm vào giỏ (Tối thiểu 44x44px theo NFR-U03) */}
            <div className="px-3 pb-3 pt-1 flex items-end justify-between gap-2">
                <div>
                    {activeFlashSalePrice && (
                        <div className="text-xs text-gray-400 line-through">
                            {formatCurrency(product.base_price)}
                        </div>
                    )}
                    <div className="flex items-baseline gap-1">
                        <span
                            className={`text-base font-bold ${activeFlashSalePrice ? 'text-red-600' : 'text-emerald-700'
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