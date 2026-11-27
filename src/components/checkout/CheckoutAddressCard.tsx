import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, Check, Snowflake, Loader2, X, ExternalLink } from 'lucide-react';
import { authService } from '../../services/authService';
import { ApiError } from '../../services/apiClient';
import type { CustomerAddress } from '../../types/auth.types';

interface CheckoutAddressCardProps {
    addresses: CustomerAddress[];
    selectedAddressId: number | null;
    defaultRecipientName: string;
    defaultPhone: string;
    isLoadingAddresses?: boolean;
    onSelectAddress: (id: number) => void;
    onAddressAdded: (created: CustomerAddress) => void;
    onNotify: (type: 'success' | 'error', text: string) => void;
}

export function CheckoutAddressCard({
    addresses,
    selectedAddressId,
    defaultRecipientName,
    defaultPhone,
    isLoadingAddresses = false,
    onSelectAddress,
    onAddressAdded,
    onNotify,
}: CheckoutAddressCardProps) {
    const [isSelectingOther, setIsSelectingOther] = useState(false);
    const [isAddingNew, setIsAddingNew] = useState(false);

    const [recipientName, setRecipientName] = useState(defaultRecipientName);
    const [phone, setPhone] = useState(defaultPhone);
    const [addressLine, setAddressLine] = useState('');
    const [ward, setWard] = useState('');
    const [district, setDistrict] = useState('');
    const [province, setProvince] = useState('TP. Hồ Chí Minh');
    const [isDefault, setIsDefault] = useState(addresses.length === 0);
    const [isSaving, setIsSaving] = useState(false);

    // Đồng bộ tên & SĐT từ Profile ngay khi API trả về
    useEffect(() => {
        if (!recipientName && defaultRecipientName) setRecipientName(defaultRecipientName);
        if (!phone && defaultPhone) setPhone(defaultPhone);
    }, [defaultRecipientName, defaultPhone, recipientName, phone]);

    // Ưu tiên địa chỉ đang chọn -> địa chỉ mặc định -> địa chỉ đầu tiên
    const selectedAddress =
        addresses.find((a) => a.id === selectedAddressId) ||
        addresses.find((a) => a.is_default) ||
        addresses[0] ||
        null;

    const formatArea = (addr: CustomerAddress) =>
        [addr.ward, addr.district, addr.province].filter(Boolean).join(', ');

    const openAddForm = () => {
        setRecipientName(defaultRecipientName);
        setPhone(defaultPhone);
        setAddressLine('');
        setWard('');
        setDistrict('');
        setProvince('TP. Hồ Chí Minh');
        setIsDefault(addresses.length === 0);
        setIsAddingNew(true);
        setIsSelectingOther(false);
    };

    const handleCreateAddress = async (e: FormEvent) => {
        e.preventDefault();
        if (
            !recipientName.trim() ||
            !phone.trim() ||
            !addressLine.trim() ||
            !ward.trim() ||
            !province.trim()
        ) {
            onNotify('error', 'Vui lòng nhập đủ Người nhận, SĐT, Địa chỉ, Phường/Xã và Tỉnh/Thành phố.');
            return;
        }

        setIsSaving(true);
        try {
            const created = await authService.createAddress({
                recipient_name: recipientName.trim(),
                phone: phone.replace(/\s+/g, ''),
                address_line: addressLine.trim(),
                ward: ward.trim(),
                ...(district.trim() ? { district: district.trim() } : {}),
                province: province.trim(),
                is_default: isDefault,
            });

            onAddressAdded(created);
            onSelectAddress(created.id);
            setIsAddingNew(false);
            onNotify('success', 'Đã lưu vào sổ địa chỉ và chọn giao hàng.');
        } catch (err) {
            const msg = err instanceof ApiError ? err.message : 'Không thể lưu địa chỉ giao hàng.';
            onNotify('error', msg);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <section className="rounded-3xl border border-emerald-900/10 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DDF2E2] text-[#1B4332]">
                        <MapPin className="h-4 w-4" />
                    </div>
                    <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
                        1. Địa chỉ nhận hàng
                    </h2>
                </div>

                <div className="flex items-center gap-1.5">
                    <Link
                        to="/profile?tab=addresses"
                        className="inline-flex min-h-11 items-center gap-1 rounded-xl px-2.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition"
                    >
                        <span>Sổ địa chỉ</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                    </Link>

                    <button
                        type="button"
                        onClick={openAddForm}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-xs sm:text-sm font-bold text-[#1B4332] hover:bg-[#F3F8F3] transition"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Thêm địa chỉ mới</span>
                    </button>
                </div>
            </div>

            {/* Skeleton khi đang tải địa chỉ mặc định từ Profile */}
            {isLoadingAddresses && (
                <div className="h-24 animate-pulse rounded-2xl bg-[#F3F8F3]" />
            )}

            {/* Form thêm địa chỉ mới nhanh ngay tại Checkout */}
            {!isLoadingAddresses && isAddingNew && (
                <form
                    onSubmit={handleCreateAddress}
                    className="rounded-2xl border border-emerald-900/15 bg-[#F3F8F3] p-4 space-y-3.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-extrabold text-[#163622]">
                            Thêm địa chỉ nhận hàng mới (tự lưu vào Hồ sơ)
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsAddingNew(false)}
                            aria-label="Đóng"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-white"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <input
                            type="text"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            placeholder="Tên người nhận *"
                            className="h-11 rounded-xl border border-gray-200 bg-white px-3.5 text-sm focus:border-[#1E462D] focus:outline-none"
                        />
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Số điện thoại *"
                            className="h-11 rounded-xl border border-gray-200 bg-white px-3.5 text-sm focus:border-[#1E462D] focus:outline-none"
                        />
                        <input
                            type="text"
                            value={addressLine}
                            onChange={(e) => setAddressLine(e.target.value)}
                            placeholder="Số nhà, tên đường * (VD: 31 Trần Hưng Đạo)"
                            className="sm:col-span-2 h-11 rounded-xl border border-gray-200 bg-white px-3.5 text-sm focus:border-[#1E462D] focus:outline-none"
                        />
                        <input
                            type="text"
                            value={ward}
                            onChange={(e) => setWard(e.target.value)}
                            placeholder="Phường / Xã * (VD: Phường Võ Thị Sáu)"
                            className="h-11 rounded-xl border border-gray-200 bg-white px-3.5 text-sm focus:border-[#1E462D] focus:outline-none"
                        />
                        <input
                            type="text"
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            placeholder="Quận / Huyện (VD: Quận 3)"
                            className="h-11 rounded-xl border border-gray-200 bg-white px-3.5 text-sm focus:border-[#1E462D] focus:outline-none"
                        />
                        <input
                            type="text"
                            value={province}
                            onChange={(e) => setProvince(e.target.value)}
                            placeholder="Tỉnh / Thành phố *"
                            className="sm:col-span-2 h-11 rounded-xl border border-gray-200 bg-white px-3.5 text-sm focus:border-[#1E462D] focus:outline-none"
                        />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <label className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isDefault}
                                onChange={(e) => setIsDefault(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-[#1E462D]"
                            />
                            <span>Đặt làm địa chỉ mặc định</span>
                        </label>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsAddingNew(false)}
                                className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-xs font-bold text-gray-700"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#1E462D] px-4 text-xs font-bold text-white disabled:opacity-60"
                            >
                                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                <span>Lưu & Chọn</span>
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* Thẻ địa chỉ mặc định tự động điền từ Profile */}
            {!isLoadingAddresses && !isAddingNew && selectedAddress && !isSelectingOther && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1E462D]/30 bg-[#F3F8F3]/80 p-4">
                    <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#1E462D]">
                            <span className="h-2.5 w-2.5 rounded-full bg-[#1E462D]" />
                        </span>

                        <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-extrabold text-gray-900">
                                    {selectedAddress.recipient_name}
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs sm:text-sm font-semibold text-gray-700">
                                    {selectedAddress.phone}
                                </span>
                                {selectedAddress.is_default && (
                                    <span className="rounded-full bg-[#DDF2E2] px-2.5 py-0.5 text-[11px] font-bold text-[#1B4332]">
                                        Mặc định
                                    </span>
                                )}
                            </div>
                            <p className="text-xs sm:text-sm font-medium text-gray-800">
                                {selectedAddress.address_line}
                            </p>
                            <p className="text-xs text-gray-500">{formatArea(selectedAddress)}</p>
                        </div>
                    </div>

                    {addresses.length > 1 && (
                        <button
                            type="button"
                            onClick={() => setIsSelectingOther(true)}
                            className="min-h-11 rounded-xl border border-gray-200 bg-white px-4 text-xs font-bold text-gray-800 hover:bg-gray-50 transition"
                        >
                            Thay đổi
                        </button>
                    )}
                </div>
            )}

            {/* Danh sách chọn các địa chỉ đã lưu trong Profile */}
            {!isLoadingAddresses && !isAddingNew && isSelectingOther && (
                <div className="space-y-2.5">
                    {addresses.map((addr) => {
                        const active = addr.id === selectedAddress?.id;
                        return (
                            <button
                                key={addr.id}
                                type="button"
                                onClick={() => {
                                    onSelectAddress(addr.id);
                                    setIsSelectingOther(false);
                                }}
                                className={`flex w-full items-start justify-between gap-3 rounded-2xl border p-3.5 text-left transition ${active
                                        ? 'border-[#1E462D] bg-[#F3F8F3]'
                                        : 'border-gray-200 bg-white hover:bg-gray-50'
                                    }`}
                            >
                                <div className="space-y-0.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-bold text-gray-900">{addr.recipient_name}</span>
                                        <span className="text-xs text-gray-600">• {addr.phone}</span>
                                        {addr.is_default && (
                                            <span className="rounded-full bg-[#DDF2E2] px-2 py-0.5 text-[10px] font-bold text-[#1B4332]">
                                                Mặc định
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-700">{addr.address_line}</p>
                                    <p className="text-xs text-gray-500">{formatArea(addr)}</p>
                                </div>
                                {active && <Check className="h-4 w-4 text-[#1E462D] shrink-0 mt-1" />}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Trạng thái chưa có địa chỉ trong Profile */}
            {!isLoadingAddresses && !isAddingNew && addresses.length === 0 && (
                <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 p-4 text-center">
                    <p className="text-xs sm:text-sm font-semibold text-amber-900">
                        Hồ sơ của bạn chưa có địa chỉ nhận hàng mặc định. Thêm ngay bên dưới để tính phí giao
                        hàng.
                    </p>
                    <button
                        type="button"
                        onClick={openAddForm}
                        className="mt-2.5 inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#1E462D] px-4 text-xs font-bold text-white"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Thêm địa chỉ mặc định</span>
                    </button>
                </div>
            )}

            <div className="flex items-center gap-2.5 rounded-xl bg-[#EFF3FA] px-3.5 py-2.5 text-xs text-gray-600">
                <Snowflake className="h-4 w-4 text-[#1B4332] shrink-0" />
                <span>
                    Hỗ trợ <strong className="text-gray-800">giao hàng tươi trong ngày</strong> tại khu vực
                    nội thành TP.HCM (Bảo quản mát tiêu chuẩn giữ trọn độ giòn ngọt).
                </span>
            </div>
        </section>
    );
}