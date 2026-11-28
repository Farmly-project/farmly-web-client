export type BatchStatus = "growing" | "in_stock" | "sold_out";

export type FarmingStage =
  | "sowing"
  | "fertilizing"
  | "watering"
  | "pest_control"
  | "harvesting"
  | "packaging";

export type DisposalReason =
  | "damaged"
  | "rotten"
  | "expired"
  | "quality_failed"
  | "other";

export interface BatchProductSummary {
  id: number;
  name: string;
  unit: string;
  base_price: number;
  preservation_days?: number;
}

export interface DisposalRecord {
  id: number;
  quantity_disposed: number;
  reason: DisposalReason;
  note?: string | null;
  image_url: string;
  created_at: string;
  disposed_by?: string;
}

export interface InventoryBatchRecord {
  id: number;
  batch_code: string;
  product_id: number;
  product?: BatchProductSummary | null;
  sowing_date?: string | null;
  harvest_date?: string | null;
  exp_date?: string | null;
  initial_quantity: number;
  current_quantity: number;
  disposed_quantity: number;
  status: BatchStatus;
  qr_code?: string | null;
  qr_scan_count?: number;
  flash_sale_price?: number | null;
  flash_sale_ends_at?: string | null;
  is_expired?: boolean;
  created_at?: string;
  disposals?: DisposalRecord[];
}

export interface BatchQueryParams {
  page?: number;
  limit?: number;
  product_id?: number;
  status?: BatchStatus;
  near_expiry?: boolean;
}

export interface BatchPaginationMeta {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface BatchListResult {
  items: InventoryBatchRecord[];
  pagination: BatchPaginationMeta;
}

export interface CreateBatchPayload {
  batch_code?: string;
  product_id: number;
  sowing_date?: string;
  harvest_date?: string;
  exp_date?: string;
  initial_quantity: number;
  status?: "growing" | "in_stock";
}

export interface FlashSalePayload {
  flash_sale_price: number | null;
  flash_sale_ends_at?: string | null;
}

export interface CreateDisposalPayload {
  batch_id: number;
  quantity_disposed: number;
  reason: DisposalReason;
  note?: string;
  file: File;
}

export interface BatchFarmingLogRecord {
  id: number;
  batch_id: number;
  stage: FarmingStage;
  title: string;
  description?: string | null;
  evidence_image_url?: string | null;
  logged_at: string;
  staff?: { id: string; full_name: string } | null;
}

export interface BatchTimelineResult {
  batch_id: number;
  batch_code: string;
  status: BatchStatus;
  sowing_date?: string | null;
  harvest_date?: string | null;
  exp_date?: string | null;
  qr_code?: string | null;
  logs: BatchFarmingLogRecord[];
}

export interface CreateFarmingLogPayload {
  stage: FarmingStage;
  title: string;
  description?: string;
  logged_at?: string;
  exp_date?: string;
  file?: File | null;
}

export interface GeneratedQrData {
  batch_id: number;
  batch_code: string;
  qr_code: string;
  qr_image_base64?: string;
}

export interface InventoryNotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  level: "normal" | "info" | "warning" | "danger" | "red";
  read_at: string | null;
  created_at: string;
}

export interface InventoryNotificationsResult {
  unread_count: number;
  items: InventoryNotificationItem[];
}
