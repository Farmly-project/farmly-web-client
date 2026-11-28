import { useState, type FormEvent } from "react";
import { ImagePlus, Loader2, Package, Star, Trash2, X } from "lucide-react";
import type {
  CategoryRecord,
  ProductImageInput,
  ProductPayload,
  ProductRecord,
} from "../../../types/catalog.types";

interface ProductFormModalProps {
  categories: CategoryRecord[];
  initialProduct: ProductRecord | null;
  onClose: () => void;
  onSubmit: (payload: ProductPayload) => Promise<void>;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function ProductFormModal({
  categories,
  initialProduct,
  onClose,
  onSubmit,
}: ProductFormModalProps) {
  const isEditing = Boolean(initialProduct);

  const [name, setName] = useState(initialProduct?.name ?? "");
  const [slug, setSlug] = useState(initialProduct?.slug ?? "");
  const [categoryId, setCategoryId] = useState<string>(
    initialProduct?.category_id ? String(initialProduct.category_id) : "",
  );
  const [unit, setUnit] = useState(initialProduct?.unit ?? "kg");
  const [basePrice, setBasePrice] = useState<string>(
    initialProduct ? String(initialProduct.base_price) : "",
  );
  const [preservationDays, setPreservationDays] = useState<string>(
    initialProduct ? String(initialProduct.preservation_days ?? 5) : "5",
  );
  const [shortDescription, setShortDescription] = useState(
    initialProduct?.short_description ?? "",
  );
  const [description, setDescription] = useState(
    initialProduct?.description ?? "",
  );
  const [isActive, setIsActive] = useState(initialProduct?.is_active ?? true);

  const [images, setImages] = useState<ProductImageInput[]>(() => {
    if (initialProduct?.images && initialProduct.images.length > 0) {
      return initialProduct.images.map((img, idx) => ({
        image_url: img.image_url,
        is_primary: img.is_primary,
        display_order: img.display_order ?? idx,
      }));
    }
    return [];
  });
  const [newImageUrl, setNewImageUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddImage = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    if (!isValidHttpUrl(trimmed)) {
      setError("URL hình ảnh sản phẩm không hợp lệ (cần http:// hoặc https://).");
      return;
    }
    setError(null);
    setImages((prev) => [
      ...prev,
      {
        image_url: trimmed,
        is_primary: prev.length === 0,
        display_order: prev.length,
      },
    ]);
    setNewImageUrl("");
  };

  const handleSetPrimary = (index: number) => {
    setImages((prev) =>
      prev.map((img, idx) => ({
        ...img,
        is_primary: idx === index,
      })),
    );
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const next = prev
        .filter((_, idx) => idx !== index)
        .map((img, idx) => ({ ...img, display_order: idx }));
      if (next.length > 0 && !next.some((img) => img.is_primary)) {
        next[0].is_primary = true;
      }
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();
    const trimmedUnit = unit.trim();
    const parsedPrice = Number(basePrice);
    const parsedPreservationDays = Number(preservationDays);

    if (trimmedName.length < 2 || trimmedName.length > 200) {
      setError("Tên sản phẩm phải từ 2 đến 200 ký tự.");
      return;
    }

    if (trimmedSlug.length > 220) {
      setError("Slug sản phẩm tối đa 220 ký tự.");
      return;
    }

    if (!trimmedUnit || trimmedUnit.length > 50) {
      setError("Đơn vị tính phải từ 1 đến 50 ký tự.");
      return;
    }

    if (basePrice === "" || Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Giá bán cơ bản phải là số không âm.");
      return;
    }

    if (
      !Number.isInteger(parsedPreservationDays) ||
      parsedPreservationDays <= 0
    ) {
      setError("Số ngày bảo quản phải là số nguyên lớn hơn 0.");
      return;
    }

    const pendingUrl = newImageUrl.trim();
    const finalImages = [...images];
    if (pendingUrl) {
      if (!isValidHttpUrl(pendingUrl)) {
        setError("URL hình ảnh đang nhập chưa hợp lệ.");
        return;
      }
      finalImages.push({
        image_url: pendingUrl,
        is_primary: finalImages.length === 0,
        display_order: finalImages.length,
      });
    }

    const payload: ProductPayload = {
      category_id: categoryId ? Number(categoryId) : null,
      name: trimmedName,
      ...(trimmedSlug ? { slug: trimmedSlug } : {}),
      unit: trimmedUnit,
      base_price: parsedPrice,
      preservation_days: parsedPreservationDays,
      short_description: shortDescription.trim() || undefined,
      description: description.trim() || undefined,
      is_active: isActive,
      ...(finalImages.length > 0 || isEditing
        ? {
            images: finalImages.map((img, idx) => ({
              image_url: img.image_url,
              is_primary: img.is_primary ?? idx === 0,
              display_order: idx,
            })),
          }
        : {}),
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Không thể lưu sản phẩm.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-farmly-soft shadow-xl max-w-2xl w-full overflow-hidden">
        <div className="px-6 py-4 bg-farmly-mint border-b border-farmly-soft flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-farmly-dark">
            <div className="w-8 h-8 rounded-xl bg-farmly-dark text-white flex items-center justify-center">
              <Package size={16} />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {isEditing ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
              </h3>
              <p className="text-xs text-slate-600">
                {isEditing
                  ? `Cập nhật thông tin nông sản #${initialProduct?.id}`
                  : "Khai báo nông sản mới vào danh mục kinh doanh"}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-farmly-dark mb-1">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={200}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Cà chua bi hữu cơ Đà Lạt"
                className="w-full px-3.5 py-2.5 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-farmly-dark mb-1">
                Danh mục nông sản
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-farmly-soft text-sm bg-white focus:outline-none focus:border-farmly-dark"
              >
                <option value="">— Chưa phân loại —</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                    {cat.allow_subscription ? " (Hỗ trợ định kỳ)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-farmly-dark mb-1">
                Đường dẫn (Slug)
              </label>
              <input
                type="text"
                maxLength={220}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Để trống để tự tạo từ tên"
                className="w-full px-3.5 py-2.5 rounded-xl border border-farmly-soft text-sm font-mono focus:outline-none focus:border-farmly-dark"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-farmly-dark mb-1">
                Giá bán cơ bản (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                step={500}
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="VD: 35000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-farmly-dark mb-1">
                  Đơn vị tính <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={1}
                  maxLength={50}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="kg, bó, hộp..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-farmly-dark mb-1">
                  Bảo quản (ngày) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  step={1}
                  value={preservationDays}
                  onChange={(e) => setPreservationDays(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-farmly-dark mb-1">
              Mô tả ngắn
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Điểm nổi bật hiển thị trên thẻ sản phẩm..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-farmly-dark mb-1">
              Mô tả chi tiết
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nguồn gốc canh tác, hướng dẫn bảo quản, giá trị dinh dưỡng..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
            />
          </div>

          {/* Hình ảnh sản phẩm */}
          <div className="p-4 rounded-xl bg-farmly-mint/35 border border-farmly-soft space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-farmly-dark">
                Hình ảnh sản phẩm ({images.length})
              </span>
              <span className="text-[11px] text-slate-500">
                Chọn 1 ảnh làm ảnh chính (Primary)
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddImage();
                  }
                }}
                placeholder="Dán URL hình ảnh (https://...) rồi bấm Thêm"
                className="flex-1 px-3 py-2 rounded-xl bg-white border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-farmly-mint border border-farmly-soft text-farmly-dark text-xs font-semibold hover:bg-white transition shrink-0"
              >
                <ImagePlus size={14} />
                Thêm ảnh
              </button>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {images.map((img, idx) => (
                  <div
                    key={`${img.image_url}-${idx}`}
                    className={`flex items-center gap-2.5 p-2 rounded-xl bg-white border ${
                      img.is_primary
                        ? "border-farmly-dark ring-1 ring-farmly-dark/20"
                        : "border-farmly-soft"
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt={`Ảnh ${idx + 1}`}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-slate-600 truncate">
                        {img.image_url}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        className={`mt-1 inline-flex items-center gap-1 text-[11px] font-semibold ${
                          img.is_primary
                            ? "text-farmly-dot"
                            : "text-slate-500 hover:text-farmly-dark"
                        }`}
                      >
                        <Star
                          size={12}
                          className={img.is_primary ? "fill-current" : ""}
                        />
                        {img.is_primary ? "Ảnh chính" : "Đặt làm ảnh chính"}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition shrink-0"
                      title="Xóa ảnh này"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-farmly-soft bg-farmly-mint/35 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-[#1e4620]"
            />
            <div>
              <span className="text-xs font-bold text-farmly-dark block">
                Đang kinh doanh (is_active)
              </span>
              <span className="text-[11px] text-slate-500">
                Cho phép hiển thị và đặt mua sản phẩm trên gian hàng
              </span>
            </div>
          </label>

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
              {isEditing ? "Lưu thay đổi" : "Tạo sản phẩm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
