import { apiFetch } from './apiClient';

export type ComplaintResolutionAction =
    | 'REFUND'
    | 'REPLACEMENT'
    | 'REJECT'
    | 'NEED_MORE_INFO';

export interface ResolveComplaintPayload {
    action: ComplaintResolutionAction;
    refund_amount?: number;
    admin_note?: string;
}

export const complaintService = {
    // Lấy danh sách khiếu nại cho Sales (hỗ trợ lọc theo status)
    getComplaints: (params?: { status?: string; page?: number; limit?: number }) =>
        apiFetch<unknown>('/complaints', { params }),

    // Xem chi tiết một khiếu nại kèm ảnh/video minh chứng
    getComplaintById: (complaintId: number | string) =>
        apiFetch<unknown>(`/complaints/${complaintId}`),

    // Sales duyệt xử lý khiếu nại: Hoàn tiền / Giao bù / Từ chối / Yêu cầu bổ sung
    resolveComplaint: (
        complaintId: number | string,
        payload: ResolveComplaintPayload
    ) =>
        apiFetch<unknown>(`/complaints/${complaintId}/resolve`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }),
};