import { ApiError, apiFetch } from "./apiClient";
import type {
  BatchListResult,
  BatchQueryParams,
  BatchTimelineResult,
  CreateBatchPayload,
  CreateDisposalPayload,
  CreateFarmingLogPayload,
  FlashSalePayload,
  GeneratedQrData,
  InventoryBatchRecord,
  InventoryNotificationItem,
  InventoryNotificationsResult,
} from "../types/inventory.types";

/** Trích xuất thông điệp lỗi chi tiết từ backend (bao gồm lỗi Zod validator). */
export function extractInventoryErrorMessage(
  err: unknown,
  fallback = "Đã có lỗi xảy ra, vui lòng thử lại.",
): string {
  if (err instanceof ApiError) {
    const payload = err.data as
      | { message?: string; errors?: Array<{ field?: string; message?: string }> }
      | undefined;
    const firstFieldError = payload?.errors?.[0]?.message;
    return firstFieldError || payload?.message || err.message || fallback;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

export const inventoryService = {
  // --- LÔ HÀNG (BATCHES) ---
  getBatches: (params: BatchQueryParams = {}) =>
    apiFetch<BatchListResult>("/batches", {
      params: {
        page: params.page ?? 1,
        limit: Math.min(params.limit ?? 20, 50),
        product_id: params.product_id,
        status: params.status,
        near_expiry: params.near_expiry,
      },
    }),

  getBatchById: (id: number) =>
    apiFetch<InventoryBatchRecord>(`/batches/${id}`),

  createBatch: (payload: CreateBatchPayload) =>
    apiFetch<InventoryBatchRecord>("/batches", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  configureFlashSale: (batchId: number, payload: FlashSalePayload) =>
    apiFetch<InventoryBatchRecord>(`/batches/${batchId}/flash-sale`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  generateBatchQr: (batchId: number) =>
    apiFetch<GeneratedQrData>(`/batches/${batchId}/qr-code`, {
      method: "POST",
    }),

  // --- NHẬT KÝ CANH TÁC ---
  getFarmingTimeline: (batchId: number) =>
    apiFetch<BatchTimelineResult>(`/batches/${batchId}/farming-logs`),

  createFarmingLog: (batchId: number, payload: CreateFarmingLogPayload) => {
    const formData = new FormData();
    formData.append("stage", payload.stage);
    formData.append("title", payload.title.trim());
    if (payload.description?.trim()) {
      formData.append("description", payload.description.trim());
    }
    if (payload.logged_at) {
      formData.append("logged_at", payload.logged_at);
    }
    if (payload.exp_date) {
      formData.append("exp_date", payload.exp_date);
    }
    if (payload.file) {
      formData.append("file", payload.file);
    }

    return apiFetch(`/batches/${batchId}/farming-logs`, {
      method: "POST",
      body: formData,
    });
  },

  // --- XUẤT HỦY HAO HỤT ---
  createDisposal: (payload: CreateDisposalPayload) => {
    const formData = new FormData();
    formData.append("batch_id", String(payload.batch_id));
    formData.append("quantity_disposed", String(payload.quantity_disposed));
    formData.append("reason", payload.reason);
    if (payload.note?.trim()) {
      formData.append("note", payload.note.trim());
    }
    formData.append("file", payload.file);

    return apiFetch("/inventory-disposals", {
      method: "POST",
      body: formData,
    });
  },

  // --- CẢNH BÁO & THÔNG BÁO KHO ---
  getNotifications: (params?: {
    page?: number;
    limit?: number;
    unread_only?: boolean;
  }) =>
    apiFetch<InventoryNotificationsResult>("/notifications", {
      params: {
        page: params?.page ?? 1,
        limit: Math.min(params?.limit ?? 20, 50),
        unread_only: params?.unread_only,
      },
    }),

  markNotificationRead: (id: number) =>
    apiFetch<InventoryNotificationItem>(`/notifications/${id}/read`, {
      method: "PATCH",
    }),

  markAllNotificationsRead: () =>
    apiFetch<{ marked_count: number }>("/notifications/read-all", {
      method: "PATCH",
    }),

  // --- CẤU HÌNH NGƯỠNG CẢNH BÁO (Admin) ---
  getExpiryWarningDays: async (): Promise<number> => {
    const data = await apiFetch<{ expiry_warning_days?: number }>("/settings");
    return Number(data?.expiry_warning_days ?? 2);
  },
};
