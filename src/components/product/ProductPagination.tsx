import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function ProductPagination({
    currentPage,
    totalPages,
    onPageChange,
}: ProductPaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-1.5 pt-4">
            <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                aria-label="Trang trước"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
                <ChevronLeft className="h-4 w-4" />
            </button>

            {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                const active = pageNum === currentPage;
                return (
                    <button
                        key={pageNum}
                        type="button"
                        onClick={() => onPageChange(pageNum)}
                        className={`flex h-11 w-11 items-center justify-center rounded-xl text-xs font-bold transition ${active
                            ? 'bg-[#1B5E20] text-white shadow-sm'
                            : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {pageNum}
                    </button>
                );
            })}

            <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                aria-label="Trang sau"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
}