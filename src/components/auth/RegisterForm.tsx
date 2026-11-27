import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { User, Mail, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { registerSchema, type RegisterFormValues } from '../../utils/validators';
import { PasswordInputField } from './PasswordInputField';

interface RegisterFormProps {
    onSubmitForm: (values: RegisterFormValues) => Promise<void>;
}

export function RegisterForm({ onSubmitForm }: RegisterFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormValues>({
        resolver: yupResolver(registerSchema),
        mode: 'onTouched',
        defaultValues: {
            fullName: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            agreeTerms: false,
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmitForm)} noValidate className="space-y-4">
            {/* Họ và tên */}
            <div>
                <label
                    htmlFor="fullName"
                    className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5"
                >
                    Họ và tên <span className="text-red-500">*</span>
                </label>
                <div
                    className={`flex items-center rounded-xl border bg-[#F4F6F9] px-3.5 h-12 transition focus-within:bg-white focus-within:ring-2 ${errors.fullName
                        ? 'border-red-400 focus-within:ring-red-200'
                        : 'border-transparent focus-within:border-[#1B4332] focus-within:ring-emerald-900/15'
                        }`}
                >
                    <User className="h-4 w-4 text-gray-400 mr-2.5 shrink-0" />
                    <input
                        id="fullName"
                        type="text"
                        autoComplete="name"
                        disabled={isSubmitting}
                        placeholder="Nguyễn Văn An"
                        {...register('fullName')}
                        className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none disabled:opacity-60"
                    />
                </div>
                {errors.fullName && (
                    <p className="mt-1 text-xs font-medium text-red-600">{errors.fullName.message}</p>
                )}
            </div>

            {/* Email & Số điện thoại (2 cột trên màn hình >= sm, 1 cột trên mobile 360px) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label
                        htmlFor="email"
                        className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5"
                    >
                        Email <span className="text-red-500">*</span>
                    </label>
                    <div
                        className={`flex items-center rounded-xl border bg-[#F4F6F9] px-3.5 h-12 transition focus-within:bg-white focus-within:ring-2 ${errors.email
                            ? 'border-red-400 focus-within:ring-red-200'
                            : 'border-transparent focus-within:border-[#1B4332] focus-within:ring-emerald-900/15'
                            }`}
                    >
                        <Mail className="h-4 w-4 text-gray-400 mr-2.5 shrink-0" />
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            disabled={isSubmitting}
                            placeholder="vidu@gmail.com"
                            {...register('email')}
                            className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none disabled:opacity-60"
                        />
                    </div>
                    {errors.email && (
                        <p className="mt-1 text-xs font-medium text-red-600">{errors.email.message}</p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="phone"
                        className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5"
                    >
                        Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <div
                        className={`flex items-center rounded-xl border bg-[#F4F6F9] px-3.5 h-12 transition focus-within:bg-white focus-within:ring-2 ${errors.phone
                            ? 'border-red-400 focus-within:ring-red-200'
                            : 'border-transparent focus-within:border-[#1B4332] focus-within:ring-emerald-900/15'
                            }`}
                    >
                        <Phone className="h-4 w-4 text-gray-400 mr-2.5 shrink-0" />
                        <input
                            id="phone"
                            type="tel"
                            autoComplete="tel"
                            disabled={isSubmitting}
                            placeholder="0912 345 678"
                            {...register('phone')}
                            className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none disabled:opacity-60"
                        />
                    </div>
                    {errors.phone && (
                        <p className="mt-1 text-xs font-medium text-red-600">{errors.phone.message}</p>
                    )}
                </div>
            </div>

            {/* Mật khẩu (NFR-S02: >= 8 ký tự, cả chữ và số) */}
            <PasswordInputField
                id="password"
                label="Mật khẩu"
                autoComplete="new-password"
                placeholder="Tối thiểu 8 ký tự, gồm chữ và số"
                disabled={isSubmitting}
                error={errors.password?.message}
                registration={register('password')}
            />

            {/* Xác nhận mật khẩu */}
            <PasswordInputField
                id="confirmPassword"
                label="Xác nhận mật khẩu"
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu ở trên"
                disabled={isSubmitting}
                error={errors.confirmPassword?.message}
                registration={register('confirmPassword')}
            />

            {/* Điều khoản dịch vụ */}
            <div className="pt-0.5">
                <label className="inline-flex min-h-11 items-start gap-2.5 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        disabled={isSubmitting}
                        {...register('agreeTerms')}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1B4332] focus:ring-[#1B4332]"
                    />
                    <span className="text-xs sm:text-sm text-gray-600 leading-snug">
                        Tôi đồng ý với{' '}
                        <span className="font-semibold text-[#1B5E20] underline">Điều khoản sử dụng</span> và{' '}
                        <span className="font-semibold text-[#1B5E20] underline">Chính sách bảo mật</span> của
                        Farmly.
                    </span>
                </label>
                {errors.agreeTerms && (
                    <p className="text-xs font-medium text-red-600">{errors.agreeTerms.message}</p>
                )}
            </div>

            {/* Nút Đăng ký */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-[#1E462D] hover:bg-[#163622] active:scale-[0.99] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Đang tạo tài khoản...</span>
                    </>
                ) : (
                    <>
                        <span>Đăng Ký Thành Viên</span>
                        <ArrowRight className="h-4 w-4" />
                    </>
                )}
            </button>
        </form>
    );
}