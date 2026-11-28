import { useState, type FormEvent } from "react";
import { Loader2, Plus, Sprout, X } from "lucide-react";
import type { ProductRecord } from "../../../types/catalog.types";
import type { CreateBatchPayload } from "../../../types/inventory.types";

interface CreateBatchModalProps {
  products: ProductRecord[];
  defaultProductId?: number;
  onClose: () => void;
  onSubmit: (payload: CreateBatchPayload) => Promise<void>;
}

export function CreateBatchModal({
  products,
  defaultProductId,
  onClose,
  onSubmit,
}: CreateBatchModalProps) {
  const [productId, setProductId] = useState<string>(
    defaultProductId
      ? String(defaultProductId)
      : products[0]
        ? String(products[0].id)
        : "",
  );
  const [batchCode, setBatchCode] = useState("");
  const [status, setStatus] = useState<"growing" | "in_stock">("in_stock");
  const [initialQuantity, setInitialQuantity] = useState("50");
  const [sowingDate, setSowingDate] = useState("");
  const [harvestDate, setHarvestDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [expDate, setExpDate] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = products.find((p) => String(p.id) === productId);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!productId) {
      setError("Vui lòng chọn sản phẩm nông sản.");
      return;
    }

    const qty = Number(initialQuantity);
    if (Number.isNaN(qty) || qty <= 0) {
      setError("Số lượng nhập kho phải lớn hơn 0.");
      return;
    }

    const trimmedCode = batchCode.trim();
    if (trimmedCode.length > 100) {
      setError("Mã lô tối đa 100 ký tự.");
      return;
    }

    if (status === "in_stock") {
      if (sowingDate && harvestDate && sowingDate > harvestDate) {
        setError("Ngày gieo hạt không được sau ngày thu hoạch.");
        return;
      }
      if (harvestDate && expDate && expDate < harvestDate) {
        setError("Hạn sử dụng không được trước ngày thu hoạch.");
        return;
      }
    }

    const payload: CreateBatchPayload = {
      product_id: Number(productId),
      initial_quantity: qty,
      status,
      ...(trimmedCode ? { batch_code: trimmedCode } : {}),
      ...(sowingDate ? { sowing_date: sowingDate } : {}),
      ...(status === "in_stock"
        ? {
            ...(harvestDate ? { harvest_date: harvestDate } : {}),
            ...(expDate ? { exp_date: expDate } : {}),
          }
        : {}),
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Không thể khởi tạo lô hàng mới.",
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
              <Sprout size={16} />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Khởi tạo Lô hàng / Nhập kho mới
              </h3>
              <p className="text-xs text-slate-600">
                Tạo lô đang canh tác hoặc nhập thẳng lô đã thu hoạch vào kho FEFO
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
              Sản phẩm nông sản <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-farmly-soft text-sm bg-white focus:outline-none focus:border-farmly-dark"
            >
              {products.length === 0 ? (
                <option value="">Chưa có sản phẩm nào</option>
              ) : (
                products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.unit}) — Bảo quản {p.preservation_days} ngày
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-farmly-dark mb-1">
                Mã lô (tùy chọn)
              </label>
              <input
                type="text"
                maxLength={100}
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
                placeholder="Để trống để tự sinh BATCH-..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-farmly-soft text-sm font-mono focus:outline-none focus:border-farmly-dark"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-farmly-dark mb-1">
                Sản lượng ({selectedProduct?.unit ?? "kg"}){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={0.1}
                step="0.5"
                value={initialQuantity}
                onChange={(e) => setInitialQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-farmly-dark mb-1">
              Trạng thái khởi tạo <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <label
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  status === "in_stock"
                    ? "bg-farmly-mint border-farmly-dark"
                    : "bg-white border-farmly-soft"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="batch_status"
                    checked={status === "in_stock"}
                    onChange={() => setStatus("in_stock")}
                    className="accent-[#1e4620]"
                  />
                  <span className="text-xs font-bold text-farmly-dark">
                    Nhập kho sẵn bán
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 pl-5">
                  Đã thu hoạch, có HSD (in_stock)
                </p>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  status === "growing"
                    ? "bg-farmly-mint border-farmly-dark"
                    : "bg-white border-farmly-soft"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="batch_status"
                    checked={status === "growing"}
                    onChange={() => setStatus("growing")}
                    className="accent-[#1e4620]"
                  />
                  <span className="text-xs font-bold text-farmly-dark">
                    Đang canh tác
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 pl-5">
                  Chưa thu hoạch (growing)
                </p>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-farmly-dark mb-1">
                Ngày gieo hạt
              </label>
              <input
                type="date"
                value={sowingDate}
                onChange={(e) => setSowingDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-farmly-soft text-xs focus:outline-none focus:border-farmly-dark"
              />
            </div>

            {status === "in_stock" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-farmly-dark mb-1">
                    Ngày thu hoạch
                  </label>
                  <input
                    type="date"
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-farmly-soft text-xs focus:outline-none focus:border-farmly-dark"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-farmly-dark mb-1">
                    Hạn sử dụng
                  </label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    title="Để trống để tự cộng theo số ngày bảo quản của sản phẩm"
                    className="w-full px-3 py-2 rounded-xl border border-farmly-soft text-xs focus:outline-none focus:border-farmly-dark"
                  />
                </div>
              </>
            )}
          </div>

          {status === "in_stock" && !expDate && selectedProduct && (
            <p className="text-[11px] text-farmly-dot -mt-1">
              Nếu để trống HSD, hệ thống tự tính = Ngày thu hoạch +{" "}
              {selectedProduct.preservation_days} ngày bảo quản.
            </p>
          )}

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
              disabled={submitting || !productId}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-farmly-dark text-white text-xs font-semibold hover:bg-farmly-dark-hover disabled:opacity-60 transition"
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              Tạo lô hàng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
