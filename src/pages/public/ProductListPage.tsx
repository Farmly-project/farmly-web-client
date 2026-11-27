import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RotateCcw, PackageSearch } from 'lucide-react';
import type {
    CategoryItem,
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
import { productService } from '../../services/productService';

const ITEMS_PER_PAGE = 20;

export function ProductListPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [products, setProducts] = useState<ProductCardItem[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    const currentPage = Math.max(1, Number(searchParams.get('page')) || 1);
    const activeSearch = searchParams.get('search') || '';
    const sortBy = (searchParams.get('sort') as ProductListQueryParams['sort']) || 'fefo';

    const filters = {
        categoryId: searchParams.get('category_id')
            ? Number(searchParams.get('category_id'))
            : undefined,
        allowSubscription: searchParams.get('allow_subscription') === 'true',
        flashSaleOnly: searchParams.get('flash_sale_only') === 'true',
        inStockOnly: searchParams.get('in_stock_only') === 'true',
        certification: searchParams.get('certification') || '',
        minPrice: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
        maxPrice: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    };

    const activeFilterCount = [
        filters.categoryId,
        filters.allowSubscription,
        filters.flashSaleOnly,
        filters.inStockOnly,
        filters.certification,
        filters.minPrice,
        filters.maxPrice,
        activeSearch,
    ].filter(Boolean).length;

    const updateFilters = (updates: Record<string, string | number | boolean | undefined>) => {
        const next = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, val]) => {
            if (val === undefined || val === '' || val === false) {
                next.delete(key);
            } else {
                next.set(key, String(val));
            }
        });
        if (!('page' in updates)) next.delete('page');
        setSearchParams(next);
    };

    useEffect(() => {
        let isMounted = true;
        productService
            .getCategories()
            .then((data) => {
                if (isMounted && Array.isArray(data)) {
                    setCategories(data.filter((c) => c.is_active !== false));
                }
            })
            .catch(() => { });
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let isMounted = true;
        async function fetchProducts() {
            setIsLoading(true);
            try {
                const res = await productService.getProducts({
                    page: currentPage,
                    limit: ITEMS_PER_PAGE,
                    search: activeSearch || undefined,
                    category_id: filters.categoryId,
                    allow_subscription: filters.allowSubscription || undefined,
                    flash_sale_only: filters.flashSaleOnly || undefined,
                    in_stock_only: filters.inStockOnly || undefined,
                    certification: filters.certification || undefined,
                    min_price: filters.minPrice,
                    max_price: filters.maxPrice,
                    sort: sortBy,
                });

                if (!isMounted) return;
                if (Array.isArray(res)) {
                    setProducts(res);
                    setTotalItems(res.length);
                    setTotalPages(Math.max(1, Math.ceil(res.length / ITEMS_PER_PAGE)));
                } else {
                    setProducts(res.items || []);
                    setTotalItems(res.pagination?.total ?? res.items?.length ?? 0);
                    setTotalPages(Math.max(1, res.pagination?.total_pages ?? 1));
                }
            } catch {
                if (isMounted) {
                    setProducts([]);
                    setTotalItems(0);
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        fetchProducts();
        return () => {
            isMounted = false;
        };
    }, [
        currentPage,
        activeSearch,
        filters.categoryId,
        filters.allowSubscription,
        filters.flashSaleOnly,
        filters.inStockOnly,
        filters.certification,
        filters.minPrice,
        filters.maxPrice,
        sortBy,
    ]);

    const handleAddToCart = async (productId: number) => {
        try {
            await productService.addToCart(productId, 1);
            alert('Đã thêm nông sản vào giỏ hàng!');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Thêm vào giỏ hàng thất bại');
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAF8] text-gray-900 pb-16">
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
                                {[...Array(8)].map((_, idx) => (
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
                                    <ProductCard key={item.id} product={item} onAddToCart={handleAddToCart} />
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
                                    Thử thay đổi từ khóa tìm kiếm hoặc xóa bớt các điều kiện lọc để xem toàn bộ nông
                                    sản thu hoạch hôm nay tại nông trại Farmly.
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