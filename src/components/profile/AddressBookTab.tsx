import { useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, Star, Loader2, X } from 'lucide-react';
import { authService } from '../../services/authService';
import { ApiError } from '../../services/apiClient';
import type { CustomerAddress } from '../../types/auth.types';

interface AddressBookTabProps {
    addresses: CustomerAddress[];
    defaultName: string;
    defaultPhone: string;
    onAddressesChange: (next: CustomerAddress[]) => void;
    onNotify: (type: 'success' | 'error', text: string) => void;
}

export function AddressBookTab({
    addresses,
    defaultName,
    defaultPhone,
    onAddressesChange,
    onNotify,
}: AddressBookTabProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [recipientName, setRecipientName] = useState('');
    const [phone, setPhone] = useState('');
    const [addressLine, setAddressLine] = useState('');
    const [ward, setWard] = useState('');
    const [district, setDistrict] = useState('');
    const [province, setProvince] = useState('TP. Hồ Chí Minh');
    const [isDefault, setIsDefault] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [busyId, setBusyId] = useState<number | null>(null);

    const openCreateForm = () => {
        setEditingId(null);
        setRecipientName(defaultName);
        setPhone(defaultPhone);
        setAddressLine('');
        setWard('');
        setDistrict('');
        setProvince('TP. Hồ Chí Minh');
        setIsDefault(addresses.length === 0);
        setIsFormOpen(true);
    };

    const openEditForm = (addr: CustomerAddress) => {
        setEditingId(addr.id);
        setRecipientName(addr.recipient_name);
        setPhone(addr.phone);
        setAddressLine(addr.address_line);
        setWard(addr.ward || '');
        setDistrict(addr.district || '');
        setProvince(addr.province || 'TP. Hồ Chí Minh');
        setIsDefault(addr.is_default);
        setIsFormOpen(true);
    };

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        if (
            !recipientName.trim() ||
            !phone.trim() ||
            !addressLine.trim() ||
            !ward.trim() ||
            !province.trim()
        ) {
            onNotify('error', 'Vui lòng điền đầy đủ Người nhận, SĐT, Địa chỉ, Phường/Xã và Tỉnh/Thành phố.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                recipient_name: recipientName.trim(),
                phone: phone.replace(/\s+/g, ''),
                address_line: addressLine.trim(),
                ward: ward.trim(),
                ...(district.trim() ? { district: district.trim() } : {}),
                province: province.trim(),
                is_default: isDefault,
            };

            if (editingId !== null) {
                const updated = await authService.updateAddress(editingId, payload);
                const nextList = addresses.map((item) => {
                    if (item.id === editingId) return { ...item, ...payload, ...updated };
                    return isDefault ? { ...item, is_default: false } : item;
                });
                onAddressesChange(nextList);
                onNotify('success', 'Đã cập nhật địa chỉ giao hàng.');
            } else {
                const created = await authService.createAddress(payload);
                const resetList = isDefault
                    ? addresses.map((item) => ({ ...item, is_default: false }))
                    : addresses;
                onAddressesChange([...resetList, created]);
                onNotify('success', 'Đã thêm địa chỉ giao hàng mới.');
            }

            setIsFormOpen(false);
        } catch (err) {
            const msg = err instanceof ApiError ? err.message : 'Không thể lưu địa chỉ giao hàng.';
            onNotify('error', msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSetDefault = async (id: number) => {
        setBusyId(id);
        try {
            await authService.updateAddress(id, { is_default: true });
            onAddressesChange(
                addresses.map((item) => ({
                    ...item,
                    is_default: item.id === id,
                }))
            );
            onNotify('success', 'Đã đặt làm địa chỉ nhận hàng mặc định.');
        } catch (err) {
            const msg = err instanceof ApiError ? err.message : 'Không thể cập nhật địa chỉ mặc định.';
            onNotify('error', msg);
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (id: number) => {
        setBusyId(id);
        try {
            await authService.deleteAddress(id);
            const remaining = addresses.filter((item) => item.id !== id);
            if (remaining.length > 0 && !remaining.some((item) => item.is_default)) {
                remaining[0] = { ...remaining[0], is_default: true };
            }
            onAddressesChange(remaining);
            onNotify('success', 'Đã xóa địa chỉ khỏi sổ địa chỉ.');
        } catch (err) {
            const msg = err instanceof ApiError ? err.message : 'Không thể xóa địa chỉ này.';
            onNotify('error', msg);
        } finally {
            setBusyId(null);
        }
    };

    const formatAreaLine = (addr: CustomerAddress) =>
        [addr.ward, addr.district, addr.province].filter(Boolean).join(', ');

    return (
        <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 sm:p-8 shadow-2xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                        Sổ địa chỉ giao hàng
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-gray-500">
                        Quản lý địa chỉ nhận rau tận nhà tại TP.HCM để tính phí giao hàng nhanh
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openCreateForm}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1E462D] px-4 text-xs sm:text-sm font-bold text-white hover:bg-[#163622] transition"
                >
                    <Plus className="h-4 w-4" />
                    <span>Thêm địa chỉ mới</span>
                </button>
            </div>

            {isFormOpen && (
                <form
                    onSubmit={handleSave}
                    className="rounded-2xl border border-emerald-900/15 bg-[#F3F8F3] p-4 sm:p-5 space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-[#163622]">
                            {editingId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ nhận hàng mới'}
                        </h3>
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            aria-label="Đóng biểu mẫu địa chỉ"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-white"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                Tên người nhận *
                            </label>
                            <input
                                type="text"
                                value={recipientName}
                                onChange={(e) => setRecipientName(e.target.value)}
                                placeholder="VD: Nguyễn Minh Anh"
                                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm focus:border-[#1E462D] focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                Số điện thoại nhận hàng *
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="0912345678"
                                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm focus:border-[#1E462D] focus:outline-none"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                Số nhà, tên đường *
                            </label>
                            <input
                                type="text"
                                value={addressLine}
                                onChange={(e) => setAddressLine(e.target.value)}
                                placeholder="VD: 31 Trần Hưng Đạo"
                                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm focus:border-[#1E462D] focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                Phường / Xã *
                            </label>
                            <input
                                type="text"
                                value={ward}
                                onChange={(e) => setWard(e.target.value)}
                                placeholder="VD: Phường Võ Thị Sáu"
                                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm focus:border-[#1E462D] focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                Quận / Huyện
                            </label>
                            <input
                                type="text"
                                value={district}
                                onChange={(e) => setDistrict(e.target.value)}
                                placeholder="VD: Quận 3"
                                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm focus:border-[#1E462D] focus:outline-none"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                Tỉnh / Thành phố *
                            </label>
                            <input
                                type="text"
                                value={province}
                                onChange={(e) => setProvince(e.target.value)}
                                placeholder="VD: TP. Hồ Chí Minh"
                                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm focus:border-[#1E462D] focus:outline-none"
                            />
                        </div>
                    </div>

                    <label className="inline-flex min-h-11 items-center gap-2.5 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={isDefault}
                            onChange={(e) => setIsDefault(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-[#1E462D] focus:ring-[#1E462D]"
                        />
                        <span className="text-xs sm:text-sm font-semibold text-gray-700">
                            Đặt làm địa chỉ giao hàng mặc định
                        </span>
                    </label>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-xs sm:text-sm font-bold text-gray-700 hover:bg-gray-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#1E462D] px-5 text-xs sm:text-sm font-bold text-white hover:bg-[#163622] disabled:opacity-60"
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            <span>Lưu địa chỉ</span>
                        </button>
                    </div>
                </form>
            )}

            {addresses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
                    Bạn chưa lưu địa chỉ giao hàng nào. Hãy thêm địa chỉ đầu tiên để đặt rau nhanh hơn.
                </div>
            ) : (
                <div className="space-y-3">
                    {addresses.map((addr) => {
                        const isBusy = busyId === addr.id;
                        return (
                            <div
                                key={addr.id}
                                className={`rounded-2xl border p-4 sm:p-5 transition ${addr.is_default
                                        ? 'border-[#1E462D]/40 bg-[#F3F8F3]/60'
                                        : 'border-gray-200 bg-white'
                                    }`}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-extrabold text-gray-900">
                                                {addr.recipient_name}
                                            </span>
                                            <span className="text-xs text-gray-400">|</span>
                                            <span className="text-xs sm:text-sm font-semibold text-gray-700">
                                                {addr.phone}
                                            </span>
                                            {addr.is_default && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-[#DDF2E2] px-2.5 py-0.5 text-[11px] font-bold text-[#1B4332]">
                                                    <Star className="h-3 w-3 fill-[#1B4332]" />
                                                    Mặc định
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs sm:text-sm text-gray-700">{addr.address_line}</p>
                                        <p className="text-xs text-gray-500">{formatAreaLine(addr)}</p>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        {!addr.is_default && (
                                            <button
                                                type="button"
                                                disabled={isBusy}
                                                onClick={() => handleSetDefault(addr.id)}
                                                className="min-h-11 rounded-xl border border-emerald-900/15 bg-white px-3 text-xs font-bold text-[#1B4332] hover:bg-[#DDF2E2]/60 disabled:opacity-50 transition"
                                            >
                                                Đặt mặc định
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            disabled={isBusy}
                                            onClick={() => openEditForm(addr)}
                                            aria-label="Sửa địa chỉ"
                                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-[#1B4332] disabled:opacity-50 transition"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isBusy}
                                            onClick={() => handleDelete(addr.id)}
                                            aria-label="Xóa địa chỉ"
                                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:text-red-600 disabled:opacity-50 transition"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}