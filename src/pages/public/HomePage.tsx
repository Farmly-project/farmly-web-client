import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    Sparkles,
    CheckCircle2,
    WifiOff,
    RefreshCw,
} from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useCategories, useProducts } from '../../hooks/useProducts';
import { HomeHeroSection } from '../../components/home/HomeHeroSection';
import { HomeTrustPillars } from '../../components/home/HomeTrustPillars';
import {
    HomeProductCard,
    type HomeProductItem,
} from '../../components/home/HomeProductCard';
import { HomeSubscriptionBanner } from '../../components/home/HomeSubscriptionBanner';
import { HomeQrTracePreview } from '../../components/home/HomeQrTracePreview';

const FALLBACK_IMAGE =
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80';

// Chuẩn hóa an toàn dữ liệu item từ API sang props của HomeProductCard
function mapApiProductToCard(item: Record<string, any>): HomeProductItem {
    const basePrice = Number(item.base_price ?? 0);
    const rawSalePrice = item.flash_sale_price ?? item.sale_price;
    const salePrice =
        rawSalePrice !== null && rawSalePrice !== undefined
            ? Number(rawSalePrice)
            : undefined;

    const availableStock =
        item.available_stock ?? item.current_quantity ?? item.stock;

    return {
        id: item.id,
        name: item.name,
        unit: item.unit ?? 'kg',
        base_price: basePrice,
        sale_price: salePrice && salePrice < basePrice ? salePrice : undefined,
        certification_badge:
            item.certification_name ?? item.certification ?? 'VietGAP',
        is_near_expiry_deal: Boolean(
            item.flash_sale_price || item.is_flash_sale || item.is_near_expiry
        ),
        is_out_of_stock:
            availableStock !== undefined && Number(availableStock) <= 0,
        image_url:
            item.primary_image_url ??
            item.image_url ??
            item.thumbnail_url ??
            FALLBACK_IMAGE,
    };
}

// Skeleton khi đang tải danh mục
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

// Skeleton khi đang tải lưới sản phẩm
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
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // 1. Lấy danh sách danh mục (GET /api/v1/categories)
    const {
        data: categories = [],
        isLoading: isLoadingCategories,
        isError: isErrorCategories,
    } = useCategories();

    // 2. Lấy danh sách sản phẩm nổi bật theo danh mục (GET /api/v1/products)
    const {
        data: featuredRes,
        isLoading: isLoadingFeatured,
        isError: isErrorFeatured,
        refetch: refetchFeatured,
    } = useProducts({
        limit: 8,
        category_id:
            selectedCategoryId === 'all' ? undefined : selectedCategoryId,
        in_stock_only: true,
        sort: 'newest',
    });

    // 3. Lấy danh sách sản phẩm đang xả lô Flash Sale (GET /api/v1/products?flash_sale_only=true)
    const {
        data: flashSaleRes,
        isLoading: isLoadingFlashSale,
        isError: isErrorFlashSale,
        refetch: refetchFlashSale,
    } = useProducts({
        limit: 4,
        flash_sale_only: true,
        in_stock_only: true,
        sort: 'fefo',
    });

    const featuredProducts = useMemo(
        () => (featuredRes?.data ?? []).map(mapApiProductToCard),
        [featuredRes]
    );

    const flashSaleProducts = useMemo(
        () => (flashSaleRes?.data ?? []).map(mapApiProductToCard),
        [flashSaleRes]
    );

    const isApiOffline =
        isErrorCategories || isErrorFeatured || isErrorFlashSale;

    const handleRetryAll = () => {
        refetchFeatured();
        refetchFlashSale();
    };

    const handleAddProduct = async (product: HomeProductItem) => {
        await addToCart({
            product_id: product.id,
            product_name: product.name,
            unit: product.unit,
            unit_price: product.sale_price ?? product.base_price,
            image_url: product.image_url,
        });

        setToastMessage(`Đã thêm "${product.name}" vào giỏ hàng`);
        window.setTimeout(() => {
            setToastMessage(null);
        }, 2500);
    };

    return (
        <div>
            {/* Thông báo nhanh khi thêm vào giỏ */}
            {toastMessage && (
                <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl bg-[#1E462D] px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-lg">
                    <CheckCircle2 className="h-4 w-4 text-[#DDF2E2] shrink-0" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Thanh cảnh báo nhẹ phía trên nếu chưa kết nối được Backend API (không chặn trang) */}
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
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-900/10 px-2.5 py-1 font-bold hover:bg-amber-900/20 transition"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Kết nối lại</span>
                        </button>
                    </div>
                </div>
            )}

            {/* 1. Hero Section - Luôn hiển thị */}
            <HomeHeroSection />

            {/* 2. Thanh 3 trụ cột giá trị - Luôn hiển thị */}
            <HomeTrustPillars />

            {/* 3. Danh mục & Nông sản thu hoạch hôm nay */}
            <section className="mx-auto max-w-6xl px-4 pt-10 sm:pt-14">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                            Danh mục nông sản
                        </p>
                        <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-gray-900">
                            Nông sản thu hoạch hôm nay
                        </h2>
                    </div>

                    <Link
                        to="/products"
                        className="inline-flex min-h-11 items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1B4332] hover:text-emerald-700 transition"
                    >
                        <span>Xem tất cả sản phẩm</span>
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                {/* Thanh lọc nhanh theo danh mục (Có Skeleton khi loading, không sập khi lỗi API) */}
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

                {/* Trạng thái Loading / Lỗi API / Danh sách sản phẩm */}
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
                            <HomeProductCard
                                key={product.id}
                                product={product}
                                onAddToCart={handleAddProduct}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* 4. Khu vực Xả lô ưu đãi Flash Sale (Tự ẩn gọn nếu lỗi API hoặc chưa có lô xả, không làm vỡ layout) */}
            {(isLoadingFlashSale ||
                (!isErrorFlashSale && flashSaleProducts.length > 0)) && (
                    <section className="mx-auto max-w-6xl px-4 pt-10 sm:pt-14">
                        <div className="rounded-3xl border border-amber-200/80 bg-[#FFFBEB] p-5 sm:p-8">
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

                            {isLoadingFlashSale ? (
                                <ProductGridSkeleton count={4} />
                            ) : (
                                <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
                                    {flashSaleProducts.map((product) => (
                                        <HomeProductCard
                                            key={product.id}
                                            product={product}
                                            onAddToCart={handleAddProduct}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}

            {/* 5. Banner Gói rau định kỳ hàng tuần - Luôn hiển thị */}
            <HomeSubscriptionBanner />

            {/* 6. Trải nghiệm Tra cứu mã lô QR công khai - Luôn hiển thị */}
            <HomeQrTracePreview />
        </div>
    );
}

export default HomePage;