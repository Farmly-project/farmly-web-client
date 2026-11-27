import {
    createContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from 'react';

export type UserRole = 'customer' | 'farm_staff' | 'sales' | 'admin';

export interface AuthUser {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    role: UserRole;
}

export interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (
        accessToken: string,
        userData: AuthUser,
        rememberMe?: boolean,
        refreshToken?: string
    ) => void;
    logout: () => Promise<void>;
    updateUser: (partialUser: Partial<AuthUser>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(
        () =>
            localStorage.getItem('access_token') ||
            sessionStorage.getItem('access_token')
    );
    const [user, setUser] = useState<AuthUser | null>(() => {
        const saved =
            localStorage.getItem('user_info') || sessionStorage.getItem('user_info');
        if (!saved) return null;
        try {
            return JSON.parse(saved) as AuthUser;
        } catch {
            return null;
        }
    });
    const [isLoading, setIsLoading] = useState<boolean>(Boolean(token));

    const clearAuthStorage = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
        localStorage.removeItem('user_role');

        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('user_info');

        setToken(null);
        setUser(null);
    }, []);

    // Kiểm tra lại phiên đăng nhập khi F5 tải lại trang (API #3: GET /api/v1/auth/me)
    useEffect(() => {
        if (!token) {
            setIsLoading(false);
            return;
        }

        let isMounted = true;
        const verifySession = async () => {
            try {
                const res = await fetch(`${API_URL}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) {
                    if (isMounted) clearAuthStorage();
                    return;
                }

                const payload = await res.json();
                const meData = (payload.data || payload) as AuthUser;
                if (isMounted && meData?.id) {
                    setUser(meData);
                    const storage = localStorage.getItem('access_token')
                        ? localStorage
                        : sessionStorage;
                    storage.setItem('user_info', JSON.stringify(meData));
                    localStorage.setItem('user_role', meData.role);
                }
            } catch {
                // Giữ nguyên state tạm từ storage nếu mạng chập chờn
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        verifySession();
        return () => {
            isMounted = false;
        };
    }, [token, clearAuthStorage]);

    const login = useCallback(
        (
            accessToken: string,
            userData: AuthUser,
            rememberMe = false,
            refreshToken?: string
        ) => {
            clearAuthStorage();
            const storage = rememberMe ? localStorage : sessionStorage;

            storage.setItem('access_token', accessToken);
            if (refreshToken) {
                storage.setItem('refresh_token', refreshToken);
            }
            storage.setItem('user_info', JSON.stringify(userData));
            localStorage.setItem('user_role', userData.role);

            setToken(accessToken);
            setUser(userData);
        },
        [clearAuthStorage]
    );

    const logout = useCallback(async () => {
        const currentToken = token;
        clearAuthStorage();

        if (currentToken) {
            try {
                // API #5: POST /api/v1/auth/logout
                await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${currentToken}`,
                    },
                });
            } catch {
                // Bỏ qua lỗi mạng khi hủy session phía server
            }
        }
    }, [token, clearAuthStorage]);

    const updateUser = useCallback((partialUser: Partial<AuthUser>) => {
        setUser((prev) => {
            if (!prev) return null;
            const updated = { ...prev, ...partialUser };
            const storage = localStorage.getItem('access_token')
                ? localStorage
                : sessionStorage;
            storage.setItem('user_info', JSON.stringify(updated));
            return updated;
        });
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: Boolean(token && user),
                isLoading,
                login,
                logout,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}