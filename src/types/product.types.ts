export interface ProductCardItem {
    id: number;
    name: string;
    slug: string;
    unit: string;
    base_price: number;
    category: {
        id: number;
        name: string;
        allow_subscription: boolean;
    };
    primary_image_url: string | null;
    certifications: string[];
    available_stock: number;
    fefo_batch: {
        batch_code: string;
        harvest_date: string;
        exp_date: string;
        days_until_expiry: number;
        flash_sale_price: number | null;
        flash_sale_ends_at: string | null;
    } | null;
    rating_summary: {
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
    stage_label: string; // VD: "GIAI ĐOẠN 1"
    title: string;       // VD: "Gieo Hạt Non-GMO"
    description: string;
    evidence_image_url: string | null;
    logged_at: string;   // ISO Date/Timestamp
}

export interface ProductReviewItem {
    id: number;
    customer_name: string;
    customer_initials: string;
    rating: number;
    comment: string;
    created_at_relative: string; // VD: "2 ngày trước"
    verified_purchase_note: string; // VD: "Đã mua 500g • Tên đơn #12"
}

export interface ProductDetailData extends Omit<ProductCardItem, 'primary_image_url' | 'fefo_batch'> {
    shelf_life_days: number;
    description: string;
    farm_location: string; // VD: "Vườn Thượng Lạc Dương, Lâm Đồng"
    images: ProductImageItem[];
    fefo_batch: {
        id: number;
        batch_code: string;
        harvest_date: string;
        harvest_time_note?: string; // VD: "06:15 sáng"
        exp_date: string;
        days_until_expiry: number;
        grow_zone?: string;         // VD: "Nhà kính A1"
        current_quantity: number;
        qr_code: string;
        flash_sale_price: number | null;
        flash_sale_ends_at: string | null;
    } | null;
    farming_logs: FarmingLogItem[];
    related_products: ProductCardItem[];
    reviews: ProductReviewItem[];
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

export interface ProductListQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    category_id?: number;
    min_price?: number;
    max_price?: number;
    allow_subscription?: boolean;
    near_expiry?: boolean;
    sort?: string;
}

export interface PaginatedProductResponse {
    data: ProductCardItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
}
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