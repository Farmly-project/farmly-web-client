import { CalendarSync, Flame, ShieldCheck, RotateCcw } from 'lucide-react';
import type { CategoryItem } from '../../types/product.types';

const PRICE_PRESETS = [
    { label: 'Dưới 30.000đ', min: undefined, max: 30000 },
    { label: '30.000đ – 50.000đ', min: 30000, max: 50000 },
    { label: 'Trên 50.000đ', min: 50000, max: undefined },
];

const CERTIFICATIONS = ['VietGAP', 'GlobalGAP', 'USDA Organic'];

export interface ProductFilterState {
    categoryId?: number;
    allowSubscription: boolean;
    flashSaleOnly: boolean;
    inStockOnly: boolean;
    certification: string;
    minPrice?: number;
    maxPrice?: number;
}

interface ProductFilterPanelProps {
    categories: CategoryItem[];
    filters: ProductFilterState;
    activeFilterCount: number;
    onUpdateFilters: (updates: Record<string, string | number | boolean | undefined>) => void;
    onResetFilters: () => void;
}

export function ProductFilterPanel({
    categories,
    filters,
    activeFilterCount,
    onUpdateFilters,
    onResetFilters,
}: ProductFilterPanelProps) {
    return (
        <div className="space-y-6">
            {/* Danh mục */}
            <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-800 mb-3">
                    Danh mục nông sản
                </h3>
                <div className="space-y-1.5">
                    <button
                        type="button"
                        onClick={() => onUpdateFilters({ category_id: undefined })}
                        className={`flex w-full min-h-11 items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition ${!filters.categoryId
                            ? 'bg-[#E8F5E9] font-bold text-[#1B5E20]'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <span>Tất cả nông sản</span>
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => onUpdateFilters({ category_id: cat.id })}
                            className={`flex w-full min-h-11 items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition ${filters.categoryId === cat.id
                                ? 'bg-[#E8F5E9] font-bold text-[#1B5E20]'
                                : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <span>{cat.name}</span>
                            {cat.product_count !== undefined && (
                                <span className="text-xs text-gray-400">({cat.product_count})</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <hr className="border-gray-100" />

            {/* Ưu đãi & FEFO */}
            <div className="space-y-2.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-800">
                    Ưu đãi & Lô hàng FEFO
                </h3>

                <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-gray-200 bg-[#F8FAF8] px-3 py-2 hover:border-emerald-300">
                    <input
                        type="checkbox"
                        checked={filters.allowSubscription}
                        onChange={(e) => onUpdateFilters({ allow_subscription: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-[#1B5E20] focus:ring-[#1B5E20]"
                    />
                    <CalendarSync className="h-4 w-4 text-[#1B5E20] shrink-0" />
                    <span className="text-xs font-semibold text-gray-800">Hỗ trợ Gói định kỳ (-15%)</span>
                </label>

                <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-red-100 bg-red-50/40 px-3 py-2 hover:border-red-300">
                    <input
                        type="checkbox"
                        checked={filters.flashSaleOnly}
                        onChange={(e) => onUpdateFilters({ flash_sale_only: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-600"
                    />
                    <Flame className="h-4 w-4 text-red-600 shrink-0" />
                    <span className="text-xs font-semibold text-red-700">Xả kho cận hạn (Flash Sale)</span>
                </label>

                <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-gray-200 bg-[#F8FAF8] px-3 py-2 hover:border-emerald-300">
                    <input
                        type="checkbox"
                        checked={filters.inStockOnly}
                        onChange={(e) => onUpdateFilters({ in_stock_only: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-[#1B5E20] focus:ring-[#1B5E20]"
                    />
                    <span className="text-xs font-semibold text-gray-800">Chỉ hiện nông sản còn hàng</span>
                </label>
            </div>

            <hr className="border-gray-100" />

            {/* Chứng nhận */}
            <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-800 mb-3">
                    Chứng nhận kiểm định
                </h3>
                <div className="flex flex-wrap gap-2">
                    {CERTIFICATIONS.map((cert) => {
                        const active = filters.certification === cert;
                        return (
                            <button
                                key={cert}
                                type="button"
                                onClick={() => onUpdateFilters({ certification: active ? undefined : cert })}
                                className={`inline-flex h-10 items-center gap-1 rounded-full border px-3 text-xs font-bold transition ${active
                                    ? 'border-[#1B5E20] bg-[#1B5E20] text-white'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-400'
                                    }`}
                            >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                {cert}
                            </button>
                        );
                    })}
                </div>
            </div>

            <hr className="border-gray-100" />

            {/* Khoảng giá */}
            <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-800 mb-3">
                    Khoảng giá
                </h3>
                <div className="space-y-2">
                    {PRICE_PRESETS.map((preset) => {
                        const isSelected =
                            filters.minPrice === preset.min && filters.maxPrice === preset.max;
                        return (
                            <button
                                key={preset.label}
                                type="button"
                                onClick={() =>
                                    onUpdateFilters(
                                        isSelected
                                            ? { min_price: undefined, max_price: undefined }
                                            : { min_price: preset.min, max_price: preset.max }
                                    )
                                }
                                className={`flex w-full min-h-11 items-center rounded-xl border px-3 py-2 text-xs font-semibold transition ${isSelected
                                    ? 'border-[#1B5E20] bg-[#E8F5E9] text-[#1B5E20]'
                                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {preset.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {activeFilterCount > 0 && (
                <button
                    type="button"
                    onClick={onResetFilters}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Xóa tất cả bộ lọc ({activeFilterCount})
                </button>
            )}
        </div>
    );
}