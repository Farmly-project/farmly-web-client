import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Leaf, Flame } from 'lucide-react';
import type { CategoryItem } from '../../types/product.types';

interface ProductSearchBannerProps {
    categories: CategoryItem[];
    activeSearch: string;
    selectedCategoryId?: number;
    flashSaleOnly: boolean;
    onSearchSubmit: (keyword: string | undefined) => void;
    onSelectCategory: (categoryId: number | undefined, flashSale?: boolean) => void;
}

export function ProductSearchBanner({
    categories,
    activeSearch,
    selectedCategoryId,
    flashSaleOnly,
    onSearchSubmit,
    onSelectCategory,
}: ProductSearchBannerProps) {
    const [searchInput, setSearchInput] = useState(activeSearch);
    const [warning, setWarning] = useState<string | null>(null);

    useEffect(() => {
        setSearchInput(activeSearch);
    }, [activeSearch]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = searchInput.trim();
        if (trimmed.length > 100) {
            setWarning('Từ khóa tìm kiếm tối đa 100 ký tự.');
            return;
        }
        if (trimmed.length > 0 && /^[^a-zA-Z0-9\u00C0-\u1EF9]+$/.test(trimmed)) {
            setWarning('Vui lòng nhập chữ cái hoặc số để tìm kiếm nông sản.');
            return;
        }
        setWarning(null);
        onSearchSubmit(trimmed || undefined);
    };

    return (
        <div className="border-b border-emerald-100 bg-[#F1F8E9]">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
                <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                    <Link to="/" className="hover:text-[#1B5E20]">
                        Trang chủ
                    </Link>
                    <span>/</span>
                    <span className="font-semibold text-[#1B5E20]">Tất cả sản phẩm</span>
                </nav>

                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#1B5E20] mb-2">
                            <Leaf className="h-3.5 w-3.5" />
                            Single-Origin • Nông trại Lạc Dương, Lâm Đồng
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                            Tất Cả Nông Sản Tươi Sạch
                        </h1>
                        <p className="mt-1 text-xs sm:text-sm text-gray-600">
                            Minh bạch 100% mã lô thu hoạch, hạn sử dụng FEFO và nhật ký canh tác thực địa.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="w-full md:w-96">
                        <div className="relative flex items-center">
                            <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Tìm rau củ (có dấu hoặc không dấu)..."
                                className="h-11 w-full rounded-full border border-emerald-200 bg-white pl-10 pr-20 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:border-[#1B5E20] focus:outline-none focus:ring-2 focus:ring-[#1B5E20]/20"
                            />
                            {searchInput && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchInput('');
                                        setWarning(null);
                                        onSearchSubmit(undefined);
                                    }}
                                    aria-label="Xóa từ khóa"
                                    className="absolute right-16 p-1 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                            <button
                                type="submit"
                                className="absolute right-1.5 h-8 rounded-full bg-[#1B5E20] px-3.5 text-xs font-bold text-white hover:bg-emerald-900 transition"
                            >
                                Tìm
                            </button>
                        </div>
                        {warning && <p className="mt-1 text-xs font-medium text-red-600">{warning}</p>}
                    </form>
                </div>

                {/* Thanh danh mục nhanh */}
                <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <button
                        type="button"
                        onClick={() => onSelectCategory(undefined, false)}
                        className={`h-11 shrink-0 rounded-full px-4 text-xs font-bold transition ${!selectedCategoryId && !flashSaleOnly
                                ? 'bg-[#1B5E20] text-white shadow-sm'
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-400'
                            }`}
                    >
                        Tất cả
                    </button>

                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => onSelectCategory(cat.id, false)}
                            className={`h-11 shrink-0 rounded-full px-4 text-xs font-bold transition ${selectedCategoryId === cat.id && !flashSaleOnly
                                    ? 'bg-[#1B5E20] text-white shadow-sm'
                                    : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-400'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}

                    <button
                        type="button"
                        onClick={() => onSelectCategory(selectedCategoryId, !flashSaleOnly)}
                        className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-bold transition ${flashSaleOnly
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                            }`}
                    >
                        <Flame className="h-3.5 w-3.5" />
                        Xả kho cận hạn (Flash Sale)
                    </button>
                </div>
            </div>
        </div>
    );
}