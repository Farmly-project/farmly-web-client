import { useState, type ReactNode } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordInputFieldProps {
    id: string;
    label: string;
    placeholder?: string;
    autoComplete?: string;
    disabled?: boolean;
    error?: string;
    rightLabelAction?: ReactNode;
    registration: UseFormRegisterReturn;
}

export function PasswordInputField({
    id,
    label,
    placeholder = 'Nhập ít nhất 8 ký tự',
    autoComplete = 'current-password',
    disabled = false,
    error,
    rightLabelAction,
    registration,
}: PasswordInputFieldProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <label htmlFor={id} className="block text-xs sm:text-sm font-bold text-gray-800">
                    {label} <span className="text-red-500">*</span>
                </label>
                {rightLabelAction}
            </div>

            <div
                className={`flex items-center rounded-xl border bg-[#F4F6F9] px-3.5 h-12 transition focus-within:bg-white focus-within:ring-2 ${error
                        ? 'border-red-400 focus-within:ring-red-200'
                        : 'border-transparent focus-within:border-[#1B4332] focus-within:ring-emerald-900/15'
                    }`}
            >
                <Lock className="h-4 w-4 text-gray-400 mr-2.5 shrink-0" />
                <input
                    id={id}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={autoComplete}
                    disabled={disabled}
                    placeholder={placeholder}
                    {...registration}
                    className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none disabled:opacity-60"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="ml-2 flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200/60 hover:text-gray-700 transition"
                >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>

            {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
        </div>
    );
}