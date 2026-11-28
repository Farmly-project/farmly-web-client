export interface CategoryRecord {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  allow_subscription: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  allow_subscription?: boolean;
  is_active?: boolean;
}

export interface ProductImageInput {
  image_url: string;
  is_primary?: boolean;
  display_order?: number;
}

export interface ProductImageRecord {
  id: number;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export interface ProductCertificationRecord {
  id: number;
  cert_name: string;
  cert_number?: string | null;
  issued_by?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  file_url: string;
}

export interface ActiveBatchTrace {
  batch_code: string;
  harvest_date?: string | null;
  exp_date?: string | null;
  qr_code?: string | null;
}

export interface ProductRecord {
  id: number;
  category_id?: number | null;
  name: string;
  slug: string;
  unit: string;
  base_price: number;
  short_description?: string | null;
  description?: string | null;
  preservation_days: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  primary_image?: string | null;
  available_quantity?: number;
  nearest_exp_date?: string | null;
  has_flash_sale?: boolean;
  flash_sale_price?: number | null;
  category?: {
    id: number;
    name: string;
    slug: string;
    allow_subscription: boolean;
  } | null;
  images?: ProductImageRecord[];
  certifications?: ProductCertificationRecord[];
  active_batch_trace?: ActiveBatchTrace | null;
}

export interface ProductPayload {
  category_id?: number | null;
  name: string;
  slug?: string;
  unit?: string;
  base_price: number;
  short_description?: string;
  description?: string;
  preservation_days?: number;
  is_active?: boolean;
  images?: ProductImageInput[];
}

export interface AdminProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  allow_subscription?: boolean;
  sort_by?: "newest" | "price_asc" | "price_desc";
}

export interface AdminPaginationMeta {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface AdminProductListResult {
  items: ProductRecord[];
  pagination: AdminPaginationMeta;
}

export interface UploadCertificationPayload {
  cert_name: string;
  cert_number?: string;
  issued_by?: string;
  issue_date?: string;
  expiry_date?: string;
  file: File;
}
