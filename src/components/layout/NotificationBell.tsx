import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, AlertTriangle, Package, Info } from 'lucide-react';
import { apiFetch, ApiError } from '../../services/apiClient';

export interface NotificationItem {
    id: string | number;
    title: string;
    message?: string;
    type?: 'warning' | 'alert' | 'order' | 'info' | string;
    is_read?: boolean;
    read?: boolean;
    created_at?: string;
    link?: string;
    action_url?: string;
}

function isItemRead(item: NotificationItem): boolean {
    return Boolean(item.is_read ?? item.read ?? false);
}

function formatShortTime(iso?: string): string {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
    });
}

export function NotificationBell() {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);

    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = useCallback(async () => {
        const token =
            localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        if (!token) {
            setItems([]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await apiFetch<
                | NotificationItem[]
                | {
                    items?: NotificationItem[];
                    notifications?: NotificationItem[];
                    data?: NotificationItem[] | { items?: NotificationItem[] };
                }
            >('/notifications');

            const raw = res as unknown as {
                items?: NotificationItem[];
                notifications?: NotificationItem[];
                data?: NotificationItem[] | { items?: NotificationItem[] };
            };

            const list = Array.isArray(res)
                ? res
                : Array.isArray(raw?.data)
                    ? raw.data
                    : raw?.data && !Array.isArray(raw.data) && Array.isArray(raw.data.items)
                        ? raw.data.items
                        : raw?.items ?? raw?.notifications ?? [];

            setItems(list);
        } catch (err) {
            if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
                setItems([]);
            } else {
                setError('Không thể tải thông báo');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        const interval = window.setInterval(fetchNotifications, 60000);
        return () => window.clearInterval(interval);
    }, [fetchNotifications]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = items.filter((item) => !isItemRead(item)).length;

    const markOneAsRead = async (item: NotificationItem) => {
        setItems((prev) =>
            prev.map((n) => (n.id === item.id ? { ...n, is_read: true, read: true } : n))
        );

        try {
            await apiFetch(`/notifications/${item.id}/read`, { method: 'PATCH' });
        } catch {
            // Bỏ qua lỗi mạng nền nếu endpoint chưa sẵn sàng
        }

        const targetUrl = item.action_url || item.link;
        if (targetUrl) {
            setOpen(false);
            navigate(targetUrl);
        }
    };

    const markAllAsRead = async () => {
        setItems((prev) => prev.map((n) => ({ ...n, is_read: true, read: true })));
        try {
            await apiFetch('/notifications/read-all', { method: 'PATCH' });
        } catch {
            // Bỏ qua lỗi mạng nền nếu endpoint chưa sẵn sàng
        }
    };

    const renderIcon = (type?: string) => {
        if (type === 'warning' || type === 'alert' || type === 'expiring') {
            return <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />;
        }
        if (type === 'order' || type === 'subscription') {
            return <Package className="h-4 w-4 text-[#1E462D] shrink-0 mt-0.5" />;
        }
        return <Info className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />;
    };

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => {
                    const next = !open;
                    setOpen(next);
                    if (next) fetchNotifications();
                }}
                aria-label="Thông báo"
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-extrabold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="fixed left-3 right-3 top-20 z-50 rounded-2xl border border-gray-200 bg-white shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-88 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-gray-900">Thông báo</span>
                            {unreadCount > 0 && (
                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
                                    {unreadCount} mới
                                </span>
                            )}
                        </div>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={markAllAsRead}
                                className="inline-flex items-center gap-1 text-xs font-bold text-[#1E462D] hover:underline"
                            >
                                <CheckCheck className="h-3.5 w-3.5" />
                                <span>Đọc tất cả</span>
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                        {loading && items.length === 0 ? (
                            <div className="p-6 text-center text-xs text-gray-500">
                                Đang tải thông báo...
                            </div>
                        ) : error ? (
                            <div className="p-6 text-center text-xs text-red-600">{error}</div>
                        ) : items.length === 0 ? (
                            <div className="p-6 text-center text-xs text-gray-500">
                                Hiện chưa có thông báo mới.
                            </div>
                        ) : (
                            items.map((item) => {
                                const unread = !isItemRead(item);
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => markOneAsRead(item)}
                                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50 ${unread ? 'bg-[#F3F8F3]/80' : 'bg-white'
                                            }`}
                                    >
                                        {renderIcon(item.type)}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p
                                                    className={`text-xs leading-snug ${unread ? 'font-extrabold text-gray-900' : 'font-semibold text-gray-700'
                                                        }`}
                                                >
                                                    {item.title}
                                                </p>
                                                {unread && (
                                                    <span className="mt-1 h-2 w-2 rounded-full bg-[#1E462D] shrink-0" />
                                                )}
                                            </div>
                                            {item.message && (
                                                <p className="mt-0.5 text-[11px] text-gray-600 line-clamp-2">
                                                    {item.message}
                                                </p>
                                            )}
                                            {item.created_at && (
                                                <p className="mt-1 text-[10px] text-gray-400">
                                                    {formatShortTime(item.created_at)}
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationBell;