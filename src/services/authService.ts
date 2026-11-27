import { apiFetch } from './apiClient';
import type {
    UserProfile,
    UpdateProfilePayload,
    CustomerAddress,
    AddressPayload,
    ChangePasswordPayload,
} from '../types/auth.types';

function unwrapData<T>(res: unknown): T {
    if (res && typeof res === 'object' && 'data' in res) {
        return (res as { data: T }).data;
    }
    return res as T;
}

export const authService = {
    // API #7: GET /api/v1/profile
    getProfile: async (): Promise<UserProfile> => {
        const res = await apiFetch<unknown>('/profile');
        return unwrapData<UserProfile>(res);
    },

    // API #8: PATCH /api/v1/profile
    updateProfile: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
        const res = await apiFetch<unknown>('/profile', {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
        return unwrapData<UserProfile>(res);
    },

    // API #9: GET /api/v1/profile/addresses
    getAddresses: async (): Promise<CustomerAddress[]> => {
        const res = await apiFetch<unknown>('/profile/addresses');
        const unwrapped = unwrapData<unknown>(res);

        if (Array.isArray(unwrapped)) return unwrapped;
        if (
            unwrapped &&
            typeof unwrapped === 'object' &&
            'addresses' in unwrapped &&
            Array.isArray((unwrapped as { addresses: unknown }).addresses)
        ) {
            return (unwrapped as { addresses: CustomerAddress[] }).addresses;
        }
        return [];
    },

    // API #10: POST /api/v1/profile/addresses
    createAddress: async (payload: AddressPayload): Promise<CustomerAddress> => {
        const res = await apiFetch<unknown>('/profile/addresses', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        return unwrapData<CustomerAddress>(res);
    },

    // API #11: PATCH /api/v1/profile/addresses/:id
    updateAddress: async (
        id: number,
        payload: Partial<AddressPayload>
    ): Promise<CustomerAddress> => {
        const res = await apiFetch<unknown>(`/profile/addresses/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
        return unwrapData<CustomerAddress>(res);
    },

    // API #12: DELETE /api/v1/profile/addresses/:id
    deleteAddress: (id: number) =>
        apiFetch<unknown>(`/profile/addresses/${id}`, {
            method: 'DELETE',
        }),

    // API #6: PATCH /api/v1/auth/change-password
    changePassword: (payload: ChangePasswordPayload) =>
        apiFetch<unknown>('/auth/change-password', {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }),
};