import { Trash2 } from 'lucide-react';

interface CartSelectAllBarProps {
    selectableCount: number;
    selectedCount: number;
    isAllSelected: boolean;
    onToggleAll: () => void;
    onRemoveSelected: () => void;
}

export function CartSelectAllBar({
    selectableCount,
    selectedCount,
    isAllSelected,
    onToggleAll,
    onRemoveSelected,
}: CartSelectAllBarProps) {
    return (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-900/10 bg-white px-4 py-2.5 shadow-2xs">
            <label className="inline-flex min-h-11 items-center gap-3 cursor-pointer select-none">
                <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={onToggleAll}
                    disabled={selectableCount === 0}
                    className="h-5 w-5 rounded-md border-gray-300 text-[#1E462D] focus:ring-[#1E462D]"
                />
                <span className="text-xs sm:text-sm font-bold text-gray-800">
                    Chọn tất cả ({selectableCount} sản phẩm khả dụng)
                </span>
            </label>

            {selectedCount > 0 && (
                <button
                    type="button"
                    onClick={onRemoveSelected}
                    className="inline-flex min-h-11 items-center gap-1.5 px-2.5 text-xs sm:text-sm font-semibold text-red-600 hover:text-red-700 transition"
                >
                    <Trash2 className="h-4 w-4" />
                    <span>Xóa đã chọn ({selectedCount})</span>
                </button>
            )}
        </div>
    );
}