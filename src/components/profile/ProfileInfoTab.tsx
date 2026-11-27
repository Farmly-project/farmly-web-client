import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { User, Phone, Mail, Lock, CheckCircle2, Save, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { ApiError } from '../../services/apiClient';
import type { UserProfile } from '../../types/auth.types';

interface ProfileInfoTabProps {
    profile: UserProfile;
    onProfileUpdated: (updated: UserProfile) => void;
    onNotify: (type: 'success' | 'error', text: string) => void;
}

export function ProfileInfoTab({
    profile,
    onProfileUpdated,
    onNotify,
}: ProfileInfoTabProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [fullName, setFullName] = useState(profile.full_name || '');
    const [phone, setPhone] = useState(profile.phone || '');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url || null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFullName(profile.full_name || '');
        setPhone(profile.phone || '');
        setAvatarUrl(profile.avatar_url || null);
    }, [profile]);

    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            onNotify('error', 'Chỉ hỗ trợ định dạng ảnh JPG, PNG hoặc WebP.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            onNotify('error', 'Dung lượng ảnh tối đa là 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setAvatarUrl(reader.result);
                onNotify('success', 'Đã tải ảnh mới. Nhấn "Lưu thay đổi" để cập nhật.');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const trimmedName = fullName.trim();
        const cleanedPhone = phone.replace(/\s+/g, '');

        if (!trimmedName) {
            onNotify('error', 'Vui lòng nhập họ và tên.');
            return;
        }
        if (cleanedPhone && !/^(0|\+84)[0-9]{9,10}$/.test(cleanedPhone)) {
            onNotify('error', 'Số điện thoại chưa đúng định dạng Việt Nam.');
            return;
        }

        setIsSaving(true);
        try {
            const updated = await authService.updateProfile({
                full_name: trimmedName,
                phone: cleanedPhone,
                avatar_url: avatarUrl,
            });

            onProfileUpdated({
                ...profile,
                ...updated,
                full_name: updated?.full_name ?? trimmedName,
                phone: updated?.phone ?? cleanedPhone,
                avatar_url: updated?.avatar_url !== undefined ? updated.avatar_url : avatarUrl,
            });
            onNotify('success', 'Đã cập nhật thông tin cá nhân thành công.');
        } catch (err) {
            const msg =
                err instanceof ApiError ? err.message : 'Không thể lưu thông tin, vui lòng thử lại.';
            onNotify('error', msg);
        } finally {
            setIsSaving(false);
        }
    };

    const initials = (fullName.trim().slice(0, 2) || 'KH').toUpperCase();

    return (
        <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 sm:p-8 shadow-2xs">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                        Thông tin cá nhân
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-gray-500">
                        Cập nhật thông tin nhận diện tài khoản mua hàng tại FARMLY
                    </p>
                </div>
                <span className="rounded-full bg-[#DDF2E2] px-3 py-1 text-xs font-bold text-[#1B4332] shrink-0">
                    Cơ bản
                </span>
            </div>

            {/* Khối ảnh đại diện */}
            <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl bg-[#EFF3FA] p-4 sm:p-5">
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={fullName}
                        className="h-16 w-16 rounded-full object-cover border border-emerald-900/15 shrink-0"
                    />
                ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#BCEAD0] text-xl font-extrabold text-[#163622]">
                        {initials}
                    </div>
                )}

                <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-xs sm:text-sm font-bold text-gray-900 shadow-2xs hover:bg-gray-50 transition"
                        >
                            Thay đổi ảnh
                        </button>

                        {avatarUrl && (
                            <button
                                type="button"
                                onClick={() => setAvatarUrl(null)}
                                className="inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-xs sm:text-sm font-semibold text-gray-600 hover:text-red-600 transition"
                            >
                                Xóa ảnh
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-gray-500">
                        Định dạng JPG, PNG. Dung lượng tối đa 5MB
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label
                            htmlFor="profile-full-name"
                            className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5"
                        >
                            Họ và tên
                        </label>
                        <div className="flex h-12 items-center rounded-xl bg-[#EFF3FA] px-3.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1E462D]/20 border border-transparent focus-within:border-[#1E462D] transition">
                            <User className="mr-2.5 h-4 w-4 text-gray-400 shrink-0" />
                            <input
                                id="profile-full-name"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-transparent text-sm font-medium text-gray-900 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="profile-phone"
                            className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5"
                        >
                            Số điện thoại
                        </label>
                        <div className="flex h-12 items-center rounded-xl bg-[#EFF3FA] px-3.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1E462D]/20 border border-transparent focus-within:border-[#1E462D] transition">
                            <Phone className="mr-2.5 h-4 w-4 text-gray-400 shrink-0" />
                            <input
                                id="profile-phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="0909 123 456"
                                className="w-full bg-transparent text-sm font-medium text-gray-900 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="profile-email"
                            className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5"
                        >
                            Email đăng nhập
                        </label>
                        <div className="flex h-12 items-center justify-between rounded-xl bg-[#E4E9F2] px-3.5 text-gray-500">
                            <div className="flex items-center min-w-0">
                                <Mail className="mr-2.5 h-4 w-4 shrink-0" />
                                <span id="profile-email" className="truncate text-sm">
                                    {profile.email}
                                </span>
                            </div>
                            <Lock className="h-4 w-4 shrink-0 ml-2" />
                        </div>
                        <p className="mt-1 text-[11px] text-gray-500">
                            Email không thể thay đổi để bảo vệ tài khoản
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5">
                            Vai trò tài khoản
                        </label>
                        <div className="flex h-12 items-center justify-between rounded-xl bg-[#EFF3FA] px-3.5 text-gray-700">
                            <span className="text-sm font-medium">Khách hàng thành viên</span>
                            <CheckCircle2 className="h-4 w-4 text-[#1E462D] shrink-0" />
                        </div>
                        <p className="mt-1 text-[11px] text-gray-500">
                            Áp dụng cho mua lẻ và đăng ký gói rau định kỳ
                        </p>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1E462D] px-6 text-sm font-bold text-white hover:bg-[#163622] active:scale-[0.99] disabled:opacity-60 transition"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        <span>Lưu thay đổi</span>
                    </button>
                </div>
            </form>
        </div>
    );
}