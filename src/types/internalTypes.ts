// src/types/internal.types.ts
export type InternalRole = "admin" | "farm_staff" | "sales";
export type UserRole = InternalRole | "customer";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  deleted_at?: string | null;
}

export interface ApiResponse<T> {
  status: "success" | "error";
  message: string;
  data: T;
}

export interface DashboardSummary {
  period: { start_date: string; end_date: string };
  revenue: {
    delivered_retail_revenue: number;
    subscription_revenue: number;
    gross_revenue: number;
    refunded_amount: number;
    net_revenue: number;
  };
  orders: {
    total_orders: number;
    by_status: Record<string, number>;
    active_subscriptions: number;
  };
  inventory_loss: {
    total_batches: number;
    total_imported_qty: number;
    total_disposed_qty: number;
    overall_disposal_rate: number;
  };
  top_products: Array<{
    product_id: number;
    product_name: string;
    total_quantity_sold: number;
    total_revenue: number;
  }>;
}

export interface RevenueByDayItem {
  date: string;
  delivered_orders_count: number;
  retail_revenue: number;
  subscription_revenue: number;
  refunded_amount: number;
  net_revenue: number;
}

export interface DisposalBatchReport {
  batch_id: number;
  batch_code: string;
  product_id: number;
  product_name: string;
  unit: string;
  harvest_date: string | null;
  exp_date: string | null;
  status: "growing" | "in_stock" | "sold_out";
  initial_quantity: number;
  sold_quantity: number;
  current_quantity: number;
  disposed_quantity: number;
  disposal_rate: number;
}

export interface SystemSettings {
  expiry_warning_days: number;
  shipping_fee_per_km: number;
  farm_latitude: number;
  farm_longitude: number;
}

export interface BatchItem {
  id: number;
  batch_code: string;
  product_id: number;
  product?: { id: number; name: string; unit: string; base_price: number };
  sowing_date?: string | null;
  harvest_date?: string | null;
  exp_date?: string | null;
  initial_quantity: number;
  current_quantity: number;
  disposed_quantity: number;
  status: "growing" | "in_stock" | "sold_out";
  qr_code?: string | null;
  flash_sale_price?: number | null;
  flash_sale_ends_at?: string | null;
}

export interface FarmingLogItem {
  id: number;
  batch_id: number;
  stage: "sowing" | "fertilizing" | "watering" | "pesticide" | "harvesting";
  title: string;
  description?: string | null;
  evidence_image_url?: string | null;
  logged_at: string;
}

export interface OrderItemSummary {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  order_details?: Array<{
    id: number;
    batch_id: number;
    quantity: number;
    batch?: { batch_code: string; exp_date: string };
  }>;
}

export interface OrderRecord {
  id: number;
  order_number: string;
  order_type: "retail" | "subscription" | "replacement";
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "shipping"
    | "delivered"
    | "cancelled";
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  distance_km: number;
  shipping_fee: number;
  total_amount: number;
  created_at: string;
  items?: OrderItemSummary[];
}

export interface ComplaintRecord {
  id: number;
  order_item_id: number;
  quantity_affected: number;
  reason: string;
  description?: string | null;
  requested_resolution: "refund" | "replacement";
  status: "pending" | "approved" | "rejected" | "resolved";
  refund_amount?: number | null;
  sales_note?: string | null;
  created_at: string;
  media?: Array<{ id: number; media_type: "image" | "video"; url: string }>;
  order_item?: {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    order?: {
      id: number;
      order_number: string;
      customer_name: string;
      customer_phone: string;
    };
  };
}

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  level: "normal" | "info" | "warning" | "danger" | "red";
  read_at: string | null;
  created_at: string;
}
