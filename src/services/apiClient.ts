const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export class ApiError extends Error {
    status: number;
    data: unknown;

    constructor(status: number, message: string, data?: unknown) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

interface FetchOptions extends RequestInit {
    params?: Record<string, string | number | boolean | undefined>;
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { params, headers, ...restOptions } = options;

    // Xây dựng URL kèm query params nếu có
    const url = new URL(`${BASE_URL}${endpoint}`);
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                url.searchParams.append(key, String(value));
            }
        });
    }

    // Lấy JWT Access Token từ localStorage (do Supabase Auth cấp)
    const token = localStorage.getItem('access_token');

    const response = await fetch(url.toString(), {
        ...restOptions,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        throw new ApiError(
            response.status,
            payload?.message || `Lỗi HTTP ${response.status}`,
            payload
        );
    }

    // Hỗ trợ cả trường hợp backend bọc trong { data: ... } hoặc trả trực tiếp JSON
    return (payload?.data !== undefined ? payload.data : payload) as T;
}