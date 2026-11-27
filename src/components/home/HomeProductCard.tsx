import { Link } from 'react-router-dom';
import { Plus, Sparkles } from 'lucide-react';
import { formatVND } from '../../utils/formatters';

export interface HomeProductItem {
    id: number;
    name: string;
    unit: string;
    base_price: number;
    sale_price?: number;
    certification_badge?: string;
    is_near_expiry_deal?: boolean;
    is_out_of_stock?: boolean;
    image_url: string;
}

interface HomeProductCardProps {
    product: HomeProductItem;
    onAddToCart: (product: HomeProductItem) => void;
}

export function HomeProductCard({
    product,
    onAddToCart,
}: HomeProductCardProps) {
    const effectivePrice = product.sale_price ?? product.base_price;
    const discountPercent =
        product.sale_price && product.sale_price < product.base_price
            ? Math.round(
                ((product.base_price - product.sale_price) / product.base_price) * 100
            )
            : 0;

    return (
        <div className="group flex flex-col overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-2xs hover:shadow-md transition">
            <Link
                to={`/products/${product.id}`}
                className="relative aspect-square overflow-hidden bg-[#F4F6F9]"
            >
                <img
                    src={product.image_url}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                />

                {product.certification_badge && (
                    <span className="absolute top-2.5 left-2.5 rounded-lg bg-[#1E462D]/90 px-2 py-1 text-[10px] font-bold text-white">
                        {product.certification_badge}
                    </span>
                )}

                {discountPercent > 0 && (
                    <span className="absolute top-2.5 right-2.5 rounded-lg bg-red-600 px-2 py-1 text-[10px] font-extrabold text-white">
                        -{discountPercent}%
                    </span>
                )}
            </Link>

            <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                {product.is_near_expiry_deal && (
                    <span className="mb-1.5 inline-flex w-fit items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        <Sparkles className="h-3 w-3" />
                        Sắp hết hạn – giảm giá
                    </span>
                )}

                <Link
                    to={`/products/${product.id}`}
                    className="text-sm sm:text-base font-extrabold text-gray-900 hover:text-[#1B4332] line-clamp-2"
                >
                    {product.name}
                </Link>

                <p className="mt-1 text-xs text-gray-500">Đơn vị: {product.unit}</p>

                <div className="mt-auto pt-3">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-base sm:text-lg font-extrabold text-[#1B4332]">
                            {formatVND(effectivePrice)}
                        </span>
                        {product.sale_price && product.sale_price < product.base_price && (
                            <span className="text-xs text-gray-400 line-through">
                                {formatVND(product.base_price)}
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        disabled={product.is_out_of_stock}
                        onClick={() => onAddToCart(product)}
                        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-[#DDF2E2] px-3 text-xs sm:text-sm font-bold text-[#1B4332] hover:bg-[#1E462D] hover:text-white transition disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        {product.is_out_of_stock ? (
                            <span>Tạm hết hàng</span>
                        ) : (
                            <>
                                <Plus className="h-4 w-4" />
                                <span>Thêm vào giỏ</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}