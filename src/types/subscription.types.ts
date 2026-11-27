export type SubscriptionStatus =
    | 'pending_payment'
    | 'active'
    | 'paused'
    | 'cancelled'
    | 'completed';

export type DeliveryScheduleStatus =
    | 'scheduled'
    | 'order_created'
    | 'skipped'
    | 'delivered'
    | 'cancelled';

export interface SubscriptionItem {
    id?: number;
    product_id: number;
    product_name?: string;
    unit?: string;
    primary_image_url?: string | null;
    quantity_per_delivery: number;
    locked_unit_price: number;
}

export interface DeliveryScheduleItem {
    id: number;
    scheduled_date: string;
    delivery_slot?: string;
    status: DeliveryScheduleStatus;
    order_id?: number | null;
}

export interface SubscriptionRecord {
    id: number;
    subscription_code?: string;
    status: SubscriptionStatus;
    delivery_weekdays: string[]; // VD: ['TUE', 'FRI']
    delivery_slot?: string;
    start_date: string;
    end_date: string;
    total_deliveries: number;
    completed_deliveries?: number;
    shipping_fee_per_delivery?: number;
    total_amount: number;
    shipping_address?: string;
    items: SubscriptionItem[];
    schedules?: DeliveryScheduleItem[];
    created_at?: string;
}

// src/types/subscription.types.ts
export interface CreateSubscriptionPayload {
    address_id?: number;
    shipping_address?: string;
    delivery_days: number[];
    delivery_weekdays?: (number | string)[];
    delivery_slot: string;
    start_date: string;
    items: Array<{
        product_id: number;
        quantity: number;
        quantity_per_delivery?: number;
    }>;
}