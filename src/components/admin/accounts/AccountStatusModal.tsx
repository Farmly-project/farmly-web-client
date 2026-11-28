import { useState, type FormEvent } from "react";
import { Loader2, Lock, Unlock, X } from "lucide-react";
import type { StaffAccountRecord } from "../../../types/account.types";

interface AccountStatusModalProps {
  account: StaffAccountRecord;
  onClose: () => void;
  onConfirm: (nextIsActive: boolean, reason?: string) => Promise<void>;
}

const ROLE_LABEL: Record<string, string> = {
  farm_staff: "Nhân viên Nông trại",
  sales: "Nhân viên Bán hàng / CSKH",
  admin: "Quản trị viên",
};

export function AccountStatusModal({
  account,
  onClose,
  onConfirm,
}: AccountStatusModalProps) {
  const nextIsActive = !account.is_active;
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedReason = reason.trim();
    if (trimmedReason.length > 300) {
      setError("Lý do tối đa 300 ký tự.");
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(nextIsActive, trimmedReason || undefined);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể cập nhật trạng thái tài khoản.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-farmly-soft shadow-xl max-w-md w-full overflow-hidden">
        <div
          className={`px-5 py-4 border-b border-farmly-soft flex items-center justify-between ${
            nextIsActive ? "bg-farmly-mint" : "bg-farmly-cream"
          }`}
        >
          <div
            className={`flex items-center gap-2 ${
              nextIsActive ? "text-farmly-dark" : "text-farmly-badge"
            }`}
          >
            {nextIsActive ? <Unlock size={18} /> : <Lock size={18} />}
            <h3 className="font-bold text-sm">
              {nextIsActive
                ? "Mở khóa tài khoản nhân viên"
                : "Khóa tài khoản nhân viên"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded-lg text-slate-600 hover:bg-white/60 transition"
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-[#F7FBF7] border border-farmly-soft text-xs space-y-1">
            <p className="font-bold text-sm text-farmly-dark">
              {account.full_name}
            </p>
            <p className="text-slate-600">{account.email}</p>
            <p className="text-farmly-dot font-semibold">
              Vai trò: {ROLE_LABEL[account.role] ?? account.role}
            </p>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {nextIsActive
              ? "Tài khoản sẽ được phép đăng nhập trở lại vào hệ thống vận hành Farmly."
              : "Nhân viên sẽ bị chặn đăng nhập ngay lập tức cho đến khi Quản trị viên mở khóa lại."}
          </p>

          <div>
            <label className="block text-xs font-bold text-farmly-dark mb-1">
              Lý do ghi nhận nhật ký (tùy chọn)
            </label>
            <textarea
              rows={2}
              maxLength={300}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                nextIsActive
                  ? "VD: Nhân viên quay lại làm việc..."
                  : "VD: Tạm nghỉ việc / chuyển giao công tác..."
              }
              className="w-full px-3.5 py-2 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
            />
          </div>

          {error && (
            <div className="px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
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
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-60 transition ${
                nextIsActive
                  ? "bg-farmly-dark hover:bg-farmly-dark-hover"
                  : "bg-farmly-badge hover:opacity-90"
              }`}
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {nextIsActive ? "Xác nhận mở khóa" : "Xác nhận khóa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
