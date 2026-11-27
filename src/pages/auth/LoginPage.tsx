import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import { AuthAlertBanner } from '../../components/auth/AuthAlertBanner';
import { LoginForm } from '../../components/auth/LoginForm';
import type { LoginFormValues } from '../../utils/validators';

type UserRole = 'CUSTOMER' | 'FARM_STAFF' | 'SALES' | 'ADMIN';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const LOCK_STORAGE_KEY = 'farmly_login_lock_until';
const ATTEMPTS_STORAGE_KEY = 'farmly_login_failed_attempts';

const ROLE_REDIRECT_MAP: Record<UserRole, string> = {
    CUSTOMER: '/',
    FARM_STAFF: '/farm/batches',
    SALES: '/sales/orders',
    ADMIN: '/admin/dashboard',
};

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const returnTo = (location.state as { from?: string } | null)?.from;

    const [serverError, setServerError] = useState<string | null>(null);
    const [lockUntil, setLockUntil] = useState<number | null>(() => {
        const saved = localStorage.getItem(LOCK_STORAGE_KEY);
        return saved && Number(saved) > Date.now() ? Number(saved) : null;
    });
    const [remainingSeconds, setRemainingSeconds] = useState(0);

    useEffect(() => {
        if (!lockUntil) {
            setRemainingSeconds(0);
            return;
        }
        const tick = () => {
            const diff = Math.ceil((lockUntil - Date.now()) / 1000);
            if (diff <= 0) {
                setLockUntil(null);
                setRemainingSeconds(0);
                localStorage.removeItem(LOCK_STORAGE_KEY);
                localStorage.removeItem(ATTEMPTS_STORAGE_KEY);
            } else {
                setRemainingSeconds(diff);
            }
        };
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [lockUntil]);

    const formatUnlockTime = (ts: number) =>
        new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const handleLoginSubmit = async (values: LoginFormValues) => {
        if (lockUntil && lockUntil > Date.now()) return;
        setServerError(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
            const cleanedIdentifier = values.identifier.includes('@')
                ? values.identifier.trim().toLowerCase()
                : values.identifier.replace(/\s+/g, '');

            const res = await fetch(`${apiUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identifier: cleanedIdentifier,
                    password: values.password,
                    remember_me: values.rememberMe,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                if (res.status === 403 || data?.code === 'ACCOUNT_DISABLED') {
                    setServerError('Tài khoản đã bị khoá, vui lòng liên hệ quản trị viên');
                    return;
                }
                if (res.status === 429 || data?.locked_until) {
                    const unlockAt = data?.locked_until
                        ? new Date(data.locked_until).getTime()
                        : Date.now() + LOCK_DURATION_MS;
                    localStorage.setItem(LOCK_STORAGE_KEY, String(unlockAt));
                    setLockUntil(unlockAt);
                    setServerError(`Tài khoản tạm khóa 15 phút. Mở lại lúc ${formatUnlockTime(unlockAt)}.`);
                    return;
                }

                const attempts = Number(localStorage.getItem(ATTEMPTS_STORAGE_KEY) || '0') + 1;
                if (attempts >= MAX_FAILED_ATTEMPTS) {
                    const unlockAt = Date.now() + LOCK_DURATION_MS;
                    localStorage.setItem(LOCK_STORAGE_KEY, String(unlockAt));
                    localStorage.removeItem(ATTEMPTS_STORAGE_KEY);
                    setLockUntil(unlockAt);
                    setServerError(
                        `Bạn đã nhập sai quá 5 lần liên tiếp. Tài khoản tạm khóa đến ${formatUnlockTime(unlockAt)}.`
                    );
                } else {
                    localStorage.setItem(ATTEMPTS_STORAGE_KEY, String(attempts));
                    setServerError(
                        `Email/SĐT hoặc mật khẩu không đúng (Còn ${MAX_FAILED_ATTEMPTS - attempts} lần thử).`
                    );
                }
                return;
            }

            localStorage.removeItem(ATTEMPTS_STORAGE_KEY);
            localStorage.removeItem(LOCK_STORAGE_KEY);

            const authData = data.data || data;
            const storage = values.rememberMe ? localStorage : sessionStorage;
            storage.setItem('access_token', authData.access_token);
            if (authData.refresh_token) storage.setItem('refresh_token', authData.refresh_token);
            if (authData.user?.role) {
                localStorage.setItem('user_role', authData.user.role);
                localStorage.setItem('user_info', JSON.stringify(authData.user));
            }

            const role = authData.user?.role as UserRole;
            if (returnTo && role === 'CUSTOMER') {
                navigate(returnTo, { replace: true });
            } else {
                navigate(ROLE_REDIRECT_MAP[role] || '/', { replace: true });
            }
        } catch {
            setServerError('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
        }
    };

    const isLocked = Boolean(lockUntil && remainingSeconds > 0);

    return (
        <AuthLayout
            title="Chào mừng trở lại"
            subtitle="Đăng nhập bằng email hoặc số điện thoại đã đăng ký với Farmly"
            footer={
                <p className="text-center text-xs sm:text-sm text-gray-600">
                    Chưa có tài khoản Farmly?{' '}
                    <Link
                        to="/register"
                        className="font-bold text-[#1B5E20] underline underline-offset-2 hover:text-emerald-900"
                    >
                        Đăng ký thành viên ngay
                    </Link>
                </p>
            }
        >
            <AuthAlertBanner
                message={serverError}
                isLocked={isLocked}
                remainingSeconds={remainingSeconds}
            />
            <LoginForm isLocked={isLocked} onSubmitForm={handleLoginSubmit} />
        </AuthLayout>
    );
}

export default LoginPage;