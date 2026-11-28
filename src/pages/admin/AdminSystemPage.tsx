import React, { useEffect, useState } from "react";
import { Lock, Save, Unlock, UserPlus } from "lucide-react";
import { internalApi } from "../../services/internalApi";
import type { AuthUser, SystemSettings } from "../../types/internalTypes";

export const AdminSystemPage: React.FC = () => {
  const [accounts, setAccounts] = useState<AuthUser[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    expiry_warning_days: 2,
    shipping_fee_per_km: 5000,
    farm_latitude: 10.7769,
    farm_longitude: 106.7009,
  });

  const [newStaff, setNewStaff] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "farm_staff" as "farm_staff" | "sales",
  });

  const loadAll = async () => {
    const [accRes, setRes] = await Promise.all([
      internalApi.getAccounts(),
      internalApi.getSettings(),
    ]);
    setAccounts(accRes.data.data.items || []);
    setSettings(setRes.data.data);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await internalApi.createAccount(newStaff);
      setNewStaff({
        email: "",
        password: "",
        full_name: "",
        phone: "",
        role: "farm_staff",
      });
      loadAll();
      alert("Đã tạo tài khoản nhân viên thành công!");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Lỗi tạo tài khoản");
    }
  };

  const handleToggleStatus = async (acc: AuthUser) => {
    const isCurrentlyActive = !acc.deleted_at;
    await internalApi.updateAccountStatus(acc.id, {
      is_active: !isCurrentlyActive,
      reason: isCurrentlyActive
        ? "Admin tạm khóa tài khoản"
        : "Admin mở khóa tài khoản",
    });
    loadAll();
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await internalApi.updateSettings(settings);
    alert("Đã lưu cấu hình tham số hệ thống!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Cột trái: Cấu hình tham số hệ thống (PUT /settings) */}
      <form
        onSubmit={handleSaveSettings}
        className="bg-white p-5 rounded-2xl border border-farmly-soft space-y-4 h-fit"
      >
        <h2 className="text-lg font-bold text-farmly-dark border-b border-farmly-soft pb-3">
          Tham số Vận hành Hệ thống
        </h2>

        <div>
          <label className="block text-xs font-bold text-farmly-dark mb-1">
            Ngưỡng cảnh báo lô cận hạn (ngày)
          </label>
          <input
            type="number"
            min={1}
            max={30}
            value={settings.expiry_warning_days}
            onChange={(e) =>
              setSettings({
                ...settings,
                expiry_warning_days: Number(e.target.value),
              })
            }
            className="w-full px-3.5 py-2 rounded-xl border border-farmly-soft text-sm"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Cronjob 06:00 sẽ đẩy cảnh báo đỏ cho Sales khi lô còn ≤ số ngày này.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-farmly-dark mb-1">
            Đơn giá phí vận chuyển (VNĐ / km)
          </label>
          <input
            type="number"
            min={0}
            step={500}
            value={settings.shipping_fee_per_km}
            onChange={(e) =>
              setSettings({
                ...settings,
                shipping_fee_per_km: Number(e.target.value),
              })
            }
            className="w-full px-3.5 py-2 rounded-xl border border-farmly-soft text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-farmly-dark mb-1">
              Vĩ độ Farm
            </label>
            <input
              type="number"
              step="0.0001"
              value={settings.farm_latitude}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  farm_latitude: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 rounded-xl border border-farmly-soft text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-farmly-dark mb-1">
              Kinh độ Farm
            </label>
            <input
              type="number"
              step="0.0001"
              value={settings.farm_longitude}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  farm_longitude: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 rounded-xl border border-farmly-soft text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-farmly-dark text-white text-sm font-semibold hover:bg-farmly-dark-hover"
        >
          <Save size={16} />
          Lưu cấu hình hệ thống
        </button>
      </form>

      {/* Cột phải: Tạo & Khóa/Mở khóa tài khoản nhân viên */}
      <div className="lg:col-span-2 space-y-6">
        <form
          onSubmit={handleCreateAccount}
          className="bg-farmly-mint/60 p-5 rounded-2xl border border-farmly-soft space-y-4"
        >
          <h2 className="text-base font-bold text-farmly-dark flex items-center gap-2">
            <UserPlus size={18} />
            Cấp tài khoản Nhân viên mới
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              required
              placeholder="Họ và tên nhân viên"
              value={newStaff.full_name}
              onChange={(e) =>
                setNewStaff({ ...newStaff, full_name: e.target.value })
              }
              className="px-3.5 py-2 rounded-xl bg-white border border-farmly-soft text-sm"
            />
            <input
              required
              type="email"
              placeholder="Email đăng nhập"
              value={newStaff.email}
              onChange={(e) =>
                setNewStaff({ ...newStaff, email: e.target.value })
              }
              className="px-3.5 py-2 rounded-xl bg-white border border-farmly-soft text-sm"
            />
            <input
              required
              type="password"
              minLength={8}
              placeholder="Mật khẩu (>= 8 ký tự, chữ + số)"
              value={newStaff.password}
              onChange={(e) =>
                setNewStaff({ ...newStaff, password: e.target.value })
              }
              className="px-3.5 py-2 rounded-xl bg-white border border-farmly-soft text-sm"
            />
            <select
              value={newStaff.role}
              onChange={(e) =>
                setNewStaff({
                  ...newStaff,
                  role: e.target.value as "farm_staff" | "sales",
                })
              }
              className="px-3.5 py-2 rounded-xl bg-white border border-farmly-soft text-sm font-semibold text-farmly-dark"
            >
              <option value="farm_staff">
                Nhân viên Nông trại (FARM_STAFF)
              </option>
              <option value="sales">Nhân viên Bán hàng / CSKH (SALES)</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-farmly-dark text-white text-sm font-semibold hover:bg-farmly-dark-hover"
          >
            Tạo tài khoản
          </button>
        </form>

        <div className="bg-white rounded-2xl border border-farmly-soft overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-farmly-mint text-farmly-dark font-semibold border-b border-farmly-soft">
              <tr>
                <th className="px-4 py-3">Nhân viên</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-farmly-soft/60">
              {accounts.map((acc) => {
                const isActive = !acc.deleted_at;
                return (
                  <tr key={acc.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-farmly-dark">
                        {acc.full_name}
                      </p>
                      <p className="text-xs text-slate-500">{acc.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-lg bg-farmly-cream text-farmly-badge text-xs font-bold uppercase">
                        {acc.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isActive ? "bg-farmly-dot" : "bg-red-500"
                          }`}
                        />
                        {isActive ? "Đang hoạt động" : "Đã khóa"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleToggleStatus(acc)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-farmly-soft text-xs font-semibold text-farmly-dark hover:bg-farmly-mint"
                      >
                        {isActive ? <Lock size={13} /> : <Unlock size={13} />}
                        {isActive ? "Khóa" : "Mở khóa"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
