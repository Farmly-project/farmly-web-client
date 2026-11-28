import axiosClient from "./apiClient"; // Axios instance đã gắn Bearer JWT & Refresh Token Interceptor
import type {
  ApiResponse,
  AuthUser,
  BatchItem,
  ComplaintRecord,
  DashboardSummary,
  DisposalBatchReport,
  FarmingLogItem,
  NotificationItem,
  OrderRecord,
  RevenueByDayItem,
  SystemSettings,
} from "../types/internalTypes";

export const internalApi = {
  // --- AUTH & NOTIFICATIONS (Dùng chung 3 vai trò) ---
  getMe: () => axiosClient.get<ApiResponse<AuthUser>>("/auth/me"),
  logout: () => axiosClient.post("/auth/logout"),

  getNotifications: (params?: { unread_only?: boolean; limit?: number }) =>
    axiosClient.get<
      ApiResponse<{ items: NotificationItem[]; unread_count: number }>
    >("/notifications", { params }),
  markNotificationRead: (id: number) =>
    axiosClient.patch<ApiResponse<NotificationItem>>(
      `/notifications/${id}/read`,
    ),
  markAllNotificationsRead: () =>
    axiosClient.patch<ApiResponse<{ marked_count: number }>>(
      "/notifications/read-all",
    ),

  // --- ADMIN: THỐNG KÊ, NHÂN SỰ & CẤU HÌNH ---
  getDashboardSummary: (params?: { start_date?: string; end_date?: string }) =>
    axiosClient.get<ApiResponse<DashboardSummary>>("/dashboard/summary", {
      params,
    }),

  getRevenueByDay: (params?: { start_date?: string; end_date?: string }) =>
    axiosClient.get<ApiResponse<{ series: RevenueByDayItem[] }>>(
      "/dashboard/revenue-by-day",
      {
        params,
      },
    ),

  getDisposalReport: (params?: { start_date?: string; end_date?: string }) =>
    axiosClient.get<ApiResponse<{ batches: DisposalBatchReport[] }>>(
      "/dashboard/disposal-report",
      { params },
    ),

  exportDashboardExcel: async (params?: {
    start_date?: string;
    end_date?: string;
  }) => {
    const response = await axiosClient.get("/dashboard/export-excel", {
      params,
      responseType: "blob",
    });
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Farmly_BaoCao_${params?.start_date || "GanNhat"}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  getAccounts: (params?: { role?: string; search?: string }) =>
    axiosClient.get<ApiResponse<{ items: AuthUser[] }>>("/accounts", {
      params,
    }),

  createAccount: (payload: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role: "farm_staff" | "sales";
  }) => axiosClient.post<ApiResponse<AuthUser>>("/accounts", payload),

  updateAccountStatus: (
    id: string,
    payload: { is_active: boolean; reason?: string },
  ) =>
    axiosClient.patch<ApiResponse<AuthUser>>(`/accounts/${id}/status`, payload),

  getSettings: () => axiosClient.get<ApiResponse<SystemSettings>>("/settings"),
  updateSettings: (payload: Partial<SystemSettings>) =>
    axiosClient.put<ApiResponse<SystemSettings>>("/settings", payload),

  // --- ADMIN: DANH MỤC & SẢN PHẨM ---
  getCategories: () => axiosClient.get<ApiResponse<any[]>>("/categories"),
  createCategory: (payload: {
    name: string;
    description?: string;
    allow_subscription?: boolean;
  }) => axiosClient.post("/categories", payload),
  deleteCategory: (id: number) => axiosClient.delete(`/categories/${id}`),

  getProducts: (params?: { page?: number; limit?: number; search?: string }) =>
    axiosClient.get("/products", { params }),
  createProduct: (payload: Record<string, any>) =>
    axiosClient.post("/products", payload),
  uploadCertification: (productId: number, formData: FormData) =>
    axiosClient.post(`/products/${productId}/certifications`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // --- FARM STAFF (+ ADMIN): LÔ HÀNG, NHẬT KÝ, QR & XUẤT HỦY ---
  getBatches: (params?: {
    status?: string;
    product_id?: number;
    search?: string;
  }) =>
    axiosClient.get<ApiResponse<{ items: BatchItem[] }>>("/batches", {
      params,
    }),

  createBatch: (payload: {
    product_id: number;
    batch_code?: string;
    sowing_date?: string;
    harvest_date?: string;
    exp_date?: string;
    initial_quantity: number;
  }) => axiosClient.post<ApiResponse<BatchItem>>("/batches", payload),

  getFarmingLogs: (batchId: number) =>
    axiosClient.get<ApiResponse<FarmingLogItem[]>>(
      `/batches/${batchId}/farming-logs`,
    ),

  createFarmingLog: (batchId: number, formData: FormData) =>
    axiosClient.post<ApiResponse<FarmingLogItem>>(
      `/batches/${batchId}/farming-logs`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    ),

  generateBatchQr: (batchId: number) =>
    axiosClient.post<ApiResponse<{ qr_code: string; qr_image_url?: string }>>(
      `/batches/${batchId}/qr-code`,
    ),

  createDisposal: (payload: {
    batch_id: number;
    quantity_disposed: number;
    reason: "damaged" | "spoiled" | "expired" | "other";
    note?: string;
    image_url?: string;
  }) => axiosClient.post("/inventory-disposals", payload),

  // --- SALES (+ ADMIN): ĐƠN HÀNG FEFO, FLASH SALE & KHIẾU NẠI ---
  getOrders: (params?: { status?: string; search?: string }) =>
    axiosClient.get<ApiResponse<{ items: OrderRecord[] }>>("/orders", {
      params,
    }),

  getOrderDetail: (id: number) =>
    axiosClient.get<ApiResponse<OrderRecord>>(`/orders/${id}`),

  suggestFefo: (productId: number, quantity?: number) =>
    axiosClient.get<ApiResponse<BatchItem[]>>("/batches/fefo/suggest", {
      params: { product_id: productId, quantity },
    }),

  confirmOrderFefo: (orderId: number) =>
    axiosClient.post<ApiResponse<OrderRecord>>(`/orders/${orderId}/confirm`),

  updateOrderStatus: (orderId: number, status: OrderRecord["status"]) =>
    axiosClient.patch<ApiResponse<OrderRecord>>(`/orders/${orderId}/status`, {
      status,
    }),

  setBatchFlashSale: (
    batchId: number,
    payload: {
      flash_sale_price: number | null;
      flash_sale_ends_at?: string | null;
    },
  ) =>
    axiosClient.patch<ApiResponse<BatchItem>>(
      `/batches/${batchId}/flash-sale`,
      payload,
    ),

  getComplaints: (params?: { status?: string }) =>
    axiosClient.get<ApiResponse<{ items: ComplaintRecord[] }>>("/complaints", {
      params,
    }),

  handleComplaint: (
    complaintId: number,
    payload: {
      action: "approve" | "reject";
      resolution?: "refund" | "replacement";
      refund_amount?: number;
      sales_note?: string;
      auto_confirm_replacement?: boolean;
    },
  ) =>
    axiosClient.patch<ApiResponse<ComplaintRecord>>(
      `/complaints/${complaintId}/handle`,
      payload,
    ),
};
