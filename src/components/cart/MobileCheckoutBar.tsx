import { ArrowRight } from 'lucide-react';
import { formatVND } from '../../utils/formatters';

interface MobileCheckoutBarProps {
    selectedCount: number;
    selectedSubTotal: number;
    hasSelectedItems: boolean;
    hasStockIssue: boolean;
    isCustomer: boolean;
    onProceedCheckout: () => void;
}

export function MobileCheckoutBar({
    selectedCount,
    selectedSubTotal,
    hasSelectedItems,
    hasStockIssue,
    isCustomer,
    onProceedCheckout,
}: MobileCheckoutBarProps) {
    return (
        <div className="fixed bottom-0 inset-x-0 z-30 border-t border-emerald-900/10 bg-white/95 backdrop-blur-xs px-4 py-3 shadow-lg lg:hidden">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] font-medium text-gray-500 truncate">
                        Tổng tạm tính ({selectedCount} SP)
                    </p>
                    <p className="text-lg font-extrabold text-[#1B4332] leading-tight">
                        {formatVND(selectedSubTotal)}
                    </p>
                </div>

                <button
                    type="button"
                    disabled={!hasSelectedItems || hasStockIssue}
                    onClick={onProceedCheckout}
                    className="inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#1E462D] px-5 text-sm font-bold text-white hover:bg-[#163622] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span>
                        {isCustomer ? `Đặt hàng (${selectedCount})` : 'Đăng nhập đặt hàng'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}