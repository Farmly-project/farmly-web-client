import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { AuthAlertBanner } from '../../components/auth/AuthAlertBanner';
import { RegisterForm } from '../../components/auth/RegisterForm';
import type { RegisterFormValues } from '../../utils/validators';

export function RegisterPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const returnTo = (location.state as { from?: string } | null)?.from;

    const [serverError, setServerError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleRegisterSubmit = async (values: RegisterFormValues) => {
        setServerError(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

            const response = await fetch(`${apiUrl}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: values.fullName.trim(),
                    email: values.email.trim().toLowerCase(),
                    phone: values.phone.replace(/\s+/g, ''),
                    password: values.password,
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (response.status === 409) {
                    setServerError(
                        data?.message || 'Email hoặc số điện thoại này đã được đăng ký tài khoản.'
                    );
                    return;
                }
                setServerError(
                    data?.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.'
                );
                return;
            }

            setIsSuccess(true);
            setTimeout(() => {
                navigate('/login', {
                    replace: true,
                    state: returnTo ? { from: returnTo } : undefined,
                });
            }, 1500);
        } catch {
            setServerError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.');
        }
    };

    return (
        <AuthLayout
            maxWidthClass="max-w-lg"
            title="Tạo tài khoản Farmly"
            subtitle="Đăng ký thành viên để đặt nông sản sạch trực tiếp từ nông trại và theo dõi đơn hàng"
            footer={
                <p className="text-center text-xs sm:text-sm text-gray-600">
                    Đã có tài khoản Farmly?{' '}
                    <Link
                        to="/login"
                        state={returnTo ? { from: returnTo } : undefined}
                        className="font-bold text-[#1B5E20] underline underline-offset-2 hover:text-emerald-900"
                    >
                        Đăng nhập ngay
                    </Link>
                </p>
            }
        >
            {isSuccess ? (
                <div
                    role="status"
                    className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center space-y-2"
                >
                    <CheckCircle2 className="h-9 w-9 text-[#1B5E20] mx-auto" />
                    <h2 className="text-base font-bold text-gray-900">Đăng ký tài khoản thành công!</h2>
                    <p className="text-xs sm:text-sm text-gray-600">
                        Đang chuyển bạn sang trang đăng nhập để bắt đầu mua sắm...
                    </p>
                </div>
            ) : (
                <>
                    <AuthAlertBanner message={serverError} />
                    <RegisterForm onSubmitForm={handleRegisterSubmit} />
                </>
            )}
        </AuthLayout>
    );
}

export default RegisterPage;