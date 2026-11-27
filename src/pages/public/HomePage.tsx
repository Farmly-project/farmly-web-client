import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    ChevronRight,
    Sparkles,
    CheckCircle2,
    WifiOff,
    RefreshCw,
} from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useCategories, useProducts } from '../../hooks/useProducts';
import type { ProductCardItem } from '../../types/product.types';
import { ProductCard } from '../../components/product/ProductCard';
import { HomeHeroSection } from '../../components/home/HomeHeroSection';
import { HomeTrustPillars } from '../../components/home/HomeTrustPillars';
import { HomeSubscriptionBanner } from '../../components/home/HomeSubscriptionBanner';
import { HomeQrTracePreview } from '../../components/home/HomeQrTracePreview';

const FALLBACK_IMAGE =
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80';

function CategoryPillsSkeleton() {
    return (
        <>
            {Array.from({ length: 4 }).map((_, idx) => (
                <div
                    key={idx}
                    className="h-11 w-28 shrink-0 rounded-full bg-gray-200 animate-pulse"
                />
            ))}
        </>
    );
}

function ProductGridSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {Array.from({ length: count }).map((_, idx) => (
                <div
                    key={idx}
                    className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white p-3.5 space-y-3 animate-pulse"
                >
                    <div className="aspect-square rounded-xl bg-gray-200" />
                    <div className="h-4 w-3/4 rounded-md bg-gray-200" />
                    <div className="h-3 w-1/2 rounded-md bg-gray-100" />
                    <div className="h-6 w-2/5 rounded-md bg-gray-200" />
                    <div className="h-11 w-full rounded-xl bg-gray-100" />
                </div>
            ))}
        </div>
    );
}

export function HomePage() {
    const { addToCart } = useCart();
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>(
        'all'
    );
    const [addingProductId, setAddingProductId] = useState<number | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // 1. Lấy danh sách danh mục
    const {
        data: categories = [],
        isLoading: isLoadingCategories,
        isError: isErrorCategories,
        refetch: refetchCategories,
    } = useCategories();

    // 2. Lấy đúng 4 sản phẩm nổi bật cho 1 hàng trên trang chủ
    const {
        data: featuredRes,
        isLoading: isLoadingFeatured,
        isError: isErrorFeatured,
        refetch: refetchFeatured,
    } = useProducts({
        limit: 4,
        category_id:
            selectedCategoryId === 'all' ? undefined : selectedCategoryId,
        in_stock_only: true,
        sort: 'newest',
    });

    // 3. Lấy đúng 4 sản phẩm xả lô Flash Sale (FEFO) cho 1 hàng
    const {
        data: flashSaleRes,
        isLoading: isLoadingFlashSale,
        isError: isErrorFlashSale,
        refetch: refetchFlashSale,
    } = useProducts({
        limit: 12,
        flash_sale_only: true,
        in_stock_only: true,
        sort: 'fefo',
    });

    // Kiểm tra sản phẩm thực sự thuộc lô cận hạn FEFO đang xả hàng & còn tồn
    function isFefoFlashSaleProduct(item: ProductCardItem): boolean {
        const availableStock = Number(item.available_quantity ?? 0);
        if (availableStock <= 0) return false;

        const hasDiscountPrice =
            item.flash_sale_price !== null &&
            item.flash_sale_price !== undefined &&
            Number(item.flash_sale_price) < Number(item.base_price);

        const daysUntilExpiry = item.nearest_exp_date
            ? Math.ceil(
                (new Date(item.nearest_exp_date).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            )
            : 99;

        return Boolean(item.has_flash_sale || hasDiscountPrice || daysUntilExpiry <= 2);
    }
    function sortOutOfStockLast(items: ProductCardItem[]): ProductCardItem[] {
        return [...items].sort((a, b) => {
            const aOut = Number(a.available_quantity ?? 0) <= 0 ? 1 : 0;
            const bOut = Number(b.available_quantity ?? 0) <= 0 ? 1 : 0;
            return aOut - bOut;
        });
    }
    const featuredProducts = useMemo<ProductCardItem[]>(() => {
        const rawList =
            featuredRes?.items ??
            (featuredRes as unknown as { data?: ProductCardItem[] })?.data ??
            [];
        return sortOutOfStockLast(rawList).slice(0, 4);
    }, [featuredRes]);

    const flashSaleProducts = useMemo<ProductCardItem[]>(() => {
        const rawList =
            flashSaleRes?.items ??
            (flashSaleRes as unknown as { data?: ProductCardItem[] })?.data ??
            [];
        return rawList.filter(isFefoFlashSaleProduct).slice(0, 4);
    }, [flashSaleRes]);

    const isApiOffline =
        isErrorCategories || isErrorFeatured || isErrorFlashSale;

    const handleRetryAll = () => {
        refetchCategories?.();
        refetchFeatured();
        refetchFlashSale();
    };

    const handleAddProduct = async (productId: number) => {
        const product =
            featuredProducts.find((p) => p.id === productId) ??
            flashSaleProducts.find((p) => p.id === productId);

        if (!product) return;

        setAddingProductId(productId);
        try {
            const activePrice =
                product.flash_sale_price !== null &&
                    product.flash_sale_price !== undefined &&
                    product.flash_sale_price < product.base_price
                    ? product.flash_sale_price
                    : product.base_price;

            await addToCart({
                product_id: product.id,
                product_name: product.name,
                unit: product.unit,
                unit_price: activePrice,
                image_url: product.primary_image || FALLBACK_IMAGE,
            });

            setToastMessage(`Đã thêm "${product.name}" vào giỏ hàng`);
            window.setTimeout(() => {
                setToastMessage(null);
            }, 2500);
        } finally {
            setAddingProductId(null);
        }
    };

    // Đường dẫn chuyển sang trang sản phẩm (giữ danh mục đang chọn nếu có)
    const allProductsHref =
        selectedCategoryId === 'all'
            ? '/products'
            : `/products?category_id=${selectedCategoryId}`;

    return (
        <div>
            {toastMessage && (
                <div
                    role="status"
                    className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl bg-[#1E462D] px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-lg"
                >
                    <CheckCircle2 className="h-4 w-4 text-[#DDF2E2] shrink-0" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {isApiOffline && (
                <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2.5">
                    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 text-xs text-amber-900">
                        <div className="flex items-center gap-2">
                            <WifiOff className="h-4 w-4 shrink-0 text-amber-700" />
                            <span>
                                Máy chủ API hiện chưa phản hồi. Một số danh sách sản phẩm tạm
                                thời chưa thể tải.
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleRetryAll}
                            className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-amber-900/10 px-3 py-1.5 font-bold hover:bg-amber-900/20 transition"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Kết nối lại</span>
                        </button>
                    </div>
                </div>
            )}

            <HomeHeroSection />
            <HomeTrustPillars />

            {/* 1 hàng đúng 4 sản phẩm + Nút mũi tên qua trang /products */}
            <section className="mx-auto max-w-6xl px-4 pt-10 sm:pt-14">
                <div className="flex items-end justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                            Danh mục nông sản
                        </p>
                        <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-gray-900">
                            Nông sản thu hoạch hôm nay
                        </h2>
                    </div>

                    <Link
                        to={allProductsHref}
                        aria-label="Xem tất cả sản phẩm"
                        className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-900/15 bg-white px-4 text-xs sm:text-sm font-bold text-[#1B4332] hover:bg-[#DDF2E2]/60 transition shrink-0"
                    >
                        <span>Tất cả</span>
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1E462D] text-white group-hover:translate-x-0.5 transition-transform">
                            <ArrowRight className="h-4 w-4" />
                        </span>
                    </Link>
                </div>

                {/* Thanh lọc nhanh theo danh mục */}
                <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
                    <button
                        type="button"
                        onClick={() => setSelectedCategoryId('all')}
                        className={`min-h-11 shrink-0 rounded-full px-4 text-xs sm:text-sm font-bold transition ${selectedCategoryId === 'all'
                            ? 'bg-[#1E462D] text-white'
                            : 'border border-emerald-900/10 bg-white text-gray-700 hover:bg-[#DDF2E2]/60'
                            }`}
                    >
                        Tất cả
                    </button>

                    {isLoadingCategories ? (
                        <CategoryPillsSkeleton />
                    ) : (
                        categories.map((cat) => {
                            const active = selectedCategoryId === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategoryId(cat.id)}
                                    className={`min-h-11 shrink-0 rounded-full px-4 text-xs sm:text-sm font-bold transition ${active
                                        ? 'bg-[#1E462D] text-white'
                                        : 'border border-emerald-900/10 bg-white text-gray-700 hover:bg-[#DDF2E2]/60'
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            );
                        })
                    )}
                </div>

                {isLoadingFeatured ? (
                    <ProductGridSkeleton count={4} />
                ) : isErrorFeatured ? (
                    <div className="mt-5 rounded-2xl border border-emerald-900/10 bg-white p-7 text-center">
                        <WifiOff className="mx-auto h-7 w-7 text-gray-400" />
                        <p className="mt-2 text-sm font-bold text-gray-900">
                            Chưa thể tải danh sách nông sản từ máy chủ
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                            Bạn vẫn có thể tra cứu mã lô QR hoặc đăng ký gói rau định kỳ bên
                            dưới.
                        </p>
                        <button
                            type="button"
                            onClick={() => refetchFeatured()}
                            className="mt-4 inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#1E462D] px-5 text-xs font-bold text-white hover:bg-[#163622] transition"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Tải lại danh sách</span>
                        </button>
                    </div>
                ) : featuredProducts.length === 0 ? (
                    <div className="mt-5 rounded-2xl border border-emerald-900/10 bg-white p-8 text-center text-sm text-gray-500">
                        Chưa có sản phẩm nào trong danh mục này.
                    </div>
                ) : (
                    <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
                        {featuredProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAddToCart={handleAddProduct}
                                isAdding={addingProductId === product.id}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Khu vực Xả lô ưu đãi Flash Sale (FEFO) — 1 hàng 4 sản phẩm + mũi tên qua trang */}
            {(isLoadingFlashSale ||
                (!isErrorFlashSale && flashSaleProducts.length > 0)) && (
                    <section className="mx-auto max-w-6xl px-4 pt-10 sm:pt-14">
                        <div className="rounded-3xl border border-amber-200/80 bg-[#FFFBEB] p-5 sm:p-8">
                            <div className="flex items-end justify-between gap-3">
                                <div>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold text-amber-900">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Ưu đãi lô cận hạn (FEFO)
                                    </span>
                                    <h2 className="mt-2 text-xl sm:text-2xl font-extrabold text-gray-900">
                                        Xả lô tươi trong ngày – Giảm giá ưu đãi
                                    </h2>
                                    <p className="mt-1 text-xs sm:text-sm text-gray-600">
                                        Nông sản vẫn đảm bảo chất lượng tươi ngon, ưu tiên xuất kho sớm
                                        để giảm hao hụt sau thu hoạch.
                                    </p>
                                </div>

                                <Link
                                    to="/products?flash_sale_only=true"
                                    aria-label="Xem tất cả lô ưu đãi cận hạn"
                                    className="group inline-flex min-h-11 items-center gap-1.5 rounded-full bg-amber-900/10 px-4 text-xs sm:text-sm font-bold text-amber-950 hover:bg-amber-900/20 transition shrink-0"
                                >
                                    <span>Xem thêm</span>
                                    <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>

                            {isLoadingFlashSale ? (
                                <ProductGridSkeleton count={4} />
                            ) : (
                                <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
                                    {flashSaleProducts.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            onAddToCart={handleAddProduct}
                                            isAdding={addingProductId === product.id}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}

            <HomeSubscriptionBanner />
            <HomeQrTracePreview />
        </div>
    );
}

export default HomePage;