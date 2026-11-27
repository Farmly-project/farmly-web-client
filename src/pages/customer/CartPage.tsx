import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { EmptyCartState } from '../../components/cart/EmptyCartState';
import { GuestCartBanner } from '../../components/cart/GuestCartBanner';
import { CartSelectAllBar } from '../../components/cart/CartSelectAllBar';
import { CartItemCard } from '../../components/cart/CartItemCard';
import { CartOrderSummary } from '../../components/cart/CartOrderSummary';
import { MobileCheckoutBar } from '../../components/cart/MobileCheckoutBar';

export function CartPage() {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const {
        items,
        isLoading,
        error,
        updateQuantity,
        removeFromCart,
        removeManyFromCart,
        refreshCart,
    } = useCart();

    const isCustomer = isAuthenticated && user?.role.toUpperCase() === 'CUSTOMER';

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [busyItemIds, setBusyItemIds] = useState<Record<string, boolean>>({});
    const [actionError, setActionError] = useState<string | null>(null);

    // Luôn gọi GET /api/v1/cart khi vào trang để cập nhật tồn khả dụng FEFO & giá mới nhất
    useEffect(() => {
        refreshCart();
    }, [refreshCart]);

    // Tự động chọn các sản phẩm khả dụng
    useEffect(() => {
        setSelectedIds((prev) => {
            const validIds = items
                .filter(
                    (item) =>
                        item.is_available !== false &&
                        (item.available_stock === undefined || item.available_stock > 0)
                )
                .map((item) => item.id);

            if (prev.length === 0) return validIds;
            const kept = prev.filter((id) => validIds.includes(id));
            const newlyAdded = validIds.filter((id) => !prev.includes(id));
            return [...kept, ...newlyAdded];
        });
    }, [items]);

    const selectableItems = useMemo(
        () =>
            items.filter(
                (item) =>
                    item.is_available !== false &&
                    (item.available_stock === undefined || item.available_stock > 0)
            ),
        [items]
    );

    const isAllSelected =
        selectableItems.length > 0 &&
        selectableItems.every((item) => selectedIds.includes(item.id));

    const selectedItems = useMemo(
        () => selectableItems.filter((item) => selectedIds.includes(item.id)),
        [selectableItems, selectedIds]
    );

    const { selectedCount, selectedSubTotal, totalSaved } = useMemo(() => {
        return selectedItems.reduce(
            (acc, item) => {
                const lineTotal = item.unit_price * item.quantity;
                const savedPerUnit =
                    item.original_price && item.original_price > item.unit_price
                        ? item.original_price - item.unit_price
                        : 0;

                acc.selectedCount += item.quantity;
                acc.selectedSubTotal += lineTotal;
                acc.totalSaved += savedPerUnit * item.quantity;
                return acc;
            },
            { selectedCount: 0, selectedSubTotal: 0, totalSaved: 0 }
        );
    }, [selectedItems]);

    const hasStockIssue = useMemo(
        () =>
            selectedItems.some(
                (item) =>
                    item.available_stock !== undefined &&
                    item.quantity > item.available_stock
            ),
        [selectedItems]
    );

    const handleToggleAll = () => {
        setSelectedIds(isAllSelected ? [] : selectableItems.map((i) => i.id));
    };

    const handleToggleItem = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleChangeQuantity = async (
        itemId: string,
        newQty: number,
        maxStock?: number
    ) => {
        if (newQty < 1) return;
        if (maxStock !== undefined && newQty > maxStock) return;

        setActionError(null);
        setBusyItemIds((prev) => ({ ...prev, [itemId]: true }));
        try {
            await updateQuantity(itemId, newQty);
        } catch (err) {
            setActionError(
                err instanceof Error ? err.message : 'Không thể cập nhật số lượng.'
            );
        } finally {
            setBusyItemIds((prev) => ({ ...prev, [itemId]: false }));
        }
    };

    const handleRemoveSingle = async (itemId: string) => {
        setActionError(null);
        setBusyItemIds((prev) => ({ ...prev, [itemId]: true }));
        try {
            await removeFromCart(itemId);
            setSelectedIds((prev) => prev.filter((id) => id !== itemId));
        } catch (err) {
            setActionError(
                err instanceof Error ? err.message : 'Không thể xóa sản phẩm khỏi giỏ.'
            );
        } finally {
            setBusyItemIds((prev) => ({ ...prev, [itemId]: false }));
        }
    };

    const handleRemoveSelected = async () => {
        if (selectedIds.length === 0) return;
        setActionError(null);
        try {
            await removeManyFromCart(selectedIds);
            setSelectedIds([]);
        } catch (err) {
            setActionError(
                err instanceof Error ? err.message : 'Không thể xóa các mục đã chọn.'
            );
        }
    };

    const handleProceedCheckout = () => {
        if (selectedItems.length === 0 || hasStockIssue) return;

        if (!isCustomer) {
            navigate('/login', { state: { from: '/checkout' } });
            return;
        }

        navigate('/checkout', {
            state: {
                selectedItemIds: selectedIds,
                selectedItems,
            },
        });
    };

    if (isLoading && items.length === 0) {
        return (
            <div className="min-h-screen bg-[#F3F8F3] px-4 py-8">
                <div className="mx-auto max-w-6xl animate-pulse space-y-6">
                    <div className="h-8 w-56 rounded-xl bg-gray-200" />
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        <div className="space-y-3.5 lg:col-span-8">
                            <div className="h-14 rounded-2xl bg-white" />
                            <div className="h-32 rounded-2xl bg-white" />
                            <div className="h-32 rounded-2xl bg-white" />
                        </div>
                        <div className="h-80 rounded-3xl bg-white lg:col-span-4" />
                    </div>
                </div>
            </div>
        );
    }

    if (!isLoading && items.length === 0 && !error) {
        return <EmptyCartState />;
    }

    return (
        <div className="min-h-screen bg-[#F3F8F3] pb-28 lg:pb-12">
            <div className="mx-auto max-w-6xl px-4 pt-5 sm:pt-8">
                {/* Breadcrumb */}
                <nav
                    aria-label="Breadcrumb"
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-500"
                >
                    <Link to="/" className="transition hover:text-[#1B4332]">
                        Trang chủ
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                    <span className="font-semibold text-gray-800">Giỏ hàng</span>
                </nav>

                {/* Tiêu đề trang */}
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-[28px]">
                            Giỏ hàng của bạn
                        </h1>
                        <span className="rounded-full bg-[#DDF2E2] px-3 py-1 text-xs font-bold text-[#1B4332]">
                            {items.length} mặt hàng
                        </span>
                    </div>

                    <Link
                        to="/products"
                        className="inline-flex min-h-11 items-center gap-1.5 text-xs font-bold text-[#1B4332] transition hover:text-emerald-700 sm:text-sm"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Tiếp tục mua sắm</span>
                    </Link>
                </div>

                {/* Banner dành cho Khách vãn lai */}
                {!isCustomer && <GuestCartBanner />}

                {/* Thông báo lỗi gọi API nếu có */}
                {(error || actionError) && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 sm:text-sm">
                        <div className="flex items-center gap-2 font-medium">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{actionError || error}</span>
                        </div>
                        {error && (
                            <button
                                type="button"
                                onClick={refreshCart}
                                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100/50"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span>Tải lại</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Bố cục chính 2 cột */}
                <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                    <div className="space-y-3.5 lg:col-span-8">
                        <CartSelectAllBar
                            selectableCount={selectableItems.length}
                            selectedCount={selectedIds.length}
                            isAllSelected={isAllSelected}
                            onToggleAll={handleToggleAll}
                            onRemoveSelected={handleRemoveSelected}
                        />

                        {items.map((item) => (
                            <CartItemCard
                                key={item.id}
                                item={item}
                                isChecked={selectedIds.includes(item.id)}
                                isBusy={Boolean(busyItemIds[item.id])}
                                onToggle={handleToggleItem}
                                onChangeQuantity={handleChangeQuantity}
                                onRemove={handleRemoveSingle}
                            />
                        ))}
                    </div>

                    <CartOrderSummary
                        selectedCount={selectedCount}
                        selectedSubTotal={selectedSubTotal}
                        totalSaved={totalSaved}
                        hasSelectedItems={selectedItems.length > 0}
                        hasStockIssue={hasStockIssue}
                        isCustomer={isCustomer}
                        onProceedCheckout={handleProceedCheckout}
                    />
                </div>
            </div>

            <MobileCheckoutBar
                selectedCount={selectedCount}
                selectedSubTotal={selectedSubTotal}
                hasSelectedItems={selectedItems.length > 0}
                hasStockIssue={hasStockIssue}
                isCustomer={isCustomer}
                onProceedCheckout={handleProceedCheckout}
            />
        </div>
    );
}

export default CartPage;