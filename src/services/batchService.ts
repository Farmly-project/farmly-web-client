import { apiFetch } from './apiClient';

export interface BatchTraceData {
    batch_code: string;
    product_name?: string;
    harvest_date?: string;
    exp_date?: string;
    farm_location?: string;
    logs?: Array<Record<string, unknown>>;
    [key: string]: unknown;
}

export interface BatchFlashSalePayload {
    flash_sale_price: number | null;
    flash_sale_ends_at?: string | null;
}

export const batchService = {
    // Giữ nguyên hàm truy xuất nguồn gốc QR cho TraceabilityPage
    getBatchTrace: (batchCode: string) =>
        apiFetch<BatchTraceData>(`/batches/${encodeURIComponent(batchCode)}/trace`),

    // Lấy danh sách lô hàng (lọc các lô đang bán / cận hạn)
    getBatches: (params?: {
        status?: string;
        near_expiry?: boolean;
        product_id?: number;
        page?: number;
        limit?: number;
    }) => apiFetch<unknown>('/batches', { params }),

    // Cấu hình hoặc tắt giá Flash Sale cho lô hàng cận hạn
    configureFlashSale: (batchId: number | string, payload: BatchFlashSalePayload) =>
        apiFetch<unknown>(`/batches/${batchId}/flash-sale`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }),
};