import { ApiError, apiFetch } from "./apiClient";
import type {
  CreateStaffAccountPayload,
  StaffAccountRecord,
  StaffAccountsListResult,
  StaffAccountsQueryParams,
  UpdateStaffStatusPayload,
} from "../types/account.types";

/** Trích xuất thông điệp lỗi chi tiết từ backend (bao gồm lỗi Zod validator). */
export function extractAccountErrorMessage(
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

export const accountService = {
  // GET /api/v1/accounts
  getAccounts: (params: StaffAccountsQueryParams = {}) =>
    apiFetch<StaffAccountsListResult>("/accounts", {
      params: {
        page: params.page ?? 1,
        limit: Math.min(params.limit ?? 20, 50),
        role: params.role,
        status: params.status,
        search: params.search?.trim() || undefined,
      },
    }),

  // POST /api/v1/accounts
  createAccount: (payload: CreateStaffAccountPayload) =>
    apiFetch<StaffAccountRecord>("/accounts", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // PATCH /api/v1/accounts/:id/status
  updateAccountStatus: (id: string, payload: UpdateStaffStatusPayload) =>
    apiFetch<StaffAccountRecord>(`/accounts/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
