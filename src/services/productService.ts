import { apiFetch } from './apiClient';
import type {
    CategoryItem,
    PaginatedProductResponse,
    ProductListQueryParams,
    ProductDetailData,
    ProductCardItem,
    FarmingLogItem,
    ProductReviewItem,
} from '../types/product.types';


export const productService = {
    // API #13: GET /api/v1/categories
    getCategories: () => apiFetch<CategoryItem[]>('/categories'),

    // API #18: GET /api/v1/products (có phân trang 20 SP/trang, tìm kiếm, lọc, sắp xếp)
    getProducts: (params: ProductListQueryParams = {}) =>
        apiFetch<PaginatedProductResponse | ProductCardItem[]>('/products', {
            params: {
                page: params.page ?? 1,
                limit: params.limit ?? 20,
                search: params.search,
                category_id: params.category_id,
                allow_subscription: params.allow_subscription,
                flash_sale_only: params.flash_sale_only,
                in_stock_only: params.in_stock_only,
                certification: params.certification,
                min_price: params.min_price,
                max_price: params.max_price,
                sort: params.sort,
            },
        }),

    // API #19: GET /api/v1/products/:id
    getProductById: (idOrSlug: string | number) =>
        apiFetch<ProductDetailData>(`/products/${idOrSlug}`),

    // API #18: Lấy sản phẩm tương tự cùng danh mục
    getRelatedProducts: (categoryId: number, limit = 4) =>
        apiFetch<ProductCardItem[]>('/products', {
            params: { category_id: categoryId, limit },
        }),

    // API #30: GET /api/v1/batches/:batchId/farming-logs
    getBatchFarmingLogs: (batchId: number) =>
        apiFetch<FarmingLogItem[]>(`/batches/${batchId}/farming-logs`),

    // API #62: GET /api/v1/products/:productId/reviews
    getProductReviews: (productId: number) =>
        apiFetch<ProductReviewItem[]>(`/products/${productId}/reviews`),

    // API #35: POST /api/v1/cart/items
    addToCart: (productId: number, quantity: number) =>
        apiFetch('/cart/items', {
            method: 'POST',
            body: JSON.stringify({
                product_id: productId,
                quantity,
                guest_token: localStorage.getItem('guest_token') || undefined,
            }),
        }),

    // API #51: POST /api/v1/subscriptions
    createSubscription: (payload: {
        product_id: number;
        quantity_per_delivery: number;
        delivery_weekdays: string[];
        start_date: string;
    }) =>
        apiFetch('/subscriptions', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
};