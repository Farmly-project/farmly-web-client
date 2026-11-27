import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import { AuthAlertBanner } from '../../components/auth/AuthAlertBanner';
import { LoginForm } from '../../components/auth/LoginForm';
import { useAuth } from '../../hooks/useAuth';
import type { LoginFormValues } from '../../utils/validators';
import type { UserRole } from '../../contexts/AuthContext';

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
    const { login, isAuthenticated, user } = useAuth();
    const returnTo = (location.state as { from?: string } | null)?.from;

    const [serverError, setServerError] = useState<string | null>(null);
    const [lockUntil, setLockUntil] = useState<number | null>(() => {
        const saved = localStorage.getItem(LOCK_STORAGE_KEY);
        return saved && Number(saved) > Date.now() ? Number(saved) : null;
    });
    const [remainingSeconds, setRemainingSeconds] = useState(0);

    // Tự động chuyển hướng nếu người dùng đã đăng nhập sẵn
    useEffect(() => {
        if (isAuthenticated && user) {
            navigate(ROLE_REDIRECT_MAP[user.role] || '/', { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

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
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
            const isEmail = values.identifier.includes('@');
            const cleanedValue = isEmail
                ? values.identifier.trim().toLowerCase()
                : values.identifier.replace(/\s+/g, '');

            // Gửi đúng key 'email' theo yêu cầu của Zod Validator ở Backend
            const payload = isEmail
                ? { email: cleanedValue, password: values.password }
                : { phone: cleanedValue, password: values.password };

            const res = await fetch(`${apiUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                // Lỗi 400 từ Zod Validator
                if (res.status === 400) {
                    const firstErr = Array.isArray(data?.errors) ? data.errors[0]?.message : null;
                    setServerError(firstErr || data?.message || 'Dữ liệu đầu vào không hợp lệ');
                    return;
                }

                // Tài khoản bị Admin khóa (UC09 - E4)
                if (res.status === 403 || data?.code === 'ACCOUNT_DISABLED') {
                    setServerError('Tài khoản đã bị khoá, vui lòng liên hệ quản trị viên');
                    return;
                }

                // Bị khóa tạm thời 15 phút (UC09 - E3 / NFR-S05)
                if (res.status === 429 || data?.locked_until) {
                    const unlockAt = data?.locked_until
                        ? new Date(data.locked_until).getTime()
                        : Date.now() + LOCK_DURATION_MS;
                    localStorage.setItem(LOCK_STORAGE_KEY, String(unlockAt));
                    setLockUntil(unlockAt);
                    setServerError(`Tài khoản tạm khóa 15 phút. Mở lại lúc ${formatUnlockTime(unlockAt)}.`);
                    return;
                }

                // Sai email hoặc mật khẩu (401 - UC09 - E2)
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
            const userData = authData.user;

            // Lưu phiên vào AuthContext (tự động cập nhật Header & gộp CartContext)
            login(
                authData.access_token,
                userData,
                values.rememberMe,
                authData.refresh_token
            );

            const role = userData?.role as UserRole;
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