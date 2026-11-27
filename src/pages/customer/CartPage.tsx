import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
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
    const { items, isLoading, updateQuantity, removeFromCart } = useCart();

    const isCustomer = isAuthenticated && user?.role === 'CUSTOMER';

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [busyItemIds, setBusyItemIds] = useState<Record<string, boolean>>({});

    // Tự động chọn các sản phẩm khả dụng khi dữ liệu giỏ hàng thay đổi
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

        setBusyItemIds((prev) => ({ ...prev, [itemId]: true }));
        try {
            await updateQuantity(itemId, newQty);
        } finally {
            setBusyItemIds((prev) => ({ ...prev, [itemId]: false }));
        }
    };

    const handleRemoveSingle = async (itemId: string) => {
        setBusyItemIds((prev) => ({ ...prev, [itemId]: true }));
        try {
            await removeFromCart(itemId);
            setSelectedIds((prev) => prev.filter((id) => id !== itemId));
        } finally {
            setBusyItemIds((prev) => ({ ...prev, [itemId]: false }));
        }
    };

    const handleRemoveSelected = async () => {
        if (selectedIds.length === 0) return;
        const targets = [...selectedIds];
        for (const id of targets) {
            await removeFromCart(id);
        }
        setSelectedIds([]);
    };

    const handleProceedCheckout = () => {
        if (selectedItems.length === 0 || hasStockIssue) return;

        if (!isCustomer) {
            navigate('/login', { state: { from: '/checkout' } });
            return;
        }

        navigate('/checkout', { state: { selectedItemIds: selectedIds } });
    };

    if (!isLoading && items.length === 0) {
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
                    <Link to="/" className="hover:text-[#1B4332] transition">
                        Trang chủ
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                    <span className="font-semibold text-gray-800">Giỏ hàng</span>
                </nav>

                {/* Tiêu đề trang */}
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-gray-900">
                            Giỏ hàng của bạn
                        </h1>
                        <span className="rounded-full bg-[#DDF2E2] px-3 py-1 text-xs font-bold text-[#1B4332]">
                            {items.length} mặt hàng
                        </span>
                    </div>

                    <Link
                        to="/products"
                        className="inline-flex min-h-11 items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1B4332] hover:text-emerald-700 transition"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Tiếp tục mua sắm</span>
                    </Link>
                </div>

                {/* Banner dành cho Khách vãn lai */}
                {!isCustomer && <GuestCartBanner />}

                {/* Bố cục chính 2 cột */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Cột trái: Thanh chọn tất cả + Danh sách thẻ sản phẩm */}
                    <div className="lg:col-span-8 space-y-3.5">
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

                    {/* Cột phải: Tóm tắt đơn hàng */}
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

            {/* Thanh đặt hàng ghim đáy màn hình Mobile */}
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