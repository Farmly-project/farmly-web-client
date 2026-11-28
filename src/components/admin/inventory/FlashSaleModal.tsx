import { useState, type FormEvent } from "react";
import { Flame, Loader2, X } from "lucide-react";
import type {
  FlashSalePayload,
  InventoryBatchRecord,
} from "../../../types/inventory.types";
import { formatCurrency, formatDate } from "../../../utils/formatters";

interface FlashSaleModalProps {
  batch: InventoryBatchRecord;
  onClose: () => void;
  onSubmit: (payload: FlashSalePayload) => Promise<void>;
}

function toLocalDateTimeInput(isoStr?: string | null): string {
  const baseDate = isoStr ? new Date(isoStr) : new Date(Date.now() + 24 * 3600 * 1000);
  if (Number.isNaN(baseDate.getTime())) return "";
  const offset = baseDate.getTimezoneOffset() * 60000;
  return new Date(baseDate.getTime() - offset).toISOString().slice(0, 16);
}

export function FlashSaleModal({
  batch,
  onClose,
  onSubmit,
}: FlashSaleModalProps) {
  const basePrice = Number(batch.product?.base_price ?? 0);
  const [salePrice, setSalePrice] = useState<string>(() => {
    if (batch.flash_sale_price !== null && batch.flash_sale_price !== undefined) {
      return String(batch.flash_sale_price);
    }
    return basePrice > 0 ? String(Math.round(basePrice * 0.7)) : "0";
  });
  const [endsAt, setEndsAt] = useState<string>(() =>
    toLocalDateTimeInput(batch.flash_sale_ends_at),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyDiscountPercent = (pct: number) => {
    if (basePrice <= 0) return;
    setSalePrice(String(Math.round((basePrice * (100 - pct)) / 100)));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const price = Number(salePrice);
    if (salePrice === "" || Number.isNaN(price) || price < 0) {
      setError("Giá xả hàng phải là số không âm.");
      return;
    }

    if (basePrice > 0 && price >= basePrice) {
      setError(
        `Giá xả hàng (${formatCurrency(price)}) phải thấp hơn giá niêm yết (${formatCurrency(basePrice)}).`,
      );
      return;
    }

    const isoEndsAt = endsAt ? new Date(endsAt).toISOString() : null;

    setSubmitting(true);
    try {
      await onSubmit({
        flash_sale_price: price,
        flash_sale_ends_at: isoEndsAt,
      });
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Cập nhật cấu hình Flash Sale thất bại.",
      );
      setSubmitting(false);
    }
  };

  const handleTurnOff = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        flash_sale_price: null,
        flash_sale_ends_at: null,
      });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Không thể tắt Flash Sale.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-farmly-soft shadow-xl max-w-md w-full overflow-hidden">
        <div className="px-5 py-4 bg-farmly-cream border-b border-farmly-soft flex items-center justify-between">
          <div className="flex items-center gap-2 text-farmly-badge">
            <Flame size={18} />
            <div>
              <h3 className="font-bold text-sm leading-tight">
                Xả hàng Flash Sale — {batch.batch_code}
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

          <div className="p-3 rounded-xl bg-[#F7FBF7] border border-farmly-soft text-xs flex items-center justify-between">
            <span className="text-slate-600">Giá niêm yết gốc:</span>
            <strong className="text-farmly-dark text-sm">
              {formatCurrency(basePrice)} / {batch.product?.unit ?? "kg"}
            </strong>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-farmly-dark">
                Giá xả hàng Flash Sale (VNĐ){" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-1">
                {[20, 30, 50].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => applyDiscountPercent(pct)}
                    className="px-2 py-0.5 rounded bg-farmly-mint text-farmly-dark text-[11px] font-bold hover:bg-farmly-cream transition"
                  >
                    -{pct}%
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              required
              min={0}
              step={500}
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-farmly-dark mb-1">
              Thời điểm kết thúc Flash Sale
            </label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            {batch.flash_sale_price !== null &&
            batch.flash_sale_price !== undefined ? (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleTurnOff()}
                className="px-3.5 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition"
              >
                Tắt Flash Sale
              </button>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-farmly-dark text-white text-xs font-semibold hover:bg-farmly-dark-hover disabled:opacity-60 transition"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Lưu Flash Sale
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
