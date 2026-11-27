import { apiFetch } from './apiClient';
import type {
    ShippingQuote,
    CreateOrderPayload,
    CreatedOrderResponse,
} from '../types/order.types';
const GUEST_TOKEN_KEY = 'farmly_guest_token';
import type { OrderDetailData } from '../types/order.types';
export function getOrCreateGuestToken(): string {
    let token = localStorage.getItem(GUEST_TOKEN_KEY);
    if (!token) {
        token =
            typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(GUEST_TOKEN_KEY, token);
    }
    return token;
}

export function clearGuestToken(): void {
    localStorage.removeItem(GUEST_TOKEN_KEY);
}

export const orderService = {
    // API #34: GET /api/v1/cart (lấy giỏ theo account JWT hoặc guest_token)
    getCart: (isAuthenticated: boolean) =>
        apiFetch<unknown>('/cart', {
            params: isAuthenticated ? undefined : { guest_token: getOrCreateGuestToken() },
        }),

    // API #35: POST /api/v1/cart/items
    addCartItem: (productId: number, quantity: number, isAuthenticated: boolean) =>
        apiFetch<unknown>('/cart/items', {
            method: 'POST',
            body: JSON.stringify({
                product_id: productId,
                quantity,
                ...(isAuthenticated ? {} : { guest_token: getOrCreateGuestToken() }),
            }),
        }),

    // API #36: PUT /api/v1/cart/items/:itemId
    updateCartItem: (itemId: string, quantity: number, isAuthenticated: boolean) =>
        apiFetch<unknown>(`/cart/items/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({
                quantity,
                ...(isAuthenticated ? {} : { guest_token: getOrCreateGuestToken() }),
            }),
        }),

    // API #37: DELETE /api/v1/cart/items/:itemId
    deleteCartItem: (itemId: string, isAuthenticated: boolean) =>
        apiFetch<unknown>(`/cart/items/${itemId}`, {
            method: 'DELETE',
            params: isAuthenticated ? undefined : { guest_token: getOrCreateGuestToken() },
        }),
};
export const checkoutOrderService = {
    // API #41: POST /api/v1/orders/calculate-shipping (UC17)
    calculateShipping: (payload: {
        address_id: number;
        province?: string;
        district?: string;
        ward?: string;
        total_items: number;
    }) =>
        apiFetch<ShippingQuote>('/orders/calculate-shipping', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    // API #38: POST /api/v1/cart/checkout (UC06)
    checkoutFromCart: (payload: CreateOrderPayload) =>
        apiFetch<CreatedOrderResponse>('/cart/checkout', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    // API #39: POST /api/v1/orders (Dự phòng khi đặt trực tiếp danh sách chọn)
    createOrder: (payload: CreateOrderPayload) =>
        apiFetch<CreatedOrderResponse>('/orders', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
};
export const customerOrderApi = {
    // API #40: GET /api/v1/orders/my-orders (UC13)
    getMyOrders: (status?: string) =>
        apiFetch<unknown>('/orders/my-orders', {
            params: status && status !== 'ALL' ? { status } : undefined,
        }),

    // API #43: GET /api/v1/orders/:id (Chi tiết đơn + lô FEFO order_details)
    getOrderById: (id: string | number) =>
        apiFetch<OrderDetailData>(`/orders/${id}`),

    // API #46: PATCH /api/v1/orders/:id/cancel (Hủy đơn khi còn pending)
    cancelOrder: (id: string | number, reason?: string) =>
        apiFetch<OrderDetailData>(`/orders/${id}/cancel`, {
            method: 'PATCH',
            body: JSON.stringify(reason ? { reason } : {}),
        }),
};