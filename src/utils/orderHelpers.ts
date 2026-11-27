import type { OrderDetailData, PaymentMethod, PaymentStatus } from '../types/order.types';

export function resolveOrderPayment(
    order: OrderDetailData,
    hasPayosUrlParam = false
): { method: PaymentMethod; status: PaymentStatus } {
    const rawOrder = order as unknown as {
        payment_method?: string;
        payment_status?: string;
        payment?: { payment_method?: string; method?: string; status?: string };
        payments?: Array<{ payment_method?: string; method?: string; status?: string }>;
    };

    const latestPayment = rawOrder.payment ?? rawOrder.payments?.[0];

    const rawMethod = (
        rawOrder.payment_method ??
        latestPayment?.payment_method ??
        latestPayment?.method ??
        (hasPayosUrlParam ? 'payos' : 'cod')
    ).toLowerCase();

    const rawStatus = (
        rawOrder.payment_status ??
        latestPayment?.status ??
        'unpaid'
    ).toLowerCase();

    return {
        method: rawMethod === 'payos' ? 'payos' : 'cod',
        status: (['paid', 'pending', 'failed', 'refunded'].includes(rawStatus)
            ? rawStatus
            : 'unpaid') as PaymentStatus,
    };
}