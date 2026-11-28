const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

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
  responseType?: "json" | "blob";
  _retry?: boolean;
}

function getAccessToken(): string | null {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("farmly_access_token") ||
    sessionStorage.getItem("access_token")
  );
}

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken =
    localStorage.getItem("refresh_token") ||
    localStorage.getItem("farmly_refresh_token");

  if (!refreshToken) return null;

  const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  const newToken =
    json?.data?.access_token || json?.data?.accessToken || json?.access_token;

  if (newToken) {
    localStorage.setItem("access_token", newToken);
    return newToken;
  }
  return null;
}

// Hàm lõi xử lý request (hỗ trợ JSON, FormData, Blob và tự Refresh Token 401)
async function coreFetch(
  endpoint: string,
  options: FetchOptions = {},
): Promise<any> {
  const {
    params,
    headers,
    responseType = "json",
    _retry,
    ...restOptions
  } = options;

  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const token = getAccessToken();
  const isFormData = restOptions.body instanceof FormData;

  // Nếu gửi FormData (upload ảnh), không set Content-Type để trình duyệt tự gắn boundary
  const mergedHeaders: Record<string, string> = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers as Record<string, string>),
  };
  if (isFormData) {
    delete mergedHeaders["Content-Type"];
  }

  const response = await fetch(url.toString(), {
    ...restOptions,
    headers: mergedHeaders,
  });

  // Tự động xin cấp lại Access Token nếu gặp 401
  if (response.status === 401 && !_retry) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      return coreFetch(endpoint, { ...options, _retry: true });
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.dispatchEvent(new CustomEvent("auth:session-expired"));
  }

  if (!response.ok) {
    const errPayload = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      errPayload?.message || `Lỗi HTTP ${response.status}`,
      errPayload,
    );
  }

  if (responseType === "blob") {
    return await response.blob();
  }

  return await response.json().catch(() => null);
}

// 1. Giữ nguyên hàm apiFetch cũ cho các màn hình đã dùng
export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const payload = await coreFetch(endpoint, options);
  return (payload?.data !== undefined ? payload.data : payload) as T;
}

// 2. Xuất thêm axiosClient tương thích 100% với bộ code Dashboard
const buildBody = (data?: unknown) => {
  if (data === undefined || data === null) return undefined;
  return data instanceof FormData ? data : JSON.stringify(data);
};

export const axiosClient = {
  get: async <T = any>(
    url: string,
    config?: FetchOptions,
  ): Promise<{ data: T }> => ({
    data: await coreFetch(url, { ...config, method: "GET" }),
  }),
  post: async <T = any>(
    url: string,
    data?: unknown,
    config?: FetchOptions,
  ): Promise<{ data: T }> => ({
    data: await coreFetch(url, {
      ...config,
      method: "POST",
      body: buildBody(data),
    }),
  }),
  put: async <T = any>(
    url: string,
    data?: unknown,
    config?: FetchOptions,
  ): Promise<{ data: T }> => ({
    data: await coreFetch(url, {
      ...config,
      method: "PUT",
      body: buildBody(data),
    }),
  }),
  patch: async <T = any>(
    url: string,
    data?: unknown,
    config?: FetchOptions,
  ): Promise<{ data: T }> => ({
    data: await coreFetch(url, {
      ...config,
      method: "PATCH",
      body: buildBody(data),
    }),
  }),
  delete: async <T = any>(
    url: string,
    config?: FetchOptions,
  ): Promise<{ data: T }> => ({
    data: await coreFetch(url, { ...config, method: "DELETE" }),
  }),
};

export default axiosClient;
