export type PaymentMethod = 'payos' | 'cod';
export type DeliveryTimeSlot = 'MORNING' | 'AFTERNOON';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderStatus =
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'shipping'
    | 'delivered'
    | 'cancelled';

export interface ShippingQuote {
    shipping_fee: number;
    distance_km: number;
    estimated_note?: string;
    is_supported: boolean;
    unsupported_reason?: string;
}

export interface CheckoutItem {
    cart_item_id?: string;
    product_id: number;
    name: string;
    unit: string;
    quantity: number;
    unit_price: number;
    original_price?: number;
    image_url: string | null;
    is_near_expiry?: boolean;
    cert_badge?: string;
}

export interface CreateOrderPayload {
    address_id: number;
    delivery_date: string; // YYYY-MM-DD
    delivery_slot: DeliveryTimeSlot;
    note?: string;
    payment_method: PaymentMethod;
    items: {
        product_id: number;
        quantity: number;
        unit_price: number;
    }[];
}

export interface CreatedOrderResponse {
    id: number;
    order_number: string;
    total_amount: number;
    status: string;
    payment_method: PaymentMethod;
}

export interface PaymentLinkResponse {
    payment_id: number;
    checkout_url?: string;
    qr_code_url?: string;
    order_code?: string | number;
}


export interface OrderBatchAllocation {
    id?: number;
    batch_id: number;
    batch_code?: string;
    quantity: number;
    harvest_date?: string | null;
    exp_date?: string | null;
}

export interface OrderItemDetail {
    id: number;
    product_id: number;
    product_name: string;
    unit: string;
    image_url?: string | null;
    quantity: number;
    unit_price: number;
    subtotal?: number;
    order_details?: OrderBatchAllocation[];
}

export interface OrderDetailData {
    id: number;
    order_code?: string;
    status: OrderStatus;
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;
    subtotal: number;
    shipping_fee: number;
    total_amount: number;
    delivery_date?: string | null;
    delivery_slot?: string | null;
    note?: string | null;
    recipient_name?: string;
    recipient_phone?: string;
    shipping_address?: string;
    address?: {
        recipient_name: string;
        phone: string;
        address_line: string;
        ward?: string;
        district?: string;
        province?: string;
    };
    items: OrderItemDetail[];
    delivered_at?: string | null;
    created_at: string;
}