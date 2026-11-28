import { useState, type FormEvent } from "react";
import { Loader2, Trash2, Upload, X } from "lucide-react";
import type {
  CreateDisposalPayload,
  DisposalReason,
  InventoryBatchRecord,
} from "../../../types/inventory.types";
import { formatDate } from "../../../utils/formatters";

interface DisposalModalProps {
  batch: InventoryBatchRecord;
  onClose: () => void;
  onSubmit: (payload: CreateDisposalPayload) => Promise<void>;
}

const ACCEPTED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export function DisposalModal({
  batch,
  onClose,
  onSubmit,
}: DisposalModalProps) {
  const maxQty = Number(batch.current_quantity ?? 0);
  const [quantity, setQuantity] = useState<string>(
    batch.is_expired ? String(maxQty) : String(Math.min(1, maxQty)),
  );
  const [reason, setReason] = useState<DisposalReason>(
    batch.is_expired ? "expired" : "damaged",
  );
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedQty = Number(quantity);
    if (Number.isNaN(parsedQty) || parsedQty <= 0) {
      setError("Số lượng xuất hủy phải lớn hơn 0.");
      return;
    }

    if (parsedQty > maxQty) {
      setError(
        `Số lượng xuất hủy (${parsedQty}) vượt quá tồn kho hiện tại (${maxQty}).`,
      );
      return;
    }

    if (!file) {
      setError(
        "Vui lòng đính kèm hình ảnh minh chứng nông sản hỏng/xuất hủy.",
      );
      return;
    }

    if (!ACCEPTED_IMAGE_MIMES.includes(file.type)) {
      setError("Ảnh minh chứng chỉ chấp nhận định dạng JPG, PNG hoặc WEBP.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("Dung lượng ảnh minh chứng tối đa 5 MB.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        batch_id: batch.id,
        quantity_disposed: parsedQty,
        reason,
        note: note.trim() || undefined,
        file,
      });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Lập phiếu xuất hủy thất bại.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-farmly-soft shadow-xl max-w-md w-full overflow-hidden">
        <div className="px-5 py-4 bg-farmly-cream border-b border-farmly-soft flex items-center justify-between">
          <div className="flex items-center gap-2 text-farmly-badge">
            <Trash2 size={18} />
            <div>
              <h3 className="font-bold text-sm leading-tight">
                Xuất hủy Hao hụt — {batch.batch_code}
              </h3>
              <p className="text-[11px] text-slate-600">
                {batch.product?.name} &bull; HSD: {formatDate(batch.exp_date)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded-lg text-farmly-badge hover:bg-white/60 transition"
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="p-3 rounded-xl bg-[#F7FBF7] border border-farmly-soft flex items-center justify-between text-xs">
            <span>
              Tồn khả dụng:{" "}
              <strong className="text-farmly-dark">
                {maxQty} {batch.product?.unit ?? "kg"}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => setQuantity(String(maxQty))}
              className="font-bold text-farmly-badge hover:underline"
            >
              Hủy toàn bộ tồn
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-farmly-dark mb-1">
              Số lượng xuất hủy ({batch.product?.unit ?? "kg"}){" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={0.1}
              max={maxQty}
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-farmly-dark mb-1">
              Lý do xuất hủy <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as DisposalReason)}
              className="w-full px-3.5 py-2 rounded-xl border border-farmly-soft text-sm bg-white focus:outline-none focus:border-farmly-dark"
            >
              <option value="expired">Quá hạn sử dụng (expired)</option>
              <option value="damaged">Dập nát trong lưu kho (damaged)</option>
              <option value="rotten">Hư hỏng / thối rữa (rotten)</option>
              <option value="quality_failed">
                Không đạt chuẩn chất lượng (quality_failed)
              </option>
              <option value="other">Lý do khác (other)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-farmly-dark mb-1">
              Ảnh minh chứng (JPG/PNG/WEBP &le; 5MB){" "}
              <span className="text-red-500">*</span>
            </label>
            <label className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-dashed border-farmly-soft bg-farmly-mint/30 cursor-pointer hover:bg-farmly-mint/50 transition text-xs">
              <Upload size={15} className="text-farmly-dark shrink-0" />
              <span className="truncate text-slate-700">
                {file ? file.name : "Chọn ảnh chụp thực tế lô hàng hỏng..."}
              </span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-farmly-dark mb-1">
              Ghi chú biên bản
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Mô tả tình trạng lô hàng khi kiểm tra..."
              className="w-full px-3.5 py-2 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
            />
          </div>

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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-farmly-badge text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Xác nhận xuất hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
