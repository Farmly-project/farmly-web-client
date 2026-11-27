import { apiFetch } from './apiClient';
import type { PaymentLinkResponse } from '../types/order.types';

export const paymentService = {
    // API #47: POST /api/v1/payments (UC30 - PayOS VietQR)
    createPayOSPayment: (payload: {
        order_id: number;
        return_url: string;
        cancel_url: string;
    }) =>
        apiFetch<PaymentLinkResponse>('/payments', {
            method: 'POST',
            body: JSON.stringify({
                ...payload,
                payment_method: 'payos',
            }),
        }),

    // Đối soát trực tiếp với PayOS khi redirect về localhost & cập nhật DB -> 'paid'
    verifyPayOSPayment: (payload: {
        order_id: number;
        order_code?: string | null;
        payment_link_id?: string | null;
        status?: string | null;
    }) =>
        apiFetch<{ status?: string; payment_status?: string }>(
            '/payments/payos/verify',
            {
                method: 'POST',
                body: JSON.stringify(payload),
            }
        ),
};