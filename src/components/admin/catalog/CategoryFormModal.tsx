import { useState, type FormEvent } from "react";
import { FolderTree, ImageIcon, Loader2, X } from "lucide-react";
import type { CategoryPayload, CategoryRecord } from "../../../types/catalog.types";

interface CategoryFormModalProps {
  initialCategory: CategoryRecord | null;
  onClose: () => void;
  onSubmit: (payload: CategoryPayload) => Promise<void>;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function CategoryFormModal({
  initialCategory,
  onClose,
  onSubmit,
}: CategoryFormModalProps) {
  const isEditing = Boolean(initialCategory);

  const [name, setName] = useState(initialCategory?.name ?? "");
  const [slug, setSlug] = useState(initialCategory?.slug ?? "");
  const [description, setDescription] = useState(
    initialCategory?.description ?? "",
  );
  const [imageUrl, setImageUrl] = useState(initialCategory?.image_url ?? "");
  const [allowSubscription, setAllowSubscription] = useState(
    initialCategory?.allow_subscription ?? true,
  );
  const [isActive, setIsActive] = useState(initialCategory?.is_active ?? true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();
    const trimmedImageUrl = imageUrl.trim();
    const trimmedDescription = description.trim();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setError("Tên danh mục phải từ 2 đến 100 ký tự.");
      return;
    }

    if (trimmedSlug.length > 120) {
      setError("Slug danh mục tối đa 120 ký tự.");
      return;
    }

    if (trimmedImageUrl && !isValidHttpUrl(trimmedImageUrl)) {
      setError("URL ảnh đại diện danh mục không hợp lệ (cần http:// hoặc https://).");
      return;
    }

    const payload: CategoryPayload = {
      name: trimmedName,
      ...(trimmedSlug ? { slug: trimmedSlug } : {}),
      ...(trimmedDescription ? { description: trimmedDescription } : {}),
      image_url: trimmedImageUrl,
      allow_subscription: allowSubscription,
      is_active: isActive,
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Không thể lưu danh mục.",
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
              <FolderTree size={16} />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {isEditing ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
              </h3>
              <p className="text-xs text-slate-600">
                {isEditing
                  ? `Cập nhật thông tin danh mục #${initialCategory?.id}`
                  : "Tạo nhóm nông sản mới cho cửa hàng Farmly"}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-farmly-dark mb-1">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Rau ăn lá hữu cơ"
              className="w-full px-3.5 py-2.5 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-farmly-dark mb-1">
              Đường dẫn (Slug)
            </label>
            <input
              type="text"
              maxLength={120}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="Để trống để hệ thống tự sinh từ tên danh mục"
              className="w-full px-3.5 py-2.5 rounded-xl border border-farmly-soft text-sm font-mono focus:outline-none focus:border-farmly-dark"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-farmly-dark mb-1">
              Mô tả danh mục
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về nhóm nông sản..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-farmly-dark mb-1">
              URL ảnh đại diện
            </label>
            <div className="flex items-center gap-3">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
              />
              <div className="w-11 h-11 rounded-xl border border-farmly-soft bg-farmly-mint/40 flex items-center justify-center overflow-hidden shrink-0">
                {imageUrl.trim() && isValidHttpUrl(imageUrl.trim()) ? (
                  <img
                    src={imageUrl.trim()}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon size={18} className="text-slate-400" />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-farmly-soft bg-farmly-mint/35 cursor-pointer">
              <input
                type="checkbox"
                checked={allowSubscription}
                onChange={(e) => setAllowSubscription(e.target.checked)}
                className="w-4 h-4 accent-[#1e4620]"
              />
              <div>
                <span className="text-xs font-bold text-farmly-dark block">
                  Hỗ trợ gói định kỳ
                </span>
                <span className="text-[11px] text-slate-500">
                  Cho phép đặt giao định kỳ
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-farmly-soft bg-farmly-mint/35 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-[#1e4620]"
              />
              <div>
                <span className="text-xs font-bold text-farmly-dark block">
                  Đang hoạt động
                </span>
                <span className="text-[11px] text-slate-500">
                  Hiển thị ngoài cửa hàng
                </span>
              </div>
            </label>
          </div>

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
              {isEditing ? "Lưu thay đổi" : "Tạo danh mục"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
