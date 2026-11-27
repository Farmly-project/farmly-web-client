import {
    createContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    type ReactNode,
} from 'react';
import { useAuth } from '../hooks/useAuth';
import {
    orderService,
    clearGuestToken,
} from '../services/orderService';

export interface CartItem {
    id: string; // cart_item_id từ bảng cart_items
    product_id: number;
    product_name: string;
    unit: string;
    unit_price: number;
    original_price?: number | null;
    quantity: number;
    image_url?: string | null;
    available_stock?: number;
    is_available?: boolean;
    is_near_expiry_deal?: boolean;
}

export interface AddToCartPayload {
    product_id: number;
    product_name?: string;
    unit?: string;
    unit_price?: number;
    original_price?: number | null;
    image_url?: string | null;
    available_stock?: number;
    is_available?: boolean;
    is_near_expiry_deal?: boolean;
}

export interface CartContextType {
    items: CartItem[];
    totalItems: number;
    subTotal: number;
    isLoading: boolean;
    error: string | null;
    addToCart: (product: AddToCartPayload, quantity?: number) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    removeFromCart: (itemId: string) => Promise<void>;
    removeManyFromCart: (itemIds: string[]) => Promise<void>;
    clearCart: () => void;
    refreshCart: () => Promise<void>;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

// Ánh xạ dữ liệu trả về từ API #34 (GET /api/v1/cart)
function mapApiCartItems(rawPayload: unknown): CartItem[] {
    const root = (rawPayload as { data?: unknown })?.data ?? rawPayload;
    const list = Array.isArray(root)
        ? root
        : Array.isArray((root as { items?: unknown[] })?.items)
            ? (root as { items: unknown[] }).items
            : [];

    return list.map((row: any) => {
        const product = row.product ?? {};
        const fefoBatch = product.fefo_batch ?? row.fefo_batch ?? null;

        const unitPrice = Number(
            row.unit_price ??
            fefoBatch?.flash_sale_price ??
            product.sale_price ??
            product.base_price ??
            0
        );
        const basePrice = Number(
            row.original_price ?? product.base_price ?? unitPrice
        );

        return {
            id: String(row.id ?? row.cart_item_id),
            product_id: Number(row.product_id ?? product.id),
            product_name: String(row.product_name ?? product.name ?? 'Nông sản Farmly'),
            unit: String(row.unit ?? product.unit ?? 'phần'),
            unit_price: unitPrice,
            original_price: basePrice > unitPrice ? basePrice : null,
            quantity: Number(row.quantity ?? 1),
            image_url:
                row.image_url ??
                row.primary_image_url ??
                row.primary_image ??
                product.primary_image_url ??
                product.primary_image ??
                null,
            available_stock:
                row.available_stock !== undefined
                    ? Number(row.available_stock)
                    : row.available_quantity !== undefined
                        ? Number(row.available_quantity)
                        : product.available_stock !== undefined
                            ? Number(product.available_stock)
                            : product.available_quantity !== undefined
                                ? Number(product.available_quantity)
                                : undefined,
            is_available:
                row.is_available !== undefined
                    ? Boolean(row.is_available)
                    : product.is_active !== undefined
                        ? Boolean(product.is_active)
                        : true,
            is_near_expiry_deal: Boolean(
                row.is_near_expiry_deal ??
                product.is_near_expiry_deal ??
                basePrice > unitPrice
            ),
        };
    });
}

export function CartProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, user } = useAuth();
    const isCustomer = isAuthenticated && user?.role.toUpperCase() === 'CUSTOMER';

    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // API #34: GET /api/v1/cart
    const refreshCart = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await orderService.getCart(isCustomer);
            setItems(mapApiCartItems(res));
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Không thể tải dữ liệu giỏ hàng.'
            );
        } finally {
            setIsLoading(false);
        }
    }, [isCustomer]);

    // Đồng bộ giỏ vãn lai (nếu có guest_token) vào tài khoản khi đăng nhập và tải giỏ từ API
    useEffect(() => {
        let isMounted = true;

        async function initCart() {
            const hadGuestToken = Boolean(localStorage.getItem('farmly_guest_token'));

            if (isCustomer && hadGuestToken) {
                try {
                    const guestRes = await orderService.getCart(false);
                    const guestItems = mapApiCartItems(guestRes);
                    for (const item of guestItems) {
                        await orderService.addCartItem(item.product_id, item.quantity, true);
                    }
                    clearGuestToken();
                } catch {
                    // Bỏ qua nếu giỏ tạm trống hoặc đã gộp trước đó
                }
            }

            if (isMounted) {
                await refreshCart();
            }
        }

        initCart();
        return () => {
            isMounted = false;
        };
    }, [isCustomer, refreshCart]);

    // API #35: POST /api/v1/cart/items
    const addToCart = useCallback(
        async (product: AddToCartPayload, quantity = 1) => {
            if (quantity <= 0) return;
            await orderService.addCartItem(product.product_id, quantity, isCustomer);
            await refreshCart();
        },
        [isCustomer, refreshCart]
    );

    // API #36: PUT /api/v1/cart/items/:itemId
    const updateQuantity = useCallback(
        async (itemId: string, quantity: number) => {
            if (quantity <= 0) {
                await orderService.deleteCartItem(itemId, isCustomer);
            } else {
                await orderService.updateCartItem(itemId, quantity, isCustomer);
            }
            await refreshCart();
        },
        [isCustomer, refreshCart]
    );

    // API #37: DELETE /api/v1/cart/items/:itemId
    const removeFromCart = useCallback(
        async (itemId: string) => {
            await orderService.deleteCartItem(itemId, isCustomer);
            await refreshCart();
        },
        [isCustomer, refreshCart]
    );

    const removeManyFromCart = useCallback(
        async (itemIds: string[]) => {
            if (itemIds.length === 0) return;
            await Promise.all(
                itemIds.map((id) => orderService.deleteCartItem(id, isCustomer))
            );
            await refreshCart();
        },
        [isCustomer, refreshCart]
    );

    const clearCart = useCallback(() => {
        setItems([]);
        clearGuestToken();
    }, []);

    const totalItems = useMemo(
        () => items.reduce((sum, item) => sum + item.quantity, 0),
        [items]
    );

    const subTotal = useMemo(
        () => items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0),
        [items]
    );

    return (
        <CartContext.Provider
            value={{
                items,
                totalItems,
                subTotal,
                isLoading,
                error,
                addToCart,
                updateQuantity,
                removeFromCart,
                removeManyFromCart,
                clearCart,
                refreshCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}