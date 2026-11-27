import { apiFetch } from './apiClient';
import type {
    SubscriptionRecord,
    CreateSubscriptionPayload,
} from '../types/subscription.types';

export const subscriptionService = {
    // API #51: POST /api/v1/subscriptions (UC02 - Đăng ký gói định kỳ)
    createSubscription: (payload: CreateSubscriptionPayload) =>
        apiFetch<{
            id: number;
            subscription?: SubscriptionRecord;
            checkout_url?: string;
        }>('/subscriptions', {
            method: 'POST',
            body: JSON.stringify({
                ...payload,
                delivery_days: payload.delivery_days,
                items: payload.items.map((item) => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                })),
            }),
        }),

    // API #52: GET /api/v1/subscriptions/my-subscriptions
    getMySubscriptions: () =>
        apiFetch<SubscriptionRecord[]>('/subscriptions/my-subscriptions'),

    // API #54: GET /api/v1/subscriptions/:id
    getSubscriptionById: (id: number | string) =>
        apiFetch<SubscriptionRecord>(`/subscriptions/${id}`),

    // API #55: PATCH /api/v1/subscriptions/:id/pause
    pauseSubscription: (id: number | string) =>
        apiFetch<SubscriptionRecord>(`/subscriptions/${id}/pause`, {
            method: 'PATCH',
        }),

    // API #56: PATCH /api/v1/subscriptions/:id/cancel
    cancelSubscription: (id: number | string) =>
        apiFetch<SubscriptionRecord>(`/subscriptions/${id}/cancel`, {
            method: 'PATCH',
        }),
};