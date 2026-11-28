export type StaffRole = "farm_staff" | "sales";

export type StaffStatusFilter = "active" | "locked";

export interface StaffAccountRecord {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  role: StaffRole | "admin";
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  is_active: boolean;
}

export interface StaffAccountsQueryParams {
  page?: number;
  limit?: number;
  role?: StaffRole;
  status?: StaffStatusFilter;
  search?: string;
}

export interface StaffPaginationMeta {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface StaffAccountsListResult {
  items: StaffAccountRecord[];
  pagination: StaffPaginationMeta;
}

export interface CreateStaffAccountPayload {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: StaffRole;
}

export interface UpdateStaffStatusPayload {
  is_active: boolean;
  reason?: string;
}
