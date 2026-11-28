import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  Plus,
  QrCode,
  RefreshCw,
  RotateCcw,
  Sprout,
  Trash2,
  X,
} from "lucide-react";
import {
  catalogService,
  extractCatalogErrorMessage,
} from "../../services/catalogService";
import {
  extractInventoryErrorMessage,
  inventoryService,
} from "../../services/inventoryService";
import type { ProductRecord } from "../../types/catalog.types";
import type {
  BatchPaginationMeta,
  BatchQueryParams,
  BatchStatus,
  CreateBatchPayload,
  CreateDisposalPayload,
  GeneratedQrData,
  InventoryBatchRecord,
} from "../../types/inventory.types";
import { formatDate, formatExpiryCountdown } from "../../utils/formatters";
import { CreateBatchModal } from "../../components/admin/inventory/CreateBatchModal";
import { DisposalModal } from "../../components/admin/inventory/DisposalModal";
import { BatchDetailModal } from "../../components/admin/inventory/BatchDetailModal";
import { BatchQrModal } from "../../components/admin/inventory/BatchQrModal";

export type FarmViewMode = "batches" | "disposals";

interface FarmBatchesPageProps {
  defaultView?: FarmViewMode;
}

const STATUS_BADGE: Record<BatchStatus, { label: string; className: string }> = {
  growing: {
    label: "Đang canh tác",
    className: "bg-sky-50 text-sky-700 border border-sky-200",
  },
  in_stock: {
    label: "Đã thu hoạch / Đang bán",
    className: "bg-farmly-mint text-farmly-dark border border-farmly-soft",
  },
  sold_out: {
    label: "Đã hết tồn",
    className: "bg-slate-100 text-slate-600 border border-slate-200",
  },
};

function getDaysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(dateStr);
  exp.setHours(0, 0, 0, 0);
  if (Number.isNaN(exp.getTime())) return null;
  return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function FarmBatchesPage({
  defaultView = "batches",
}: FarmBatchesPageProps) {
  const [activeView, setActiveView] = useState<FarmViewMode>(defaultView);
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [batches, setBatches] = useState<InventoryBatchRecord[]>([]);
  const [pagination, setPagination] = useState<BatchPaginationMeta>({
    page: 1,
    limit: 20,
    total_items: 0,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bộ lọc
  const [statusFilter, setStatusFilter] = useState<"" | BatchStatus>("");
  const [productFilter, setProductFilter] = useState<string>("");
  const [nearExpiryOnly, setNearExpiryOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [detailBatchId, setDetailBatchId] = useState<number | null>(null);
  const [disposalBatch, setDisposalBatch] =
    useState<InventoryBatchRecord | null>(null);
  const [qrModalState, setQrModalState] = useState<{
    qrData: GeneratedQrData;
    productName?: string;
  } | null>(null);
  const [generatingQrId, setGeneratingQrId] = useState<number | null>(null);

  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => setBanner(null), 5000);
    return () => clearTimeout(timer);
  }, [banner]);

  const buildQuery = useCallback((): BatchQueryParams => {
    return {
      page,
      limit,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(productFilter ? { product_id: Number(productFilter) } : {}),
      ...(nearExpiryOnly ? { near_expiry: true } : {}),
    };
  }, [page, limit, statusFilter, productFilter, nearExpiryOnly]);

  const loadBatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bRes, pRes] = await Promise.all([
        inventoryService.getBatches(buildQuery()),
        catalogService.getProducts({ limit: 50 }),
      ]);
      setBatches(bRes?.items ?? []);
      if (bRes?.pagination) {
        setPagination(bRes.pagination);
      }
      setProducts(pRes?.items ?? []);
    } catch (err: unknown) {
      setError(
        extractInventoryErrorMessage(
          err,
          extractCatalogErrorMessage(err, "Không thể tải danh sách lô hàng."),
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      inventoryService.getBatches(buildQuery()),
      catalogService.getProducts({ limit: 50 }),
    ])
      .then(([bRes, pRes]) => {
        if (cancelled) return;
        setBatches(bRes?.items ?? []);
        if (bRes?.pagination) {
          setPagination(bRes.pagination);
        }
        setProducts(pRes?.items ?? []);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            extractInventoryErrorMessage(
              err,
              "Không thể tải danh sách lô hàng.",
            ),
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
  }, [buildQuery]);

  const statsOnPage = useMemo(() => {
    let growing = 0;
    let inStock = 0;
    let withQr = 0;
    let expiredCount = 0;
    for (const b of batches) {
      if (b.status === "growing") growing += 1;
      if (b.status === "in_stock") inStock += 1;
      if (b.qr_code) withQr += 1;
      if (b.is_expired && Number(b.current_quantity) > 0) expiredCount += 1;
    }
    return { growing, inStock, withQr, expiredCount };
  }, [batches]);

  const disposalCandidates = useMemo(() => {
    return [...batches]
      .filter((b) => Number(b.current_quantity ?? 0) > 0)
      .sort((a, b) => {
        if (Boolean(a.is_expired) !== Boolean(b.is_expired)) {
          return a.is_expired ? -1 : 1;
        }
        return (a.exp_date ?? "9999-12-31").localeCompare(
          b.exp_date ?? "9999-12-31",
        );
      });
  }, [batches]);

  const handleCreateBatch = async (payload: CreateBatchPayload) => {
    try {
      const created = await inventoryService.createBatch(payload);
      setCreateOpen(false);
      setBanner({
        type: "success",
        text: `Đã khởi tạo lô ${created.batch_code} thành công.`,
      });
      await loadBatches();
    } catch (err: unknown) {
      throw new Error(
        extractInventoryErrorMessage(err, "Khởi tạo lô hàng thất bại."),
        { cause: err },
      );
    }
  };

  const handleOpenOrGenerateQr = async (batch: InventoryBatchRecord) => {
    setGeneratingQrId(batch.id);
    try {
      const qrData = await inventoryService.generateBatchQr(batch.id);
      setQrModalState({
        qrData,
        productName: batch.product?.name,
      });
      if (!batch.qr_code) {
        setBanner({
          type: "success",
          text: `Đã sinh mã QR truy xuất nguồn gốc cho lô ${batch.batch_code}.`,
        });
        await loadBatches();
      }
    } catch (err: unknown) {
      setBanner({
        type: "error",
        text: extractInventoryErrorMessage(
          err,
          "Lô cần ở trạng thái đã thu hoạch và có tối thiểu 1 nhật ký gieo hạt (sowing).",
        ),
      });
    } finally {
      setGeneratingQrId(null);
    }
  };

  const handleCreateDisposal = async (payload: CreateDisposalPayload) => {
    try {
      await inventoryService.createDisposal(payload);
      setDisposalBatch(null);
      setBanner({
        type: "success",
        text: "Đã lập phiếu xuất hủy và cập nhật trừ tồn kho lô hàng.",
      });
      await loadBatches();
    } catch (err: unknown) {
      throw new Error(
        extractInventoryErrorMessage(err, "Lập phiếu xuất hủy thất bại."),
        { cause: err },
      );
    }
  };

  const handleResetFilters = () => {
    setStatusFilter("");
    setProductFilter("");
    setNearExpiryOnly(false);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-farmly-soft flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-farmly-dark flex items-center gap-2">
            <Sprout size={22} className="text-farmly-dot" />
            Quản lý Lô hàng, Nhật ký Canh tác &amp; QR
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Theo dõi vòng đời lô nông sản từ gieo hạt đến thu hoạch, sinh mã QR
            truy xuất và lập biên bản xuất hủy hao hụt
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadBatches()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-farmly-soft bg-white text-farmly-dark text-xs font-semibold hover:bg-farmly-mint/50 disabled:opacity-60 transition"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-farmly-dark text-white text-sm font-semibold hover:bg-farmly-dark-hover shadow-sm transition"
          >
            <Plus size={16} />
            Khởi tạo lô mới
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-farmly-soft">
          <div className="flex items-center justify-between text-farmly-dark">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">
              Tổng số lô
            </span>
            <div className="p-2 rounded-xl bg-farmly-mint">
              <PackageCheck size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-farmly-dark mt-2">
            {pagination.total_items} lô
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Theo bộ lọc hiện tại
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-farmly-soft">
          <div className="flex items-center justify-between text-farmly-dark">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">
              Đang canh tác
            </span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <Sprout size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-sky-700 mt-2">
            {statsOnPage.growing} lô
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Chờ ghi nhật ký thu hoạch
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-farmly-soft">
          <div className="flex items-center justify-between text-farmly-dark">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">
              Đã gắn QR truy xuất
            </span>
            <div className="p-2 rounded-xl bg-farmly-mint text-farmly-dot">
              <QrCode size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-farmly-dot mt-2">
            {statsOnPage.withQr} lô
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Sẵn bán: {statsOnPage.inStock} lô
          </p>
        </div>

        <div className="bg-farmly-cream/75 p-4 rounded-2xl border border-farmly-soft">
          <div className="flex items-center justify-between text-farmly-badge">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Quá hạn cần hủy
            </span>
            <div className="p-2 rounded-xl bg-white">
              <AlertTriangle size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-farmly-badge mt-2">
            {statsOnPage.expiredCount} lô
          </p>
          <p className="text-[11px] text-slate-700 mt-0.5">
            Quá HSD nhưng còn tồn kho
          </p>
        </div>
      </div>

      {/* Banner thông báo */}
      {banner && (
        <div
          className={`px-4 py-3 rounded-xl border flex items-center justify-between gap-3 text-sm font-medium ${
            banner.type === "success"
              ? "bg-farmly-mint border-farmly-soft text-farmly-dark"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={17} className="shrink-0" />
            <span>{banner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="p-1 rounded-lg hover:bg-white/60 transition"
            aria-label="Đóng thông báo"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="inline-flex p-1 rounded-2xl bg-white border border-farmly-soft gap-1">
        <button
          type="button"
          onClick={() => setActiveView("batches")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeView === "batches"
              ? "bg-farmly-dark text-white shadow-sm"
              : "text-farmly-dark hover:bg-farmly-mint/60"
          }`}
        >
          <BookOpen size={16} />
          Lô hàng, Nhật ký &amp; QR
        </button>

        <button
          type="button"
          onClick={() => setActiveView("disposals")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeView === "disposals"
              ? "bg-farmly-dark text-white shadow-sm"
              : "text-farmly-dark hover:bg-farmly-mint/60"
          }`}
        >
          <Trash2 size={16} />
          Xuất hủy &amp; Hao hụt
          {statsOnPage.expiredCount > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeView === "disposals"
                  ? "bg-white/20 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              {statsOnPage.expiredCount}
            </span>
          )}
        </button>
      </div>

      {/* Bộ lọc chung */}
      <div className="bg-white p-4 rounded-2xl border border-farmly-soft flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as "" | BatchStatus);
            setPage(1);
          }}
          className="px-3.5 py-2 rounded-xl border border-farmly-soft text-sm bg-white focus:outline-none focus:border-farmly-dark"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="growing">Đang canh tác (growing)</option>
          <option value="in_stock">Đã thu hoạch / Đang bán (in_stock)</option>
          <option value="sold_out">Đã hết tồn (sold_out)</option>
        </select>

        <select
          value={productFilter}
          onChange={(e) => {
            setProductFilter(e.target.value);
            setPage(1);
          }}
          className="px-3.5 py-2 rounded-xl border border-farmly-soft text-sm bg-white focus:outline-none focus:border-farmly-dark"
        >
          <option value="">Tất cả sản phẩm</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-farmly-soft bg-farmly-mint/35 text-xs font-bold text-farmly-dark cursor-pointer">
          <input
            type="checkbox"
            checked={nearExpiryOnly}
            onChange={(e) => {
              setNearExpiryOnly(e.target.checked);
              setPage(1);
            }}
            className="accent-[#1e4620]"
          />
          Chỉ lô cận hạn FEFO
        </label>

        <button
          type="button"
          onClick={handleResetFilters}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-farmly-soft text-xs font-semibold text-slate-600 hover:bg-farmly-mint/50 transition"
        >
          <RotateCcw size={13} />
          Đặt lại
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          VIEW 1: LÔ HÀNG, NHẬT KÝ CANH TÁC & QR
      ════════════════════════════════════════════════════════════════ */}
      {activeView === "batches" && (
        <div className="bg-white rounded-2xl border border-farmly-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-farmly-mint text-farmly-dark font-semibold border-b border-farmly-soft">
                <tr>
                  <th className="px-4 py-3">Mã lô</th>
                  <th className="px-4 py-3">Nông sản</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Mốc thời gian</th>
                  <th className="px-4 py-3 text-right">Tồn khả dụng</th>
                  <th className="px-4 py-3">Mã QR truy xuất</th>
                  <th className="px-4 py-3 text-right">Nghiệp vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-farmly-soft/60">
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td colSpan={7} className="px-4 py-3.5">
                        <div className="h-10 rounded-xl bg-farmly-mint/40" />
                      </td>
                    </tr>
                  ))
                ) : batches.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm text-slate-500"
                    >
                      Chưa có lô hàng nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  batches.map((b) => {
                    const badge = STATUS_BADGE[b.status] ?? {
                      label: b.status,
                      className: "bg-slate-100 text-slate-700",
                    };
                    const qty = Number(b.current_quantity ?? 0);
                    const daysLeft = getDaysUntil(b.exp_date);

                    return (
                      <tr
                        key={b.id}
                        className={`transition ${
                          b.is_expired
                            ? "bg-red-50/35 hover:bg-red-50/60"
                            : "hover:bg-farmly-mint/20"
                        }`}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-farmly-dark whitespace-nowrap">
                          {b.batch_code}
                          {b.is_expired && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-red-600 text-white font-sans text-[10px] font-bold">
                              QUÁ HẠN
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 font-semibold text-farmly-dark">
                          {b.product?.name ?? `SP #${b.product_id}`}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                          <p>Gieo: {formatDate(b.sowing_date)}</p>
                          <p>TH: {formatDate(b.harvest_date)}</p>
                          <p>
                            HSD:{" "}
                            <strong className="text-farmly-badge">
                              {formatDate(b.exp_date)}
                            </strong>
                            {daysLeft !== null && qty > 0 && (
                              <span className="ml-1 text-[10px] text-slate-500">
                                ({formatExpiryCountdown(daysLeft)})
                              </span>
                            )}
                          </p>
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <p className="font-bold text-farmly-dot">
                            {b.current_quantity} / {b.initial_quantity}{" "}
                            {b.product?.unit ?? "kg"}
                          </p>
                          {Number(b.disposed_quantity) > 0 && (
                            <p className="text-[11px] text-red-600 font-semibold">
                              Đã hủy: {b.disposed_quantity}{" "}
                              {b.product?.unit ?? "kg"}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          {b.qr_code ? (
                            <button
                              type="button"
                              disabled={generatingQrId === b.id}
                              onClick={() => void handleOpenOrGenerateQr(b)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-farmly-mint text-farmly-dot text-xs font-bold hover:bg-farmly-cream transition"
                            >
                              <QrCode size={13} />
                              {generatingQrId === b.id
                                ? "Đang tải..."
                                : "Xem / In QR"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={generatingQrId === b.id}
                              onClick={() => void handleOpenOrGenerateQr(b)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-farmly-cream text-farmly-badge text-xs font-bold hover:opacity-85 disabled:opacity-50"
                            >
                              <QrCode size={13} />
                              {generatingQrId === b.id
                                ? "Đang sinh..."
                                : "Sinh mã QR"}
                            </button>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDetailBatchId(b.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-farmly-mint text-farmly-dark text-xs font-semibold hover:bg-farmly-cream transition"
                            >
                              <BookOpen size={13} />
                              Nhật ký
                            </button>
                            {qty > 0 && (
                              <button
                                type="button"
                                onClick={() => setDisposalBatch(b)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-farmly-badge text-white text-xs font-semibold hover:opacity-90 transition"
                              >
                                <Trash2 size={13} />
                                Xuất hủy
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          <div className="px-4 py-3 bg-[#F7FBF7] border-t border-farmly-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <span>
                Hiển thị{" "}
                <strong className="text-farmly-dark">{batches.length}</strong> /{" "}
                {pagination.total_items} lô hàng
              </span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 rounded-lg border border-farmly-soft bg-white text-xs"
              >
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-farmly-soft bg-white text-farmly-dark font-semibold disabled:opacity-45 hover:bg-farmly-mint/50 transition"
              >
                <ChevronLeft size={14} />
                Trước
              </button>
              <span className="px-3 py-1 font-semibold text-farmly-dark">
                Trang {pagination.page} / {Math.max(1, pagination.total_pages)}
              </span>
              <button
                type="button"
                disabled={page >= Math.max(1, pagination.total_pages)}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-farmly-soft bg-white text-farmly-dark font-semibold disabled:opacity-45 hover:bg-farmly-mint/50 transition"
              >
                Sau
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          VIEW 2: XUẤT HỦY & HAO HỤT KHO
      ════════════════════════════════════════════════════════════════ */}
      {activeView === "disposals" && (
        <div className="bg-white rounded-2xl border border-farmly-soft overflow-hidden">
          <div className="px-5 py-4 bg-farmly-cream/60 border-b border-farmly-soft">
            <h2 className="text-base font-bold text-farmly-badge flex items-center gap-2">
              <Trash2 size={18} />
              Danh sách Lô còn tồn sẵn sàng lập phiếu Xuất hủy
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Các lô quá hạn được đẩy lên đầu. Khi xác nhận xuất hủy kèm ảnh
              minh chứng, tồn kho sẽ được trừ tự động.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-farmly-mint text-farmly-dark font-semibold border-b border-farmly-soft">
                <tr>
                  <th className="px-4 py-3">Mã lô</th>
                  <th className="px-4 py-3">Nông sản</th>
                  <th className="px-4 py-3">Hạn sử dụng</th>
                  <th className="px-4 py-3 text-right">Tồn hiện tại</th>
                  <th className="px-4 py-3 text-right">Đã xuất hủy</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-farmly-soft/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : disposalCandidates.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-10 text-center text-sm text-slate-500"
                    >
                      Không có lô hàng nào còn tồn kho để xuất hủy.
                    </td>
                  </tr>
                ) : (
                  disposalCandidates.map((b) => {
                    const daysLeft = getDaysUntil(b.exp_date);
                    return (
                      <tr
                        key={b.id}
                        className={
                          b.is_expired
                            ? "bg-red-50/45 hover:bg-red-50/75"
                            : "hover:bg-farmly-mint/20"
                        }
                      >
                        <td className="px-4 py-3 font-mono font-bold text-farmly-dark whitespace-nowrap">
                          {b.batch_code}
                          {b.is_expired && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-red-600 text-white font-sans text-[10px] font-bold">
                              QUÁ HẠN
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-farmly-dark">
                          {b.product?.name ?? `SP #${b.product_id}`}
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          <span className="font-semibold text-farmly-dark">
                            {formatDate(b.exp_date)}
                          </span>
                          {daysLeft !== null && (
                            <span
                              className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                b.is_expired
                                  ? "bg-red-600 text-white"
                                  : "bg-farmly-mint text-farmly-dark"
                              }`}
                            >
                              {formatExpiryCountdown(daysLeft)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-farmly-dot whitespace-nowrap">
                          {b.current_quantity} {b.product?.unit ?? "kg"}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-red-600 whitespace-nowrap">
                          {b.disposed_quantity} {b.product?.unit ?? "kg"}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDetailBatchId(b.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-farmly-soft text-farmly-dark text-xs font-semibold hover:bg-farmly-mint/50 transition"
                            >
                              Lịch sử hủy
                            </button>
                            <button
                              type="button"
                              onClick={() => setDisposalBatch(b)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-farmly-badge text-white text-xs font-semibold hover:opacity-90 transition"
                            >
                              <Trash2 size={13} />
                              Lập phiếu xuất hủy
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {createOpen && (
        <CreateBatchModal
          products={products}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreateBatch}
        />
      )}

      {detailBatchId !== null && (
        <BatchDetailModal
          batchId={detailBatchId}
          onClose={() => setDetailBatchId(null)}
          onUpdated={() => void loadBatches()}
        />
      )}

      {disposalBatch && (
        <DisposalModal
          batch={disposalBatch}
          onClose={() => setDisposalBatch(null)}
          onSubmit={handleCreateDisposal}
        />
      )}

      {qrModalState && (
        <BatchQrModal
          qrData={qrModalState.qrData}
          productName={qrModalState.productName}
          onClose={() => setQrModalState(null)}
        />
      )}
    </div>
  );
}

export default FarmBatchesPage;
