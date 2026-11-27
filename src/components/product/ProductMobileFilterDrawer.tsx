import { X } from 'lucide-react';
import type { CategoryItem } from '../../types/product.types';
import { ProductFilterPanel, type ProductFilterState } from './ProductFilterPanel';

interface ProductMobileFilterDrawerProps {
    isOpen: boolean;
    totalItems: number;
    categories: CategoryItem[];
    filters: ProductFilterState;
    activeFilterCount: number;
    onClose: () => void;
    onUpdateFilters: (updates: Record<string, string | number | boolean | undefined>) => void;
    onResetFilters: () => void;
}

export function ProductMobileFilterDrawer({
    isOpen,
    totalItems,
    categories,
    filters,
    activeFilterCount,
    onClose,
    onUpdateFilters,
    onResetFilters,
}: ProductMobileFilterDrawerProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 lg:hidden">
            <div className="flex h-full w-full max-w-xs flex-col bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3.5">
                    <span className="text-sm font-extrabold text-gray-900">Bộ lọc nông sản</span>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Đóng bộ lọc"
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <ProductFilterPanel
                        categories={categories}
                        filters={filters}
                        activeFilterCount={activeFilterCount}
                        onUpdateFilters={onUpdateFilters}
                        onResetFilters={onResetFilters}
                    />
                </div>

                <div className="border-t border-gray-200 p-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-12 w-full rounded-xl bg-[#1B5E20] text-sm font-bold text-white"
                    >
                        Áp dụng bộ lọc ({totalItems} sản phẩm)
                    </button>
                </div>
            </div>
        </div>
    );
}