export interface ProductCardItem {
    id: number;
    category_id: number;
    name: string;
    slug: string;
    unit: string;
    base_price: number;
    flash_sale_price: number | null;
    has_flash_sale: boolean;
    available_quantity: number;
    nearest_exp_date: string | null;
    preservation_days: number;
    primary_image: string | null;
    short_description?: string | null;
    description?: string | null;
    is_active: boolean;
    category?: {
        id: number;
        name: string;
        slug: string;
        allow_subscription: boolean;
    };
    images?: {
        id?: number;
        image_url: string;
        is_primary?: boolean;
    }[];
    certifications?: (string | ProductCertificationItem)[];
    rating_summary?: {
        average: number;
        count: number;
    };
}

export interface ProductImageItem {
    id: number;
    image_url: string;
    caption?: string;
    is_primary: boolean;
    display_order: number;
}

export interface FarmingLogItem {
    id: number;
    stage: 'sowing' | 'fertilizing' | 'watering' | 'pesticide' | 'harvesting';
    stage_label: string;
    title: string;
    description: string;
    evidence_image_url: string | null;
    logged_at: string;
}

export interface ProductReviewItem {
    id: number;
    customer_name: string;
    customer_initials: string;
    rating: number;
    comment: string;
    created_at_relative: string;
    verified_purchase_note: string;
}

export interface ProductDetailData extends ProductCardItem {
    shelf_life_days?: number;
    description?: string | null;
    farm_location?: string;
    created_at?: string;
    available_stock?: number;
    images: ProductImageItem[];
    fefo_batch?: {
        id: number;
        batch_code: string;
        harvest_date: string;
        harvest_time_note?: string;
        exp_date: string;
        days_until_expiry: number;
        grow_zone?: string;
        current_quantity: number;
        qr_code: string;
        flash_sale_price: number | null;
        flash_sale_ends_at: string | null;
    } | null;
    farming_logs?: FarmingLogItem[];
    related_products?: ProductCardItem[];
    reviews?: ProductReviewItem[];
}

export interface CategoryItem {
    id: number;
    name: string;
    slug?: string;
    description?: string;
    is_active: boolean;
    allow_subscription: boolean;
    product_count?: number;
}
export interface ProductCertificationItem {
    id?: number;
    cert_name: string;
    cert_code?: string;
    document_url?: string;
}

export interface ProductListQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    category_id?: number;
    allow_subscription?: boolean;
    flash_sale_only?: boolean;
    near_expiry?: boolean;
    in_stock_only?: boolean;
    certification?: string;
    min_price?: number;
    max_price?: number;
    sort?: 'fefo' | 'newest' | 'price_asc' | 'price_desc' | 'rating_desc' | string;
}

export interface PaginatedProductResponse {
    items: ProductCardItem[];
    data?: ProductCardItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
}

// Giữ tương thích ngược cho HomePage / HomeProductCard nếu còn dùng
export interface Category {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    allow_subscription: boolean;
}

export interface ProductListItem {
    id: number;
    category_id: number;
    category_name?: string;
    category_slug?: string;
    name: string;
    slug: string;
    unit: string;
    base_price: number;
    sale_price?: number | null;
    is_near_expiry_deal?: boolean;
    available_stock?: number;
    primary_image_url?: string | null;
    certification_name?: string | null;
}

export interface ProductListResponse {
    data: ProductListItem[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}