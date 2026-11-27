import { useState, type FormEvent } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, Save, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { ApiError } from '../../services/apiClient';

interface ChangePasswordTabProps {
    onNotify: (type: 'success' | 'error', text: string) => void;
}

export function ChangePasswordTab({ onNotify }: ChangePasswordTabProps) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!currentPassword) {
            setError('Vui lòng nhập mật khẩu hiện tại.');
            return;
        }
        if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            setError('Mật khẩu mới phải có tối thiểu 8 ký tự, bao gồm cả chữ và số.');
            return;
        }
        if (newPassword === currentPassword) {
            setError('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Xác nhận mật khẩu mới chưa khớp.');
            return;
        }

        setIsSubmitting(true);
        try {
            await authService.changePassword({
                old_password: currentPassword,
                new_password: newPassword,
            });

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            onNotify('success', 'Đổi mật khẩu thành công!');
        } catch (err) {
            const msg =
                err instanceof ApiError ? err.message : 'Mật khẩu hiện tại không chính xác.';
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 sm:p-8 shadow-2xs">
            <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Đổi mật khẩu</h2>
                <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    Mật khẩu mới cần tối thiểu 8 ký tự, bao gồm cả chữ và số để đảm bảo an toàn
                </p>
            </div>

            {error && (
                <div
                    role="alert"
                    className="mt-5 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs sm:text-sm font-semibold text-red-700"
                >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
                <div>
                    <label
                        htmlFor="current-password"
                        className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5"
                    >
                        Mật khẩu hiện tại
                    </label>
                    <div className="flex h-12 items-center rounded-xl bg-[#EFF3FA] px-3.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1E462D]/20 border border-transparent focus-within:border-[#1E462D] transition">
                        <Lock className="mr-2.5 h-4 w-4 text-gray-400 shrink-0" />
                        <input
                            id="current-password"
                            type={showCurrentPw ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Nhập mật khẩu đang sử dụng"
                            className="w-full bg-transparent text-sm text-gray-900 focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrentPw((v) => !v)}
                            aria-label="Ẩn hoặc hiện mật khẩu hiện tại"
                            className="ml-2 flex h-10 w-10 items-center justify-center text-gray-500"
                        >
                            {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="new-password"
                        className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5"
                    >
                        Mật khẩu mới
                    </label>
                    <div className="flex h-12 items-center rounded-xl bg-[#EFF3FA] px-3.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1E462D]/20 border border-transparent focus-within:border-[#1E462D] transition">
                        <Lock className="mr-2.5 h-4 w-4 text-gray-400 shrink-0" />
                        <input
                            id="new-password"
                            type={showNewPw ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Tối thiểu 8 ký tự, gồm chữ và số"
                            className="w-full bg-transparent text-sm text-gray-900 focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPw((v) => !v)}
                            aria-label="Ẩn hoặc hiện mật khẩu mới"
                            className="ml-2 flex h-10 w-10 items-center justify-center text-gray-500"
                        >
                            {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="confirm-new-password"
                        className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5"
                    >
                        Xác nhận mật khẩu mới
                    </label>
                    <div className="flex h-12 items-center rounded-xl bg-[#EFF3FA] px-3.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1E462D]/20 border border-transparent focus-within:border-[#1E462D] transition">
                        <Lock className="mr-2.5 h-4 w-4 text-gray-400 shrink-0" />
                        <input
                            id="confirm-new-password"
                            type={showNewPw ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Nhập lại mật khẩu mới"
                            className="w-full bg-transparent text-sm text-gray-900 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1E462D] px-6 text-sm font-bold text-white hover:bg-[#163622] active:scale-[0.99] disabled:opacity-60 transition"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        <span>Cập nhật mật khẩu</span>
                    </button>
                </div>
            </form>
        </div>
    );
}