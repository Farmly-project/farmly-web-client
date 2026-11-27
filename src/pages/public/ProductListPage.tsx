import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RotateCcw, PackageSearch, CheckCircle2 } from 'lucide-react';
import type {
    ProductCardItem,
    ProductListQueryParams,
} from '../../types/product.types';
import {
    ProductCard,
    ProductFilterPanel,
    ProductMobileFilterDrawer,
    ProductSortToolbar,
    ProductPagination,
} from '../../components/product';
import { useCategories, useProducts } from '../../hooks/useProducts';
import { useCart } from '../../hooks/useCart';

const ITEMS_PER_PAGE = 20;
const FALLBACK_IMAGE =
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80';

function sortOutOfStockLast(items: ProductCardItem[]): ProductCardItem[] {
    return [...items].sort((a, b) => {
        const aOut = Number(a.available_quantity ?? 0) <= 0 ? 1 : 0;
        const bOut = Number(b.available_quantity ?? 0) <= 0 ? 1 : 0;
        return aOut - bOut;
    });
}

export function ProductListPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { addToCart } = useCart();

    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [addingProductId, setAddingProductId] = useState<number | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Helper tính số ngày còn lại đến hạn sử dụng gần nhất (FEFO)
    function getDaysUntilExpiry(expDateStr: string | null): number | null {
        if (!expDateStr) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const exp = new Date(expDateStr);
        exp.setHours(0, 0, 0, 0);
        return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Hàm sắp xếp FEFO chuẩn: Còn hàng -> HSD gần nhất (exp_date ASC) -> Flash Sale -> Hết hàng
    function sortProductsByFEFO(items: ProductCardItem[]): ProductCardItem[] {
        return [...items].sort((a, b) => {
            const aInStock = (a.available_quantity ?? 0) > 0;
            const bInStock = (b.available_quantity ?? 0) > 0;

            // 1. Đẩy sản phẩm hết hàng xuống cuối
            if (aInStock !== bInStock) return aInStock ? -1 : 1;

            // 2. So sánh nearest_exp_date tăng dần (hết hạn trước lên đầu)
            const aExp = a.nearest_exp_date ? new Date(a.nearest_exp_date).getTime() : Number.POSITIVE_INFINITY;
            const bExp = b.nearest_exp_date ? new Date(b.nearest_exp_date).getTime() : Number.POSITIVE_INFINITY;

            if (aExp !== bExp) return aExp - bExp;

            // 3. Nếu cùng ngày hết hạn, ưu tiên lô đang xả kho Flash Sale
            if (a.has_flash_sale !== b.has_flash_sale) {
                return a.has_flash_sale ? -1 : 1;
            }

            return 0;
        });
    }
    const currentPage = Math.max(1, Number(searchParams.get('page')) || 1);
    const activeSearch = searchParams.get('search') || '';
    const sortBy =
        (searchParams.get('sort') as ProductListQueryParams['sort']) || 'fefo';

    const filters = useMemo(
        () => ({
            categoryId: searchParams.get('category_id')
                ? Number(searchParams.get('category_id'))
                : undefined,
            allowSubscription: searchParams.get('allow_subscription') === 'true',
            flashSaleOnly: searchParams.get('flash_sale_only') === 'true',
            nearExpiryOnly: searchParams.get('near_expiry') === 'true',
            inStockOnly: searchParams.get('in_stock_only') === 'true',
            certification: searchParams.get('certification') || '',
            minPrice: searchParams.get('min_price')
                ? Number(searchParams.get('min_price'))
                : undefined,
            maxPrice: searchParams.get('max_price')
                ? Number(searchParams.get('max_price'))
                : undefined,
        }),
        [searchParams]
    );

    const activeFilterCount = [
        filters.categoryId,
        filters.allowSubscription,
        filters.flashSaleOnly,
        filters.nearExpiryOnly,
        filters.inStockOnly,
        filters.certification,
        filters.minPrice,
        filters.maxPrice,
        activeSearch,
    ].filter(Boolean).length;

    const updateFilters = (
        updates: Record<string, string | number | boolean | undefined>
    ) => {
        const next = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, val]) => {
            if (val === undefined || val === '' || val === false) {
                next.delete(key);
            } else {
                next.set(key, String(val));
            }
        });
        // Khi bật lọc lô cận hạn / Flash Sale mà chưa chọn kiểu sort, tự động ưu tiên sort FEFO
        if ((updates.flash_sale_only === true || updates.near_expiry === true) && !('sort' in updates)) {
            next.set('sort', 'fefo');
        }
        if (!('page' in updates)) next.delete('page');
        setSearchParams(next);
    };

    // Lấy danh mục & danh sách sản phẩm qua hooks
    const { data: rawCategories = [] } = useCategories();
    const categories = useMemo(
        () => rawCategories.filter((c) => c.is_active !== false),
        [rawCategories]
    );

    const { data: productRes, isLoading } = useProducts({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: activeSearch || undefined,
        category_id: filters.categoryId,
        allow_subscription: filters.allowSubscription || undefined,
        flash_sale_only: filters.flashSaleOnly || undefined,
        near_expiry: filters.nearExpiryOnly || undefined,
        in_stock_only: filters.inStockOnly || undefined,
        certification: filters.certification || undefined,
        min_price: filters.minPrice,
        max_price: filters.maxPrice,
        sort: sortBy,
    });

    const rawItems = productRes?.items ?? [];

    // Lọc bổ sung & sắp xếp chuẩn FEFO trên giao diện để đảm bảo không lệch thứ tự
    const products = useMemo(() => {
        let list = [...rawItems];

        // 1. Chỉ lấy hàng còn tồn kho nếu bật inStockOnly
        if (filters.inStockOnly) {
            list = list.filter((item) => (item.available_quantity ?? 0) > 0);
        }

        // 2. Lọc lô cận hạn FEFO (còn <= 2 ngày hoặc đang xả kho flash sale)
        if (filters.nearExpiryOnly) {
            list = list.filter((item) => {
                const daysLeft = getDaysUntilExpiry(item.nearest_exp_date);
                const isNearExp = daysLeft !== null && daysLeft >= 0 && daysLeft <= 2;
                return (item.available_quantity ?? 0) > 0 && (isNearExp || item.has_flash_sale);
            });
        }

        // 3. Lọc riêng Flash Sale nếu bật flashSaleOnly
        if (filters.flashSaleOnly) {
            list = list.filter(
                (item) =>
                    (item.available_quantity ?? 0) > 0 &&
                    (item.has_flash_sale ||
                        (item.flash_sale_price !== null &&
                            Number(item.flash_sale_price) < Number(item.base_price)))
            );
        }

        // 4. Áp dụng sắp xếp FEFO khi sortBy === 'fefo'
        if (sortBy === 'fefo') {
            return sortProductsByFEFO(list);
        }

        if (sortBy === 'newest') {
            return sortOutOfStockLast(list);
        }

        return list;
    }, [rawItems, filters.inStockOnly, filters.nearExpiryOnly, filters.flashSaleOnly, sortBy]);

    const totalItems = productRes?.pagination?.total ?? products.length;
    const totalPages = Math.max(1, productRes?.pagination?.total_pages ?? 1);

    const handleAddToCart = async (productId: number) => {
        const target = products.find((p) => p.id === productId);
        if (!target) return;

        setAddingProductId(productId);
        try {
            const hasSale =
                target.flash_sale_price !== null &&
                target.flash_sale_price !== undefined &&
                Number(target.flash_sale_price) < Number(target.base_price);

            const unitPrice = hasSale
                ? Number(target.flash_sale_price)
                : Number(target.base_price);

            const imageUrl =
                target.primary_image ||
                target.images?.find((img) => img.is_primary)?.image_url ||
                target.images?.[0]?.image_url ||
                FALLBACK_IMAGE;

            await addToCart({
                product_id: target.id,
                product_name: target.name,
                unit: target.unit,
                unit_price: unitPrice,
                image_url: imageUrl,
                available_stock: target.available_quantity,
            });

            setToastMessage(`Đã thêm "${target.name}" vào giỏ hàng`);
            window.setTimeout(() => {
                setToastMessage(null);
            }, 2500);
        } finally {
            setAddingProductId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAF8] text-gray-900 pb-16">
            {toastMessage && (
                <div
                    role="status"
                    className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl bg-[#1E462D] px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-lg"
                >
                    <CheckCircle2 className="h-4 w-4 text-[#DDF2E2] shrink-0" />
                    <span>{toastMessage}</span>
                </div>
            )}

            <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <aside className="hidden lg:block lg:col-span-3">
                        <div className="sticky top-20 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <ProductFilterPanel
                                categories={categories}
                                filters={filters}
                                activeFilterCount={activeFilterCount}
                                onUpdateFilters={updateFilters}
                                onResetFilters={() => setSearchParams({})}
                            />
                        </div>
                    </aside>

                    <main className="lg:col-span-9 space-y-4">
                        <ProductSortToolbar
                            shownCount={products.length}
                            totalItems={totalItems}
                            sortBy={sortBy}
                            activeSearch={activeSearch}
                            filters={filters}
                            activeFilterCount={activeFilterCount}
                            onOpenMobileFilter={() => setIsMobileFilterOpen(true)}
                            onUpdateFilters={updateFilters}
                        />

                        {isLoading ? (
                            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-4">
                                {Array.from({ length: 8 }).map((_, idx) => (
                                    <div
                                        key={idx}
                                        className="h-80 rounded-2xl border border-gray-200 bg-white p-3 animate-pulse space-y-3"
                                    >
                                        <div className="aspect-square rounded-xl bg-gray-200" />
                                        <div className="h-4 w-3/4 rounded bg-gray-200" />
                                        <div className="h-12 rounded-lg bg-gray-100" />
                                        <div className="h-8 rounded bg-gray-200" />
                                    </div>
                                ))}
                            </div>
                        ) : products.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-4">
                                {products.map((item) => (
                                    <ProductCard
                                        key={item.id}
                                        product={item}
                                        onAddToCart={handleAddToCart}
                                        isAdding={addingProductId === item.id}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-16 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F5E9] text-[#1B5E20] mb-3">
                                    <PackageSearch className="h-7 w-7" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900">
                                    Không tìm thấy sản phẩm phù hợp
                                </h3>
                                <p className="mt-1 max-w-md text-xs text-gray-500">
                                    Thử thay đổi từ khóa tìm kiếm hoặc xóa bớt các điều kiện lọc
                                    để xem toàn bộ nông sản thu hoạch hôm nay tại nông trại
                                    Farmly.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setSearchParams({})}
                                    className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-[#1B5E20] px-5 text-xs font-bold text-white hover:bg-emerald-900 transition"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Xem tất cả nông sản
                                </button>
                            </div>
                        )}

                        <ProductPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page: any) => updateFilters({ page })}
                        />
                    </main>
                </div>
            </div>

            <ProductMobileFilterDrawer
                isOpen={isMobileFilterOpen}
                totalItems={totalItems}
                categories={categories}
                filters={filters}
                activeFilterCount={activeFilterCount}
                onClose={() => setIsMobileFilterOpen(false)}
                onUpdateFilters={updateFilters}
                onResetFilters={() => setSearchParams({})}
            />
        </div>
    );
}

export default ProductListPage;