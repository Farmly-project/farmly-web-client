export type UserRole = 'CUSTOMER' | 'FARM_STAFF' | 'SALES' | 'ADMIN';

export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    role: UserRole;
    is_active?: boolean;
}

export interface UpdateProfilePayload {
    full_name: string;
    phone: string;
    avatar_url?: string | null;
}

export interface CustomerAddress {
    id: number;
    recipient_name: string;
    phone: string;
    address_line: string;
    ward: string;
    district?: string;
    province: string;
    is_default: boolean;
}

export interface AddressPayload {
    recipient_name: string;
    phone: string;
    address_line: string;
    ward: string;
    district?: string;
    province: string;
    is_default: boolean;
}

export interface ChangePasswordPayload {
    old_password: string;
    new_password: string;
}