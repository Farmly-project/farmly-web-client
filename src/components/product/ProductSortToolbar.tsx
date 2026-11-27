import { SlidersHorizontal, X } from 'lucide-react';
import type { ProductListQueryParams } from '../../types/product.types';
import type { ProductFilterState } from './ProductFilterPanel';
import { formatCurrency } from '../../utils/formatters';

const SORT_OPTIONS: Array<{ value: NonNullable<ProductListQueryParams['sort']>; label: string }> = [
    { value: 'fefo', label: 'Ưu tiên lô cận hạn (FEFO)' },
    { value: 'newest', label: 'Mới thu hoạch hôm nay' },
    { value: 'price_asc', label: 'Giá: Thấp đến Cao' },
    { value: 'price_desc', label: 'Giá: Cao đến Thấp' },
    { value: 'rating_desc', label: 'Đánh giá cao nhất' },
];

interface ProductSortToolbarProps {
    shownCount: number;
    totalItems: number;
    sortBy: NonNullable<ProductListQueryParams['sort']>;
    activeSearch: string;
    filters: ProductFilterState;
    activeFilterCount: number;
    onOpenMobileFilter: () => void;
    onUpdateFilters: (updates: Record<string, string | number | boolean | undefined>) => void;
}

export function ProductSortToolbar({
    shownCount,
    totalItems,
    sortBy,
    activeSearch,
    filters,
    activeFilterCount,
    onOpenMobileFilter,
    onUpdateFilters,
}: ProductSortToolbarProps) {
    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onOpenMobileFilter}
                        className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-emerald-200 bg-[#E8F5E9] px-3.5 text-xs font-bold text-[#1B5E20] lg:hidden"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        Bộ lọc
                        {activeFilterCount > 0 && (
                            <span className="rounded-full bg-[#1B5E20] px-1.5 py-0.5 text-[10px] text-white">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    <span className="text-xs sm:text-sm text-gray-600">
                        Hiển thị <strong className="text-gray-900">{shownCount}</strong> /{' '}
                        <strong className="text-gray-900">{totalItems}</strong> nông sản
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <label htmlFor="sort-select" className="hidden sm:inline text-xs text-gray-500">
                        Sắp xếp:
                    </label>
                    <select
                        id="sort-select"
                        value={sortBy}
                        onChange={(e) => onUpdateFilters({ sort: e.target.value })}
                        className="h-11 rounded-xl border border-gray-200 bg-[#F8FAF8] px-3 text-xs font-bold text-gray-800 focus:border-[#1B5E20] focus:outline-none"
                    >
                        {SORT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Active Filter Chips */}
            {activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    {activeSearch && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-semibold text-[#1B5E20]">
                            Từ khóa: "{activeSearch}"
                            <button type="button" onClick={() => onUpdateFilters({ search: undefined })}>
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </span>
                    )}
                    {filters.allowSubscription && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-semibold text-[#1B5E20]">
                            Có gói định kỳ
                            <button
                                type="button"
                                onClick={() => onUpdateFilters({ allow_subscription: undefined })}
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </span>
                    )}
                    {filters.flashSaleOnly && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                            Xả kho cận hạn
                            <button type="button" onClick={() => onUpdateFilters({ flash_sale_only: undefined })}>
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </span>
                    )}
                    {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-semibold text-[#1B5E20]">
                            Giá: {filters.minPrice ? formatCurrency(filters.minPrice) : '0đ'} –{' '}
                            {filters.maxPrice ? formatCurrency(filters.maxPrice) : 'Trở lên'}
                            <button
                                type="button"
                                onClick={() => onUpdateFilters({ min_price: undefined, max_price: undefined })}
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}