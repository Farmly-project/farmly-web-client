import { useEffect, useState, type FormEvent } from "react";
import {
  ExternalLink,
  FileCheck2,
  Loader2,
  Package,
  QrCode,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import {
  catalogService,
  extractCatalogErrorMessage,
} from "../../../services/catalogService";
import type {
  ProductRecord,
  UploadCertificationPayload,
} from "../../../types/catalog.types";
import { formatCurrency, formatDate } from "../../../utils/formatters";

interface ProductDetailCertModalProps {
  productId: number;
  onClose: () => void;
  onCertificationAdded?: () => void;
}

const ACCEPTED_CERT_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_CERT_SIZE_BYTES = 5 * 1024 * 1024;

export function ProductDetailCertModal({
  productId,
  onClose,
  onCertificationAdded,
}: ProductDetailCertModalProps) {
  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form upload chứng nhận
  const [certName, setCertName] = useState("");
  const [certNumber, setCertNumber] = useState("");
  const [issuedBy, setIssuedBy] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const fetchDetail = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const detail = await catalogService.getProductById(productId);
      setProduct(detail);
    } catch (err: unknown) {
      setLoadError(
        extractCatalogErrorMessage(err, "Không thể tải chi tiết sản phẩm."),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    catalogService
      .getProductById(productId)
      .then((detail) => {
        if (!cancelled) {
          setProduct(detail);
          setLoadError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(
            extractCatalogErrorMessage(err, "Không thể tải chi tiết sản phẩm."),
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleUploadCertification = async (e: FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccess(null);

    const trimmedCertName = certName.trim();
    if (trimmedCertName.length < 2 || trimmedCertName.length > 150) {
      setUploadError("Tên chứng nhận phải từ 2 đến 150 ký tự.");
      return;
    }

    if (!file) {
      setUploadError("Vui lòng chọn file scan chứng nhận (JPG, PNG, WEBP hoặc PDF).");
      return;
    }

    if (!ACCEPTED_CERT_MIMES.includes(file.type)) {
      setUploadError("Chỉ chấp nhận tệp định dạng JPG, PNG, WEBP hoặc PDF.");
      return;
    }

    if (file.size > MAX_CERT_SIZE_BYTES) {
      setUploadError("Kích thước tệp chứng nhận tối đa 5 MB.");
      return;
    }

    if (issueDate && expiryDate && expiryDate < issueDate) {
      setUploadError("Ngày hết hạn chứng nhận không được trước ngày cấp.");
      return;
    }

    const payload: UploadCertificationPayload = {
      cert_name: trimmedCertName,
      cert_number: certNumber.trim() || undefined,
      issued_by: issuedBy.trim() || undefined,
      issue_date: issueDate || undefined,
      expiry_date: expiryDate || undefined,
      file,
    };

    setUploading(true);
    try {
      await catalogService.uploadCertification(productId, payload);
      setCertName("");
      setCertNumber("");
      setIssuedBy("");
      setIssueDate("");
      setExpiryDate("");
      setFile(null);
      setUploadSuccess("Đã tải lên và gắn chứng nhận kiểm định thành công!");
      await fetchDetail();
      onCertificationAdded?.();
    } catch (err: unknown) {
      setUploadError(
        extractCatalogErrorMessage(err, "Tải lên chứng nhận thất bại."),
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-farmly-soft shadow-xl max-w-3xl w-full overflow-hidden">
        <div className="px-6 py-4 bg-farmly-mint border-b border-farmly-soft flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-farmly-dark">
            <div className="w-8 h-8 rounded-xl bg-farmly-dark text-white flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Chi tiết Sản phẩm &amp; Chứng nhận kiểm định
              </h3>
              <p className="text-xs text-slate-600">
                {product ? `${product.name} (#${product.id})` : `Sản phẩm #${productId}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-farmly-dark hover:bg-white/70 transition"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 max-h-[82vh] overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500 text-sm">
              <Loader2 size={24} className="animate-spin text-farmly-dark" />
              <span>Đang tải chi tiết sản phẩm...</span>
            </div>
          ) : loadError || !product ? (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {loadError || "Không tìm thấy dữ liệu sản phẩm."}
            </div>
          ) : (
            <>
              {/* Thông tin tổng quan sản phẩm */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#F7FBF7] border border-farmly-soft">
                <div className="space-y-2">
                  <div className="aspect-square rounded-xl bg-white border border-farmly-soft overflow-hidden flex items-center justify-center">
                    {product.images?.[0]?.image_url || product.primary_image ? (
                      <img
                        src={
                          product.images?.find((i) => i.is_primary)?.image_url ||
                          product.images?.[0]?.image_url ||
                          product.primary_image ||
                          ""
                        }
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package size={36} className="text-slate-300" />
                    )}
                  </div>
                  {product.images && product.images.length > 1 && (
                    <div className="flex gap-1.5 overflow-x-auto">
                      {product.images.map((img) => (
                        <img
                          key={img.id}
                          src={img.image_url}
                          alt={product.name}
                          className="w-11 h-11 rounded-lg object-cover border border-farmly-soft shrink-0"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 space-y-2.5 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-farmly-mint text-farmly-dark text-xs font-semibold">
                      {product.category?.name ?? "Chưa phân loại"}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-farmly-cream text-farmly-badge text-xs font-bold">
                      {formatCurrency(product.base_price)} / {product.unit}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white border border-farmly-soft text-xs font-medium text-slate-600">
                      Bảo quản: {product.preservation_days} ngày
                    </span>
                  </div>

                  <p className="text-xs font-mono text-slate-500">
                    Slug: {product.slug}
                  </p>

                  {product.short_description && (
                    <p className="text-xs font-medium text-farmly-dark">
                      {product.short_description}
                    </p>
                  )}

                  {product.description && (
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {product.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-farmly-soft/80 text-xs">
                    <div>
                      <span className="text-slate-500">Tồn khả dụng FEFO:</span>{" "}
                      <strong className="text-farmly-dot">
                        {product.available_quantity ?? 0} {product.unit}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">HSD gần nhất:</span>{" "}
                      <strong className="text-farmly-badge">
                        {formatDate(product.nearest_exp_date)}
                      </strong>
                    </div>
                  </div>

                  {product.active_batch_trace && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-farmly-soft text-xs">
                      <QrCode size={15} className="text-farmly-dot shrink-0" />
                      <span>
                        Lô đang xuất bán:{" "}
                        <strong className="font-mono text-farmly-dark">
                          {product.active_batch_trace.batch_code}
                        </strong>{" "}
                        (HSD: {formatDate(product.active_batch_trace.exp_date)})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Danh sách chứng nhận hiện có */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-farmly-dark flex items-center gap-2">
                  <FileCheck2 size={16} className="text-farmly-dot" />
                  Chứng nhận kiểm định chất lượng (
                  {product.certifications?.length ?? 0})
                </h4>

                {!product.certifications || product.certifications.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 rounded-xl border border-dashed border-farmly-soft text-center">
                    Sản phẩm này chưa có chứng nhận kiểm định nào được đính kèm.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {product.certifications.map((cert) => (
                      <div
                        key={cert.id}
                        className="p-3.5 rounded-xl border border-farmly-soft bg-white flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-farmly-dark">
                              {cert.cert_name}
                            </span>
                            {cert.cert_number && (
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-farmly-mint text-farmly-dark font-semibold">
                                {cert.cert_number}
                              </span>
                            )}
                          </div>
                          {cert.issued_by && (
                            <p className="text-xs text-slate-600 mt-1">
                              Đơn vị cấp: {cert.issued_by}
                            </p>
                          )}
                          {(cert.issue_date || cert.expiry_date) && (
                            <p className="text-[11px] text-slate-500 mt-1">
                              Cấp: {formatDate(cert.issue_date)} &bull; Hết hạn:{" "}
                              {formatDate(cert.expiry_date)}
                            </p>
                          )}
                        </div>
                        <a
                          href={cert.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-farmly-dot hover:underline"
                        >
                          <ExternalLink size={13} />
                          Xem tệp chứng nhận
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form upload chứng nhận mới */}
              <form
                onSubmit={handleUploadCertification}
                className="p-4 rounded-2xl bg-farmly-mint/50 border border-farmly-soft space-y-3"
              >
                <h4 className="text-sm font-bold text-farmly-dark flex items-center gap-2">
                  <Upload size={15} />
                  Tải lên chứng nhận mới (VietGAP / GlobalGAP / USDA...)
                </h4>

                {uploadError && (
                  <div className="px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                    {uploadError}
                  </div>
                )}

                {uploadSuccess && (
                  <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
                    {uploadSuccess}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-farmly-dark mb-1">
                      Tên chứng nhận <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={150}
                      value={certName}
                      onChange={(e) => setCertName(e.target.value)}
                      placeholder="VD: VietGAP 2026"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-farmly-soft text-xs focus:outline-none focus:border-farmly-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-farmly-dark mb-1">
                      Số hiệu chứng nhận
                    </label>
                    <input
                      type="text"
                      maxLength={100}
                      value={certNumber}
                      onChange={(e) => setCertNumber(e.target.value)}
                      placeholder="VD: VG-2026-999"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-farmly-soft text-xs focus:outline-none focus:border-farmly-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-farmly-dark mb-1">
                      Đơn vị cấp
                    </label>
                    <input
                      type="text"
                      maxLength={200}
                      value={issuedBy}
                      onChange={(e) => setIssuedBy(e.target.value)}
                      placeholder="VD: Trung tâm Kiểm định..."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-farmly-soft text-xs focus:outline-none focus:border-farmly-dark"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-[11px] font-bold text-farmly-dark mb-1">
                      Ngày cấp
                    </label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-farmly-soft text-xs focus:outline-none focus:border-farmly-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-farmly-dark mb-1">
                      Ngày hết hạn
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-farmly-soft text-xs focus:outline-none focus:border-farmly-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-farmly-dark mb-1">
                      Tệp scan (JPG/PNG/WEBP/PDF &le; 5MB){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      className="w-full text-xs file:mr-2.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-farmly-dark file:text-white file:text-xs file:font-semibold hover:file:opacity-90"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-farmly-dark text-white text-xs font-semibold hover:bg-farmly-dark-hover disabled:opacity-60 transition"
                  >
                    {uploading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    {uploading ? "Đang tải lên..." : "Tải lên chứng nhận"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
