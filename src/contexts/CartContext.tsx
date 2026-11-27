import {
    createContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    type ReactNode,
} from 'react';
import { useAuth } from '../hooks/useAuth';

export interface CartItem {
    id: string;
    product_id: number;
    product_name: string;
    unit: string;
    unit_price: number;
    original_price?: number;     // Giá gốc trước giảm (nếu có ưu đãi lô cận hạn)
    is_near_expiry?: boolean;    // Nhãn lô cận hạn giảm giá
    is_available?: boolean;      // false nếu sản phẩm vừa ngừng bán / hết sạch tồn
    category_note?: string;      // VD: "Bảo quản lạnh 4°C • VietGAP"
    quantity: number;
    image_url?: string;
    available_stock?: number;
}

export interface CartContextType {
    items: CartItem[];
    totalItems: number;
    subTotal: number;
    isLoading: boolean;
    addToCart: (
        product: Omit<CartItem, 'id' | 'quantity'>,
        quantity?: number
    ) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    removeFromCart: (itemId: string) => Promise<void>;
    clearCart: () => void;
    refreshCart: () => Promise<void>;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
const GUEST_CART_KEY = 'farmly_guest_cart';

function readGuestCart(): CartItem[] {
    try {
        const raw = localStorage.getItem(GUEST_CART_KEY);
        return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
        return [];
    }
}

function writeGuestCart(items: CartItem[]) {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, token, user } = useAuth();
    const isCustomer = isAuthenticated && user?.role === 'CUSTOMER';

    const [items, setItems] = useState<CartItem[]>(() => readGuestCart());
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Tải giỏ hàng từ Backend cho CUSTOMER (API #34: GET /api/v1/cart)
    const fetchServerCart = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/cart`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const payload = await res.json();
                const serverItems = (payload.data?.items || payload.items || []) as CartItem[];
                setItems(serverItems);
            }
        } catch {
            // Giữ danh sách hiện tại nếu mất kết nối tạm thời
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    // Gộp giỏ tạm của Khách vãn lai vào tài khoản ngay khi đăng nhập (Bảng 2.2)
    useEffect(() => {
        if (!isCustomer || !token) {
            setItems(readGuestCart());
            return;
        }

        const syncAndLoadCart = async () => {
            const guestItems = readGuestCart();
            if (guestItems.length > 0) {
                for (const item of guestItems) {
                    await fetch(`${API_URL}/cart/items`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            product_id: item.product_id,
                            quantity: item.quantity,
                        }),
                    }).catch(() => { });
                }
                localStorage.removeItem(GUEST_CART_KEY);
            }
            await fetchServerCart();
        };

        syncAndLoadCart();
    }, [isCustomer, token, fetchServerCart]);

    // Thêm sản phẩm vào giỏ (API #35: POST /api/v1/cart/items)
    const addToCart = useCallback(
        async (product: Omit<CartItem, 'id' | 'quantity'>, quantity = 1) => {
            if (quantity <= 0) return;

            if (!isCustomer || !token) {
                setItems((prev) => {
                    const existing = prev.find((i) => i.product_id === product.product_id);
                    const next = existing
                        ? prev.map((i) =>
                            i.product_id === product.product_id
                                ? { ...i, quantity: i.quantity + quantity }
                                : i
                        )
                        : [
                            ...prev,
                            {
                                ...product,
                                id: `guest-${product.product_id}`,
                                quantity,
                            },
                        ];
                    writeGuestCart(next);
                    return next;
                });
                return;
            }

            const res = await fetch(`${API_URL}/cart/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    product_id: product.product_id,
                    quantity,
                }),
            });
            if (res.ok) {
                await fetchServerCart();
            }
        },
        [isCustomer, token, fetchServerCart]
    );

    // Cập nhật số lượng (API #36: PUT /api/v1/cart/items/:itemId)
    const updateQuantity = useCallback(
        async (itemId: string, quantity: number) => {
            if (quantity <= 0) {
                if (!isCustomer || !token) {
                    setItems((prev) => {
                        const next = prev.filter((i) => i.id !== itemId);
                        writeGuestCart(next);
                        return next;
                    });
                    return;
                }
                await fetch(`${API_URL}/cart/items/${itemId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                });
                await fetchServerCart();
                return;
            }

            if (!isCustomer || !token) {
                setItems((prev) => {
                    const next = prev.map((i) => (i.id === itemId ? { ...i, quantity } : i));
                    writeGuestCart(next);
                    return next;
                });
                return;
            }

            const res = await fetch(`${API_URL}/cart/items/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ quantity }),
            });
            if (res.ok) {
                await fetchServerCart();
            }
        },
        [isCustomer, token, fetchServerCart]
    );

    // Xóa sản phẩm khỏi giỏ (API #37: DELETE /api/v1/cart/items/:itemId)
    const removeFromCart = useCallback(
        async (itemId: string) => {
            if (!isCustomer || !token) {
                setItems((prev) => {
                    const next = prev.filter((i) => i.id !== itemId);
                    writeGuestCart(next);
                    return next;
                });
                return;
            }

            const res = await fetch(`${API_URL}/cart/items/${itemId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                await fetchServerCart();
            }
        },
        [isCustomer, token, fetchServerCart]
    );

    const clearCart = useCallback(() => {
        setItems([]);
        localStorage.removeItem(GUEST_CART_KEY);
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
                addToCart,
                updateQuantity,
                removeFromCart,
                clearCart,
                refreshCart: fetchServerCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}