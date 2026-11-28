import { useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

interface ConfirmDeleteModalProps {
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export function ConfirmDeleteModal({
  title,
  description,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Xóa dữ liệu thất bại.");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-farmly-soft shadow-xl max-w-md w-full overflow-hidden">
        <div className="px-5 py-4 bg-farmly-cream border-b border-farmly-soft flex items-center justify-between">
          <div className="flex items-center gap-2 text-farmly-badge">
            <AlertTriangle size={18} />
            <h3 className="font-bold text-sm">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="p-1 rounded-lg text-farmly-badge hover:bg-white/60 transition"
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-700 leading-relaxed">{description}</p>

          {error && (
            <div className="px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={deleting}
              className="px-4 py-2 rounded-xl border border-farmly-soft text-xs font-semibold text-farmly-dark hover:bg-farmly-mint/50 transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-60 transition"
            >
              {deleting && <Loader2 size={14} className="animate-spin" />}
              Xác nhận xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
