import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { User, ArrowRight, Loader2 } from 'lucide-react';
import { loginSchema, type LoginFormValues } from '../../utils/validators';
import { PasswordInputField } from './PasswordInputField';

interface LoginFormProps {
    isLocked: boolean;
    onSubmitForm: (values: LoginFormValues) => Promise<void>;
}

export function LoginForm({ isLocked, onSubmitForm }: LoginFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: yupResolver(loginSchema),
        mode: 'onTouched',
        defaultValues: {
            identifier: '',
            password: '',
            rememberMe: false,
        },
    });

    const isDisabled = isLocked || isSubmitting;

    return (
        <form onSubmit={handleSubmit(onSubmitForm)} noValidate className="space-y-4">
            {/* Email hoặc Số điện thoại */}
            <div>
                <label
                    htmlFor="identifier"
                    className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5"
                >
                    Email hoặc Số điện thoại <span className="text-red-500">*</span>
                </label>
                <div
                    className={`flex items-center rounded-xl border bg-[#F4F6F9] px-3.5 h-12 transition focus-within:bg-white focus-within:ring-2 ${errors.identifier
                        ? 'border-red-400 focus-within:ring-red-200'
                        : 'border-transparent focus-within:border-[#1B4332] focus-within:ring-emerald-900/15'
                        }`}
                >
                    <User className="h-4 w-4 text-gray-400 mr-2.5 shrink-0" />
                    <input
                        id="identifier"
                        type="text"
                        autoComplete="username"
                        disabled={isDisabled}
                        placeholder="vidu@gmail.com hoặc 0912 345 678"
                        {...register('identifier')}
                        className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none disabled:opacity-60"
                    />
                </div>
                {errors.identifier && (
                    <p className="mt-1 text-xs font-medium text-red-600">{errors.identifier.message}</p>
                )}
            </div>


            <PasswordInputField
                id="password"
                label="Mật khẩu"
                disabled={isDisabled}
                error={errors.password?.message}
                registration={register('password')}
                rightLabelAction={
                    <Link to="/forgot-password" className="text-xs font-semibold text-[#1B5E20] hover:underline">
                        Quên mật khẩu?
                    </Link>
                }
            />


            <div className="flex items-center pt-0.5">
                <label className="inline-flex min-h-11 items-center gap-2.5 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        disabled={isDisabled}
                        {...register('rememberMe')}
                        className="h-4 w-4 rounded border-gray-300 text-[#1B4332] focus:ring-[#1B4332]"
                    />
                    <span className="text-xs sm:text-sm text-gray-600">
                        Ghi nhớ đăng nhập trên thiết bị này
                    </span>
                </label>
            </div>

            {/* Nút Submit (>= 44px theo NFR-U03) */}
            <button
                type="submit"
                disabled={isDisabled}
                className="w-full h-12 rounded-xl bg-[#1E462D] hover:bg-[#163622] active:scale-[0.99] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Đang xác thực...</span>
                    </>
                ) : (
                    <>
                        <span>Đăng Nhập Ngay</span>
                        <ArrowRight className="h-4 w-4" />
                    </>
                )}
            </button>
        </form>
    );
}