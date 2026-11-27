import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, WifiOff, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import type { UserProfile, CustomerAddress } from '../../types/auth.types';
import {
    ProfileSidebar,
    ProfileInfoTab,
    AddressBookTab,
    ChangePasswordTab,
    PROFILE_TABS,
    type ProfileTab,
} from '../../components/profile';

export function ProfilePage() {
    const navigate = useNavigate();
    const { user, updateUser, logout } = useAuth();

    const [activeTab, setActiveTab] = useState<ProfileTab>('info');
    const [isLoading, setIsLoading] = useState(true);
    const [isApiError, setIsApiError] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [profile, setProfile] = useState<UserProfile>({
        id: user?.id || '',
        email: user?.email || '',
        full_name: user?.full_name || 'Khách hàng Farmly',
        phone: user?.phone || '',
        avatar_url: user?.avatar_url || null,
        role: 'CUSTOMER',
    });
    const [addresses, setAddresses] = useState<CustomerAddress[]>([]);

    const showNotification = useCallback((type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        window.setTimeout(() => setToast(null), 3200);
    }, []);

    const loadAccountData = useCallback(async () => {
        setIsLoading(true);
        setIsApiError(false);
        try {
            const [profileData, addressList] = await Promise.all([
                authService.getProfile(),
                authService.getAddresses(),
            ]);

            setProfile((prev) => ({
                ...prev,
                ...profileData,
                email: profileData.email || user?.email || prev.email,
            }));
            setAddresses(Array.isArray(addressList) ? addressList : []);
        } catch {
            setIsApiError(true);
        } finally {
            setIsLoading(false);
        }
    }, [user?.email]);

    useEffect(() => {
        loadAccountData();
    }, [loadAccountData]);

    const handleProfileUpdated = (updated: UserProfile) => {
        setProfile(updated);
        updateUser({
            full_name: updated.full_name,
            phone: updated.phone || undefined,
            avatar_url: updated.avatar_url || undefined,
        });
    };

    const handleLogout = async () => {
        await logout();
        navigate('/', { replace: true });
    };

    return (
        <div className="min-h-screen bg-[#F3F8F3] py-6 sm:py-10 text-gray-900">
            {toast && (
                <div
                    role="status"
                    className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-lg ${toast.type === 'success' ? 'bg-[#1E462D]' : 'bg-red-600'
                        }`}
                >
                    {toast.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-[#DDF2E2] shrink-0" />
                    ) : (
                        <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{toast.text}</span>
                </div>
            )}

            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#163622]">
                            Tài khoản của bạn
                        </h1>
                        <p className="mt-1 text-xs sm:text-sm text-gray-600">
                            Quản lý thông tin cá nhân, sổ địa chỉ nhận hàng và bảo mật tài khoản tại FARMLY
                        </p>
                    </div>

                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#1B4332] shadow-2xs">
                        <span className="h-2 w-2 rounded-full bg-[#1E462D]" />
                        Thành viên Farmly
                    </span>
                </div>

                {isApiError && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
                        <div className="flex items-center gap-2">
                            <WifiOff className="h-4 w-4 shrink-0 text-amber-700" />
                            <span>Không thể tải dữ liệu mới nhất từ máy chủ API.</span>
                        </div>
                        <button
                            type="button"
                            onClick={loadAccountData}
                            className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-amber-900/10 px-3 py-1 font-bold hover:bg-amber-900/20"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Thử lại</span>
                        </button>
                    </div>
                )}

                {/* Tab cuộn ngang trên Mobile (< 1024px) */}
                <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 lg:hidden">
                    {PROFILE_TABS.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.key;
                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setActiveTab(item.key)}
                                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-bold transition ${isActive
                                        ? 'bg-[#1E462D] text-white shadow-xs'
                                        : 'border border-emerald-900/10 bg-white text-gray-700'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
                    <ProfileSidebar
                        fullName={profile.full_name}
                        email={profile.email}
                        avatarUrl={profile.avatar_url}
                        activeTab={activeTab}
                        onSelectTab={setActiveTab}
                        onLogout={handleLogout}
                    />

                    <main className="lg:col-span-8">
                        {isLoading ? (
                            <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 sm:p-8 space-y-5 animate-pulse">
                                <div className="h-7 w-48 rounded-lg bg-gray-200" />
                                <div className="h-24 w-full rounded-2xl bg-gray-100" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="h-12 rounded-xl bg-gray-100" />
                                    <div className="h-12 rounded-xl bg-gray-100" />
                                    <div className="h-12 rounded-xl bg-gray-100" />
                                    <div className="h-12 rounded-xl bg-gray-100" />
                                </div>
                            </div>
                        ) : activeTab === 'info' ? (
                            <ProfileInfoTab
                                profile={profile}
                                onProfileUpdated={handleProfileUpdated}
                                onNotify={showNotification}
                            />
                        ) : activeTab === 'addresses' ? (
                            <AddressBookTab
                                addresses={addresses}
                                defaultName={profile.full_name}
                                defaultPhone={profile.phone || ''}
                                onAddressesChange={setAddresses}
                                onNotify={showNotification}
                            />
                        ) : (
                            <ChangePasswordTab onNotify={showNotification} />
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;