import { ApiError, apiFetch } from "./apiClient";
import type {
  AdminProductListResult,
  AdminProductQueryParams,
  CategoryPayload,
  CategoryRecord,
  ProductCertificationRecord,
  ProductPayload,
  ProductRecord,
  UploadCertificationPayload,
} from "../types/catalog.types";

/** Trích xuất thông điệp lỗi chi tiết từ backend (bao gồm lỗi Zod validator). */
export function extractCatalogErrorMessage(
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

export const catalogService = {
  // --- DANH MỤC (CATEGORIES) ---
  getCategories: () => apiFetch<CategoryRecord[]>("/categories"),

  getCategoryById: (id: number) =>
    apiFetch<CategoryRecord>(`/categories/${id}`),

  createCategory: (payload: CategoryPayload) =>
    apiFetch<CategoryRecord>("/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateCategory: (id: number, payload: Partial<CategoryPayload>) =>
    apiFetch<CategoryRecord>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteCategory: (id: number) =>
    apiFetch<null>(`/categories/${id}`, {
      method: "DELETE",
    }),

  // --- SẢN PHẨM (PRODUCTS) ---
  getProducts: (params: AdminProductQueryParams = {}) =>
    apiFetch<AdminProductListResult>("/products", {
      params: {
        page: params.page ?? 1,
        limit: Math.min(params.limit ?? 20, 50),
        search: params.search?.trim() || undefined,
        category_id: params.category_id,
        min_price: params.min_price,
        max_price: params.max_price,
        allow_subscription: params.allow_subscription,
        sort_by: params.sort_by,
      },
    }),

  getProductById: (id: number) => apiFetch<ProductRecord>(`/products/${id}`),

  createProduct: (payload: ProductPayload) =>
    apiFetch<ProductRecord>("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateProduct: (id: number, payload: Partial<ProductPayload>) =>
    apiFetch<ProductRecord>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteProduct: (id: number) =>
    apiFetch<null>(`/products/${id}`, {
      method: "DELETE",
    }),

  // --- CHỨNG NHẬN KIỂM ĐỊNH ---
  uploadCertification: (
    productId: number,
    payload: UploadCertificationPayload,
  ) => {
    const formData = new FormData();
    formData.append("file", payload.file);
    formData.append("cert_name", payload.cert_name.trim());
    if (payload.cert_number?.trim()) {
      formData.append("cert_number", payload.cert_number.trim());
    }
    if (payload.issued_by?.trim()) {
      formData.append("issued_by", payload.issued_by.trim());
    }
    if (payload.issue_date) {
      formData.append("issue_date", payload.issue_date);
    }
    if (payload.expiry_date) {
      formData.append("expiry_date", payload.expiry_date);
    }

    return apiFetch<ProductCertificationRecord>(
      `/products/${productId}/certifications`,
      {
        method: "POST",
        body: formData,
      },
    );
  },
};
