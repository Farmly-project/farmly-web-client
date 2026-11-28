import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, UserPlus, X } from "lucide-react";
import type {
  CreateStaffAccountPayload,
  StaffRole,
} from "../../../types/account.types";

interface CreateStaffModalProps {
  onClose: () => void;
  onSubmit: (payload: CreateStaffAccountPayload) => Promise<void>;
}

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/;
const PHONE_REGEX = /^(0|\+84)[0-9]{9,10}$/;

export function CreateStaffModal({ onClose, onSubmit }: CreateStaffModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<StaffRole>("farm_staff");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim().replace(/\s+/g, "");

    if (trimmedName.length < 2 || trimmedName.length > 150) {
      setError("Họ và tên nhân viên phải từ 2 đến 150 ký tự.");
      return;
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Email đăng nhập không đúng định dạng.");
      return;
    }

    if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
      setError(
        "Số điện thoại Việt Nam không hợp lệ (VD: 0901234567 hoặc +84901234567).",
      );
      return;
    }

    if (password.length < 8 || !PASSWORD_REGEX.test(password)) {
      setError(
        "Mật khẩu tối thiểu 8 ký tự và phải bao gồm cả chữ cái lẫn chữ số.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    const payload: CreateStaffAccountPayload = {
      full_name: trimmedName,
      email: trimmedEmail,
      password,
      role,
      ...(trimmedPhone ? { phone: trimmedPhone } : {}),
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể khởi tạo tài khoản nhân viên.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-farmly-soft shadow-xl max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 bg-farmly-mint border-b border-farmly-soft flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-farmly-dark">
            <div className="w-8 h-8 rounded-xl bg-farmly-dark text-white flex items-center justify-center">
              <UserPlus size={16} />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Cấp tài khoản Nhân viên mới
              </h3>
              <p className="text-xs text-slate-600">
                Khởi tạo tài khoản nội bộ cho bộ phận Nông trại hoặc Bán hàng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-farmly-dark hover:bg-white/70 transition"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 max-h-[82vh] overflow-y-auto"
        >
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-farmly-dark mb-1">
              Họ và tên nhân viên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={150}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="VD: Nguyễn Văn An"
              className="w-full px-3.5 py-2.5 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-farmly-dark mb-1">
                Email đăng nhập <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nhanvien@farmly.vn"
                className="w-full px-3.5 py-2.5 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-farmly-dark mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                className="w-full px-3.5 py-2.5 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-farmly-dark mb-1">
              Vai trò phụ trách <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  role === "farm_staff"
                    ? "bg-farmly-mint border-farmly-dark ring-1 ring-farmly-dark/20"
                    : "bg-white border-farmly-soft hover:bg-farmly-mint/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="staff_role"
                    value="farm_staff"
                    checked={role === "farm_staff"}
                    onChange={() => setRole("farm_staff")}
                    className="accent-[#1e4620]"
                  />
                  <span className="text-xs font-bold text-farmly-dark">
                    Nhân viên Nông trại
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 pl-5">
                  Quản lý lô thu hoạch, nhật ký canh tác, QR &amp; xuất hủy
                </p>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  role === "sales"
                    ? "bg-farmly-mint border-farmly-dark ring-1 ring-farmly-dark/20"
                    : "bg-white border-farmly-soft hover:bg-farmly-mint/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="staff_role"
                    value="sales"
                    checked={role === "sales"}
                    onChange={() => setRole("sales")}
                    className="accent-[#1e4620]"
                  />
                  <span className="text-xs font-bold text-farmly-dark">
                    Bán hàng / CSKH
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 pl-5">
                  Duyệt đơn FEFO, Flash Sale &amp; xử lý khiếu nại 24h
                </p>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-farmly-dark mb-1">
                Mật khẩu khởi tạo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-farmly-dark"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-farmly-dark mb-1">
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full px-3.5 py-2.5 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 -mt-2">
            Yêu cầu bảo mật: tối thiểu 8 ký tự, gồm cả chữ cái và chữ số (VD:
            Farmly2026).
          </p>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-farmly-soft">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-farmly-soft text-xs font-semibold text-farmly-dark hover:bg-farmly-mint/50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-farmly-dark text-white text-xs font-semibold hover:bg-farmly-dark-hover disabled:opacity-60 transition"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Tạo tài khoản
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
