import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CheckCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Package,
  PackageX,
  Plus,
  QrCode,
  RefreshCw,
  RotateCcw,
  Search,
  Sprout,
  Trash2,
  Warehouse,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  catalogService,
  extractCatalogErrorMessage,
} from "../../services/catalogService";
import {
  extractInventoryErrorMessage,
  inventoryService,
} from "../../services/inventoryService";
import type { CategoryRecord, ProductRecord } from "../../types/catalog.types";
import type {
  BatchPaginationMeta,
  BatchQueryParams,
  BatchStatus,
  CreateBatchPayload,
  CreateDisposalPayload,
  FlashSalePayload,
  GeneratedQrData,
  InventoryBatchRecord,
  InventoryNotificationItem,
} from "../../types/inventory.types";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatExpiryCountdown,
} from "../../utils/formatters";
import { CreateBatchModal } from "../../components/admin/inventory/CreateBatchModal";
import { DisposalModal } from "../../components/admin/inventory/DisposalModal";
import { FlashSaleModal } from "../../components/admin/inventory/FlashSaleModal";
import { BatchDetailModal } from "../../components/admin/inventory/BatchDetailModal";
import { BatchQrModal } from "../../components/admin/inventory/BatchQrModal";

export type InventoryTab = "alerts" | "stock" | "batches";

interface AdminInventoryPageProps {
  defaultTab?: InventoryTab;
}

const LOW_STOCK_THRESHOLD = 10;

function getDaysUntilDate(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

const BATCH_STATUS_BADGE: Record<
  BatchStatus,
  { label: string; className: string }
> = {
  growing: {
    label: "Đang canh tác",
    className: "bg-sky-50 text-sky-700 border border-sky-200",
  },
  in_stock: {
    label: "Đang bán (FEFO)",
    className: "bg-farmly-mint text-farmly-dark border border-farmly-soft",
  },
  sold_out: {
    label: "Hết tồn",
    className: "bg-slate-100 text-slate-600 border border-slate-200",
  },
};

export function AdminInventoryPage({
  defaultTab = "alerts",
}: AdminInventoryPageProps) {
  const { user } = useAuth();
  const normalizedRole = user?.role?.trim().toLowerCase() ?? "";
  const canConfigureFlashSale =
    normalizedRole === "admin" || normalizedRole === "sales";
  const isAdmin = normalizedRole === "admin";

  const [activeTab, setActiveTab] = useState<InventoryTab>(defaultTab);
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Dữ liệu cảnh báo tổng hợp
  const [warningDays, setWarningDays] = useState<number>(2);
  const [inStockBatches, setInStockBatches] = useState<InventoryBatchRecord[]>(
    [],
  );
  const [nearExpiryBatches, setNearExpiryBatches] = useState<
    InventoryBatchRecord[]
  >([]);
  const [stockProducts, setStockProducts] = useState<ProductRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [notifications, setNotifications] = useState<
    InventoryNotificationItem[]
  >([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [unreadOnlyNotif, setUnreadOnlyNotif] = useState<boolean>(false);
  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Bộ lọc tab Cảnh báo
  const [alertKindFilter, setAlertKindFilter] = useState<
    "all" | "expired" | "near_expiry"
  >("all");

  // Bộ lọc tab Tồn kho theo Sản phẩm
  const [stockSearchInput, setStockSearchInput] = useState("");
  const [stockSearchApplied, setStockSearchApplied] = useState("");
  const [stockCategoryId, setStockCategoryId] = useState("");
  const [stockLevelFilter, setStockLevelFilter] = useState<
    "all" | "out" | "low" | "healthy"
  >("all");

  // Dữ liệu & bộ lọc tab Lô hàng
  const [batches, setBatches] = useState<InventoryBatchRecord[]>([]);
  const [batchPagination, setBatchPagination] = useState<BatchPaginationMeta>({
    page: 1,
    limit: 20,
    total_items: 0,
    total_pages: 1,
  });
  const [loadingBatches, setLoadingBatches] = useState<boolean>(true);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchStatusFilter, setBatchStatusFilter] = useState<"" | BatchStatus>(
    "",
  );
  const [batchProductFilter, setBatchProductFilter] = useState<string>("");
  const [batchNearExpiryOnly, setBatchNearExpiryOnly] = useState<boolean>(false);
  const [batchPage, setBatchPage] = useState<number>(1);
  const [batchLimit, setBatchLimit] = useState<number>(20);

  // State Modals
  const [createBatchState, setCreateBatchState] = useState<{
    open: boolean;
    defaultProductId?: number;
  }>({ open: false });
  const [disposalBatch, setDisposalBatch] =
    useState<InventoryBatchRecord | null>(null);
  const [flashSaleBatch, setFlashSaleBatch] =
    useState<InventoryBatchRecord | null>(null);
  const [detailBatchId, setDetailBatchId] = useState<number | null>(null);
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

  const buildBatchQuery = useCallback((): BatchQueryParams => {
    return {
      page: batchPage,
      limit: batchLimit,
      ...(batchStatusFilter ? { status: batchStatusFilter } : {}),
      ...(batchProductFilter ? { product_id: Number(batchProductFilter) } : {}),
      ...(batchNearExpiryOnly ? { near_expiry: true } : {}),
    };
  }, [
    batchPage,
    batchLimit,
    batchStatusFilter,
    batchProductFilter,
    batchNearExpiryOnly,
  ]);

  const fetchOverviewData = useCallback(async () => {
    const [
      inStockRes,
      nearRes,
      productsRes,
      categoriesRes,
      notifRes,
      settingDays,
    ] = await Promise.all([
      inventoryService.getBatches({ status: "in_stock", limit: 50 }),
      inventoryService.getBatches({ near_expiry: true, limit: 50 }),
      catalogService.getProducts({ limit: 50, sort_by: "newest" }),
      catalogService.getCategories(),
      inventoryService.getNotifications({
        limit: 20,
        unread_only: unreadOnlyNotif || undefined,
      }),
      isAdmin
        ? inventoryService.getExpiryWarningDays().catch(() => 2)
        : Promise.resolve(2),
    ]);

    setInStockBatches(inStockRes?.items ?? []);
    setNearExpiryBatches(nearRes?.items ?? []);
    setStockProducts(productsRes?.items ?? []);
    setCategories(Array.isArray(categoriesRes) ? categoriesRes : []);
    setNotifications(notifRes?.items ?? []);
    setUnreadCount(notifRes?.unread_count ?? 0);
    setWarningDays(settingDays);
  }, [isAdmin, unreadOnlyNotif]);

  const loadAll = useCallback(async () => {
    setLoadingOverview(true);
    setLoadingBatches(true);
    setOverviewError(null);
    setBatchError(null);

    try {
      await fetchOverviewData();
    } catch (err: unknown) {
      setOverviewError(
        extractInventoryErrorMessage(
          err,
          extractCatalogErrorMessage(err, "Không thể tải dữ liệu tồn kho."),
        ),
      );
    } finally {
      setLoadingOverview(false);
    }

    try {
      const batchRes = await inventoryService.getBatches(buildBatchQuery());
      setBatches(batchRes?.items ?? []);
      if (batchRes?.pagination) {
        setBatchPagination(batchRes.pagination);
      }
    } catch (err: unknown) {
      setBatchError(
        extractInventoryErrorMessage(err, "Không thể tải danh sách lô hàng."),
      );
    } finally {
      setLoadingBatches(false);
    }
  }, [fetchOverviewData, buildBatchQuery]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      inventoryService.getBatches({ status: "in_stock", limit: 50 }),
      inventoryService.getBatches({ near_expiry: true, limit: 50 }),
      catalogService.getProducts({ limit: 50, sort_by: "newest" }),
      catalogService.getCategories(),
      inventoryService.getNotifications({
        limit: 20,
        unread_only: unreadOnlyNotif || undefined,
      }),
      isAdmin
        ? inventoryService.getExpiryWarningDays().catch(() => 2)
        : Promise.resolve(2),
    ])
      .then(
        ([
          inStockRes,
          nearRes,
          productsRes,
          categoriesRes,
          notifRes,
          settingDays,
        ]) => {
          if (cancelled) return;
          setInStockBatches(inStockRes?.items ?? []);
          setNearExpiryBatches(nearRes?.items ?? []);
          setStockProducts(productsRes?.items ?? []);
          setCategories(Array.isArray(categoriesRes) ? categoriesRes : []);
          setNotifications(notifRes?.items ?? []);
          setUnreadCount(notifRes?.unread_count ?? 0);
          setWarningDays(settingDays);
          setOverviewError(null);
        },
      )
      .catch((err: unknown) => {
        if (!cancelled) {
          setOverviewError(
            extractInventoryErrorMessage(
              err,
              "Không thể tải dữ liệu tồn kho & cảnh báo.",
            ),
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingOverview(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, unreadOnlyNotif]);

  useEffect(() => {
    let cancelled = false;
    inventoryService
      .getBatches(buildBatchQuery())
      .then((res) => {
        if (cancelled) return;
        setBatches(res?.items ?? []);
        if (res?.pagination) {
          setBatchPagination(res.pagination);
        }
        setBatchError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setBatchError(
            extractInventoryErrorMessage(
              err,
              "Không thể tải danh sách lô hàng.",
            ),
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingBatches(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [buildBatchQuery]);

  // Lô đã quá hạn nhưng vẫn còn tồn kho
  const expiredBatches = useMemo(
    () =>
      inStockBatches.filter(
        (b) => b.is_expired && Number(b.current_quantity) > 0,
      ),
    [inStockBatches],
  );

  // Hợp nhất lô quá hạn + cận hạn không trùng lặp, ưu tiên HSD gần nhất
  const alertBatches = useMemo(() => {
    const map = new Map<number, InventoryBatchRecord>();
    for (const b of expiredBatches) {
      map.set(b.id, b);
    }
    for (const b of nearExpiryBatches) {
      if (!map.has(b.id)) {
        map.set(b.id, b);
      }
    }
    const list = Array.from(map.values()).sort((a, b) =>
      (a.exp_date ?? "9999-12-31").localeCompare(b.exp_date ?? "9999-12-31"),
    );

    if (alertKindFilter === "expired") {
      return list.filter((b) => b.is_expired);
    }
    if (alertKindFilter === "near_expiry") {
      return list.filter((b) => !b.is_expired);
    }
    return list;
  }, [expiredBatches, nearExpiryBatches, alertKindFilter]);

  // Sản phẩm hết hàng hoặc tồn thấp (<= 10)
  const lowOrOutProducts = useMemo(() => {
    return [...stockProducts]
      .filter((p) => Number(p.available_quantity ?? 0) <= LOW_STOCK_THRESHOLD)
      .sort(
        (a, b) =>
          Number(a.available_quantity ?? 0) - Number(b.available_quantity ?? 0),
      );
  }, [stockProducts]);

  // Lọc tồn kho theo sản phẩm
  const filteredStockProducts = useMemo(() => {
    const kw = stockSearchApplied.trim().toLowerCase();
    return stockProducts.filter((p) => {
      const matchesSearch =
        !kw ||
        p.name.toLowerCase().includes(kw) ||
        p.slug.toLowerCase().includes(kw);

      const matchesCategory =
        !stockCategoryId || String(p.category_id ?? "") === stockCategoryId;

      const qty = Number(p.available_quantity ?? 0);
      const matchesLevel =
        stockLevelFilter === "all" ||
        (stockLevelFilter === "out" && qty <= 0) ||
        (stockLevelFilter === "low" && qty > 0 && qty <= LOW_STOCK_THRESHOLD) ||
        (stockLevelFilter === "healthy" && qty > LOW_STOCK_THRESHOLD);

      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [stockProducts, stockSearchApplied, stockCategoryId, stockLevelFilter]);

  // --- Handlers ---
  const handleCreateBatch = async (payload: CreateBatchPayload) => {
    try {
      const created = await inventoryService.createBatch(payload);
      setCreateBatchState({ open: false });
      setBanner({
        type: "success",
        text: `Đã khởi tạo lô hàng ${created.batch_code} thành công.`,
      });
      await loadAll();
    } catch (err: unknown) {
      throw new Error(
        extractInventoryErrorMessage(err, "Khởi tạo lô hàng thất bại."),
        { cause: err },
      );
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
      await loadAll();
    } catch (err: unknown) {
      throw new Error(
        extractInventoryErrorMessage(err, "Lập phiếu xuất hủy thất bại."),
        { cause: err },
      );
    }
  };

  const handleSaveFlashSale = async (payload: FlashSalePayload) => {
    if (!flashSaleBatch) return;
    try {
      await inventoryService.configureFlashSale(flashSaleBatch.id, payload);
      setFlashSaleBatch(null);
      setBanner({
        type: "success",
        text:
          payload.flash_sale_price === null
            ? `Đã tắt Flash Sale cho lô ${flashSaleBatch.batch_code}.`
            : `Đã bật Flash Sale ${formatCurrency(payload.flash_sale_price)} cho lô ${flashSaleBatch.batch_code}.`,
      });
      await loadAll();
    } catch (err: unknown) {
      throw new Error(
        extractInventoryErrorMessage(
          err,
          "Cập nhật Flash Sale thất bại.",
        ),
        { cause: err },
      );
    }
  };

  const handleGenerateQr = async (batch: InventoryBatchRecord) => {
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
        await loadAll();
      }
    } catch (err: unknown) {
      setBanner({
        type: "error",
        text: extractInventoryErrorMessage(
          err,
          "Lô cần ở trạng thái đã thu hoạch và có nhật ký gieo hạt.",
        ),
      });
    } finally {
      setGeneratingQrId(null);
    }
  };

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await inventoryService.markNotificationRead(id);
      await fetchOverviewData();
    } catch (err: unknown) {
      setBanner({
        type: "error",
        text: extractInventoryErrorMessage(err, "Không thể đánh dấu đã đọc."),
      });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await inventoryService.markAllNotificationsRead();
      await fetchOverviewData();
    } catch (err: unknown) {
      setBanner({
        type: "error",
        text: extractInventoryErrorMessage(
          err,
          "Không thể đánh dấu tất cả thông báo.",
        ),
      });
    }
  };

  const handleStockSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setStockSearchApplied(stockSearchInput);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-farmly-soft flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-farmly-dark flex items-center gap-2">
            <Warehouse size={22} className="text-farmly-dot" />
            Tồn kho &amp; Cảnh báo Sản phẩm
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Giám sát tồn kho FEFO theo sản phẩm &amp; lô hàng, cảnh báo cận hạn
            (&le; {warningDays} ngày), xuất hủy và xả kho Flash Sale
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadAll()}
            disabled={loadingOverview || loadingBatches}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-farmly-soft bg-white text-farmly-dark text-xs font-semibold hover:bg-farmly-mint/50 disabled:opacity-60 transition"
          >
            <RefreshCw
              size={14}
              className={
                loadingOverview || loadingBatches ? "animate-spin" : ""
              }
            />
            Làm mới
          </button>
          <button
            type="button"
            onClick={() => setCreateBatchState({ open: true })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-farmly-dark text-white text-sm font-semibold hover:bg-farmly-dark-hover shadow-sm transition"
          >
            <Plus size={16} />
            Nhập lô hàng mới
          </button>
        </div>
      </div>

      {/* KPI Cảnh báo nhanh */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-farmly-cream/80 p-4 rounded-2xl border border-farmly-soft">
          <div className="flex items-center justify-between text-farmly-badge">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Lô quá hạn còn tồn
            </span>
            <div className="p-2 rounded-xl bg-white">
              <AlertTriangle size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-farmly-badge mt-2">
            {expiredBatches.length} lô
          </p>
          <p className="text-[11px] text-slate-700 mt-0.5">
            Cần kiểm tra &amp; lập phiếu xuất hủy
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-farmly-soft">
          <div className="flex items-center justify-between text-farmly-dark">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">
              Lô cận hạn (&le; {warningDays} ngày)
            </span>
            <div className="p-2 rounded-xl bg-farmly-cream text-farmly-badge">
              <Flame size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-farmly-dark mt-2">
            {nearExpiryBatches.length} lô
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Ưu tiên xuất FEFO hoặc Flash Sale
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-farmly-soft">
          <div className="flex items-center justify-between text-farmly-dark">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">
              SP Hết / Tồn thấp
            </span>
            <div className="p-2 rounded-xl bg-farmly-mint">
              <PackageX size={16} className="text-farmly-badge" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-farmly-dark mt-2">
            {lowOrOutProducts.length} SP
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Tồn khả dụng &le; {LOW_STOCK_THRESHOLD} đơn vị
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-farmly-soft">
          <div className="flex items-center justify-between text-farmly-dark">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">
              Cảnh báo chưa đọc
            </span>
            <div className="p-2 rounded-xl bg-farmly-mint">
              <Bell size={16} className="text-farmly-dot" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-farmly-dot mt-2">
            {unreadCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Thông báo kho tự động 06:00
          </p>
        </div>
      </div>

      {/* Banner phản hồi */}
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

      {overviewError && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium">
          {overviewError}
        </div>
      )}

      {/* Tabs chuyển chế độ xem */}
      <div className="inline-flex flex-wrap p-1 rounded-2xl bg-white border border-farmly-soft gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("alerts")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeTab === "alerts"
              ? "bg-farmly-dark text-white shadow-sm"
              : "text-farmly-dark hover:bg-farmly-mint/60"
          }`}
        >
          <AlertTriangle size={16} />
          Cảnh báo sản phẩm &amp; Lô
          {(expiredBatches.length + nearExpiryBatches.length > 0 ||
            lowOrOutProducts.length > 0) && (
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === "alerts"
                  ? "bg-white/20 text-white"
                  : "bg-farmly-badge text-white"
              }`}
            >
              {alertBatches.length + lowOrOutProducts.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("stock")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeTab === "stock"
              ? "bg-farmly-dark text-white shadow-sm"
              : "text-farmly-dark hover:bg-farmly-mint/60"
          }`}
        >
          <Package size={16} />
          Tồn kho theo Sản phẩm
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === "stock"
                ? "bg-white/20 text-white"
                : "bg-farmly-mint text-farmly-dark"
            }`}
          >
            {stockProducts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("batches")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeTab === "batches"
              ? "bg-farmly-dark text-white shadow-sm"
              : "text-farmly-dark hover:bg-farmly-mint/60"
          }`}
        >
          <Sprout size={16} />
          Lô hàng &amp; Nhật ký
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === "batches"
                ? "bg-white/20 text-white"
                : "bg-farmly-mint text-farmly-dark"
            }`}
          >
            {batchPagination.total_items}
          </span>
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          TAB 1: CẢNH BÁO SẢN PHẨM & LÔ CẬN HẠN / QUÁ HẠN
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === "alerts" && (
        <div className="space-y-6">
          {/* 1A. Bảng Lô quá hạn & cận hạn */}
          <div className="bg-white rounded-2xl border border-farmly-soft overflow-hidden">
            <div className="px-5 py-4 bg-farmly-mint/60 border-b border-farmly-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-farmly-dark flex items-center gap-2">
                  <Flame size={18} className="text-farmly-badge" />
                  Cảnh báo Lô Quá hạn &amp; Cận hạn (FEFO)
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Ưu tiên xuất hủy các lô đã hết hạn hoặc bật Flash Sale cho lô
                  cận hạn để giảm hao hụt
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: "all", label: "Tất cả" },
                  {
                    key: "expired",
                    label: `Quá hạn (${expiredBatches.length})`,
                  },
                  {
                    key: "near_expiry",
                    label: `Cận hạn (${nearExpiryBatches.filter((b) => !b.is_expired).length})`,
                  },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() =>
                      setAlertKindFilter(
                        opt.key as "all" | "expired" | "near_expiry",
                      )
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      alertKindFilter === opt.key
                        ? "bg-farmly-dark text-white"
                        : "bg-white border border-farmly-soft text-farmly-dark hover:bg-farmly-mint"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#F7FBF7] text-farmly-dark font-semibold border-b border-farmly-soft text-xs">
                  <tr>
                    <th className="px-4 py-3">Mã lô</th>
                    <th className="px-4 py-3">Sản phẩm</th>
                    <th className="px-4 py-3">Hạn sử dụng</th>
                    <th className="px-4 py-3 text-right">Tồn còn lại</th>
                    <th className="px-4 py-3">Flash Sale</th>
                    <th className="px-4 py-3 text-right">Xử lý nhanh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-farmly-soft/60">
                  {loadingOverview ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Đang kiểm tra hạn sử dụng các lô hàng...
                      </td>
                    </tr>
                  ) : alertBatches.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-sm text-farmly-dot font-medium"
                      >
                        Không có lô hàng nào quá hạn hoặc cận hạn trong ngưỡng{" "}
                        {warningDays} ngày.
                      </td>
                    </tr>
                  ) : (
                    alertBatches.map((b) => {
                      const daysLeft = getDaysUntilDate(b.exp_date);
                      const isExpired = Boolean(b.is_expired);

                      return (
                        <tr
                          key={b.id}
                          className={
                            isExpired
                              ? "bg-red-50/40 hover:bg-red-50/70"
                              : "hover:bg-farmly-mint/20"
                          }
                        >
                          <td className="px-4 py-3 font-mono font-bold text-farmly-dark whitespace-nowrap">
                            {b.batch_code}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-farmly-dark">
                              {b.product?.name ?? `SP #${b.product_id}`}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Giá gốc:{" "}
                              {formatCurrency(b.product?.base_price ?? 0)} /{" "}
                              {b.product?.unit ?? "kg"}
                            </p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="text-xs font-semibold text-farmly-dark">
                              {formatDate(b.exp_date)}
                            </p>
                            {daysLeft !== null && (
                              <span
                                className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isExpired
                                    ? "bg-red-600 text-white"
                                    : "bg-farmly-cream text-farmly-badge"
                                }`}
                              >
                                {formatExpiryCountdown(daysLeft)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-farmly-dark whitespace-nowrap">
                            {b.current_quantity} {b.product?.unit ?? "kg"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {b.flash_sale_price !== null &&
                            b.flash_sale_price !== undefined ? (
                              <span className="px-2.5 py-1 rounded-lg bg-farmly-cream text-farmly-badge text-xs font-bold">
                                {formatCurrency(b.flash_sale_price)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">
                                Chưa bật
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              {!isExpired && canConfigureFlashSale && (
                                <button
                                  type="button"
                                  onClick={() => setFlashSaleBatch(b)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-farmly-cream text-farmly-badge text-xs font-bold hover:opacity-85 transition"
                                >
                                  <Flame size={13} />
                                  Flash Sale
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setDisposalBatch(b)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-farmly-badge text-white text-xs font-semibold hover:opacity-90 transition"
                              >
                                <Trash2 size={13} />
                                Xuất hủy
                              </button>
                              <button
                                type="button"
                                onClick={() => setDetailBatchId(b.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-farmly-soft text-farmly-dark text-xs font-semibold hover:bg-farmly-mint/50 transition"
                              >
                                <BookOpen size={13} />
                                Chi tiết
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

          {/* 1B. Hai cột dưới: Sản phẩm thiếu hàng & Thông báo hệ thống */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cảnh báo Sản phẩm hết hàng / tồn thấp */}
            <div className="bg-white rounded-2xl border border-farmly-soft overflow-hidden">
              <div className="px-5 py-4 bg-farmly-mint/60 border-b border-farmly-soft flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-farmly-dark flex items-center gap-2">
                    <PackageX size={18} className="text-farmly-badge" />
                    Sản phẩm Hết hàng / Tồn thấp (&le; {LOW_STOCK_THRESHOLD})
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Cần lên kế hoạch thu hoạch hoặc nhập lô bổ sung
                  </p>
                </div>
              </div>

              <div className="divide-y divide-farmly-soft/60 max-h-96 overflow-y-auto">
                {lowOrOutProducts.length === 0 ? (
                  <p className="p-8 text-center text-sm text-farmly-dot font-medium">
                    Tất cả sản phẩm đều đang có tồn kho khả dụng ổn định.
                  </p>
                ) : (
                  lowOrOutProducts.map((p) => {
                    const qty = Number(p.available_quantity ?? 0);
                    const isOut = qty <= 0;
                    return (
                      <div
                        key={p.id}
                        className="p-4 flex items-center justify-between gap-3 hover:bg-farmly-mint/20 transition"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isOut
                                  ? "bg-red-600 text-white"
                                  : "bg-farmly-cream text-farmly-badge"
                              }`}
                            >
                              {isOut ? "HẾT HÀNG" : "TỒN THẤP"}
                            </span>
                            <p className="text-sm font-bold text-farmly-dark truncate">
                              {p.name}
                            </p>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Tồn FEFO:{" "}
                            <strong
                              className={
                                isOut ? "text-red-600" : "text-farmly-badge"
                              }
                            >
                              {qty} {p.unit}
                            </strong>{" "}
                            &bull;{" "}
                            {p.nearest_exp_date
                              ? `HSD gần nhất: ${formatDate(p.nearest_exp_date)}`
                              : "Chưa có lô khả dụng"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setCreateBatchState({
                              open: true,
                              defaultProductId: p.id,
                            })
                          }
                          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-farmly-dark text-white text-xs font-semibold hover:bg-farmly-dark-hover transition"
                        >
                          <Plus size={13} />
                          Nhập lô
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Trung tâm Thông báo cảnh báo kho */}
            <div className="bg-white rounded-2xl border border-farmly-soft overflow-hidden">
              <div className="px-5 py-4 bg-farmly-mint/60 border-b border-farmly-soft flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-farmly-dark flex items-center gap-2">
                    <Bell size={18} className="text-farmly-dot" />
                    Thông báo Cảnh báo Kho ({unreadCount} chưa đọc)
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 text-xs font-medium text-farmly-dark cursor-pointer">
                    <input
                      type="checkbox"
                      checked={unreadOnlyNotif}
                      onChange={(e) => setUnreadOnlyNotif(e.target.checked)}
                      className="accent-[#1e4620]"
                    />
                    Chỉ chưa đọc
                  </label>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void handleMarkAllRead()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-farmly-soft text-xs font-semibold text-farmly-dot hover:bg-farmly-mint transition"
                    >
                      <CheckCheck size={13} />
                      Đọc tất cả
                    </button>
                  )}
                </div>
              </div>

              <div className="divide-y divide-farmly-soft/60 max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-8 text-center text-sm text-slate-500">
                    Chưa có thông báo cảnh báo nào.
                  </p>
                ) : (
                  notifications.map((n) => {
                    const isDanger =
                      n.level === "danger" || n.level === "red";
                    return (
                      <div
                        key={n.id}
                        className={`p-4 space-y-1.5 ${
                          !n.read_at ? "bg-farmly-cream/40" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {isDanger && (
                              <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold shrink-0">
                                KHẨN
                              </span>
                            )}
                            <p className="text-xs font-bold text-farmly-dark">
                              {n.title}
                            </p>
                          </div>
                          {!n.read_at && (
                            <button
                              type="button"
                              onClick={() =>
                                void handleMarkNotificationRead(n.id)
                              }
                              className="shrink-0 text-[11px] font-semibold text-farmly-dot hover:underline"
                            >
                              Đã đọc
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {n.body}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {formatDateTime(n.created_at)}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB 2: TỒN KHO THEO SẢN PHẨM
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === "stock" && (
        <div className="space-y-4">
          <form
            onSubmit={handleStockSearchSubmit}
            className="bg-white p-4 rounded-2xl border border-farmly-soft grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
          >
            <div className="lg:col-span-2 relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={stockSearchInput}
                onChange={(e) => setStockSearchInput(e.target.value)}
                placeholder="Tìm sản phẩm theo tên hoặc slug..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
              />
            </div>

            <select
              value={stockCategoryId}
              onChange={(e) => setStockCategoryId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-farmly-soft text-sm bg-white focus:outline-none focus:border-farmly-dark"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={stockLevelFilter}
              onChange={(e) =>
                setStockLevelFilter(
                  e.target.value as "all" | "out" | "low" | "healthy",
                )
              }
              className="px-3 py-2 rounded-xl border border-farmly-soft text-sm bg-white focus:outline-none focus:border-farmly-dark"
            >
              <option value="all">Mọi mức tồn kho</option>
              <option value="out">Hết hàng (0)</option>
              <option value="low">Tồn thấp (1 – {LOW_STOCK_THRESHOLD})</option>
              <option value="healthy">
                Tồn ổn định (&gt; {LOW_STOCK_THRESHOLD})
              </option>
            </select>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-3.5 py-2 rounded-xl bg-farmly-mint border border-farmly-soft text-farmly-dark text-xs font-bold hover:bg-farmly-cream transition"
              >
                Lọc tồn kho
              </button>
              <button
                type="button"
                onClick={() => {
                  setStockSearchInput("");
                  setStockSearchApplied("");
                  setStockCategoryId("");
                  setStockLevelFilter("all");
                }}
                title="Đặt lại bộ lọc"
                className="p-2 rounded-xl border border-farmly-soft text-slate-600 hover:bg-farmly-mint/50 transition"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </form>

          <div className="bg-white rounded-2xl border border-farmly-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-farmly-mint text-farmly-dark font-semibold border-b border-farmly-soft">
                  <tr>
                    <th className="px-4 py-3">Sản phẩm</th>
                    <th className="px-4 py-3">Danh mục</th>
                    <th className="px-4 py-3 text-right">Giá niêm yết</th>
                    <th className="px-4 py-3 text-right">Tồn khả dụng FEFO</th>
                    <th className="px-4 py-3">HSD gần nhất</th>
                    <th className="px-4 py-3">Mức cảnh báo</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-farmly-soft/60">
                  {loadingOverview ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Đang tải tồn kho sản phẩm...
                      </td>
                    </tr>
                  ) : filteredStockProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-10 text-center text-sm text-slate-500"
                      >
                        Không tìm thấy sản phẩm phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredStockProducts.map((p) => {
                      const qty = Number(p.available_quantity ?? 0);
                      const daysLeft = getDaysUntilDate(p.nearest_exp_date);
                      const isNearExp =
                        qty > 0 && daysLeft !== null && daysLeft <= warningDays;

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-farmly-mint/20 transition"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl border border-farmly-soft bg-farmly-mint/30 overflow-hidden flex items-center justify-center shrink-0">
                                {p.primary_image || p.images?.[0]?.image_url ? (
                                  <img
                                    src={
                                      p.primary_image ||
                                      p.images?.[0]?.image_url ||
                                      ""
                                    }
                                    alt={p.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package
                                    size={16}
                                    className="text-farmly-dot"
                                  />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-farmly-dark">
                                  {p.name}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Bảo quản {p.preservation_days} ngày
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-xs font-semibold text-farmly-dark">
                            {p.category?.name ?? "Chưa phân loại"}
                          </td>

                          <td className="px-4 py-3 text-right whitespace-nowrap font-semibold text-farmly-dark">
                            {formatCurrency(p.base_price)}/{p.unit}
                          </td>

                          <td className="px-4 py-3 text-right whitespace-nowrap font-extrabold">
                            <span
                              className={
                                qty <= 0
                                  ? "text-red-600"
                                  : qty <= LOW_STOCK_THRESHOLD
                                    ? "text-farmly-badge"
                                    : "text-farmly-dot"
                              }
                            >
                              {qty} {p.unit}
                            </span>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap text-xs">
                            <p className="font-medium text-slate-700">
                              {formatDate(p.nearest_exp_date)}
                            </p>
                            {daysLeft !== null && qty > 0 && (
                              <span
                                className={`text-[11px] font-semibold ${
                                  isNearExp
                                    ? "text-red-600"
                                    : "text-slate-500"
                                }`}
                              >
                                {formatExpiryCountdown(daysLeft)}
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            {qty <= 0 ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-bold">
                                Hết hàng
                              </span>
                            ) : qty <= LOW_STOCK_THRESHOLD ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-farmly-cream text-farmly-badge text-[11px] font-bold">
                                Tồn thấp
                              </span>
                            ) : isNearExp ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                                Có lô cận hạn
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-farmly-mint text-farmly-dark text-[11px] font-semibold">
                                Ổn định
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setBatchProductFilter(String(p.id));
                                  setBatchStatusFilter("");
                                  setBatchPage(1);
                                  setActiveTab("batches");
                                }}
                                className="px-2.5 py-1.5 rounded-lg border border-farmly-soft text-farmly-dark text-xs font-semibold hover:bg-farmly-mint/50 transition"
                              >
                                Xem lô
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setCreateBatchState({
                                    open: true,
                                    defaultProductId: p.id,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-farmly-dark text-white text-xs font-semibold hover:bg-farmly-dark-hover transition"
                              >
                                <Plus size={13} />
                                Nhập lô
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
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB 3: QUẢN LÝ LÔ HÀNG & NHẬT KÝ
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === "batches" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-farmly-soft flex flex-wrap items-center gap-3">
            <select
              value={batchStatusFilter}
              onChange={(e) => {
                setBatchStatusFilter(e.target.value as "" | BatchStatus);
                setBatchPage(1);
              }}
              className="px-3.5 py-2 rounded-xl border border-farmly-soft text-sm bg-white focus:outline-none focus:border-farmly-dark"
            >
              <option value="">Tất cả trạng thái lô</option>
              <option value="in_stock">Đang bán (in_stock)</option>
              <option value="growing">Đang canh tác (growing)</option>
              <option value="sold_out">Đã hết tồn (sold_out)</option>
            </select>

            <select
              value={batchProductFilter}
              onChange={(e) => {
                setBatchProductFilter(e.target.value);
                setBatchPage(1);
              }}
              className="px-3.5 py-2 rounded-xl border border-farmly-soft text-sm bg-white focus:outline-none focus:border-farmly-dark"
            >
              <option value="">Tất cả sản phẩm</option>
              {stockProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-farmly-soft bg-farmly-mint/35 text-xs font-bold text-farmly-dark cursor-pointer">
              <input
                type="checkbox"
                checked={batchNearExpiryOnly}
                onChange={(e) => {
                  setBatchNearExpiryOnly(e.target.checked);
                  setBatchPage(1);
                }}
                className="accent-[#1e4620]"
              />
              Chỉ lô cận hạn FEFO
            </label>

            <button
              type="button"
              onClick={() => {
                setBatchStatusFilter("");
                setBatchProductFilter("");
                setBatchNearExpiryOnly(false);
                setBatchPage(1);
              }}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-farmly-soft text-xs font-semibold text-slate-600 hover:bg-farmly-mint/50 transition"
            >
              <RotateCcw size={13} />
              Đặt lại
            </button>
          </div>

          {batchError && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium">
              {batchError}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-farmly-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-farmly-mint text-farmly-dark font-semibold border-b border-farmly-soft">
                  <tr>
                    <th className="px-4 py-3">Mã lô</th>
                    <th className="px-4 py-3">Nông sản</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Thu hoạch / HSD</th>
                    <th className="px-4 py-3 text-right">Tồn / Hủy</th>
                    <th className="px-4 py-3">Mã QR</th>
                    <th className="px-4 py-3 text-right">Nghiệp vụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-farmly-soft/60">
                  {loadingBatches ? (
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
                        Không tìm thấy lô hàng nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    batches.map((b) => {
                      const badge = BATCH_STATUS_BADGE[b.status] ?? {
                        label: b.status,
                        className: "bg-slate-100 text-slate-700",
                      };
                      const qty = Number(b.current_quantity ?? 0);

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

                          <td className="px-4 py-3">
                            <p className="font-semibold text-farmly-dark">
                              {b.product?.name ?? `SP #${b.product_id}`}
                            </p>
                            {b.flash_sale_price !== null &&
                              b.flash_sale_price !== undefined && (
                                <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-farmly-cream text-farmly-badge text-[10px] font-bold">
                                  Flash Sale:{" "}
                                  {formatCurrency(b.flash_sale_price)}
                                </span>
                              )}
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                            <p>TH: {formatDate(b.harvest_date)}</p>
                            <p>
                              HSD:{" "}
                              <strong className="text-farmly-badge">
                                {formatDate(b.exp_date)}
                              </strong>
                            </p>
                          </td>

                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <p className="font-bold text-farmly-dot">
                              {b.current_quantity} / {b.initial_quantity}{" "}
                              {b.product?.unit ?? "kg"}
                            </p>
                            {Number(b.disposed_quantity) > 0 && (
                              <p className="text-[11px] text-red-600 font-semibold">
                                Hủy: {b.disposed_quantity}{" "}
                                {b.product?.unit ?? "kg"}
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            {b.qr_code ? (
                              <button
                                type="button"
                                disabled={generatingQrId === b.id}
                                onClick={() => void handleGenerateQr(b)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-farmly-dot hover:underline"
                              >
                                <QrCode size={14} />
                                {generatingQrId === b.id ? "Đang tải..." : "Xem / In QR"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={generatingQrId === b.id}
                                onClick={() => void handleGenerateQr(b)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-farmly-cream text-farmly-badge text-xs font-bold hover:opacity-85 disabled:opacity-50"
                              >
                                <QrCode size={13} />
                                {generatingQrId === b.id
                                  ? "Đang sinh..."
                                  : "Sinh QR"}
                              </button>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setDetailBatchId(b.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-farmly-mint text-farmly-dark text-xs font-semibold hover:bg-farmly-cream transition"
                              >
                                <BookOpen size={13} />
                                Nhật ký
                              </button>
                              {b.status === "in_stock" &&
                                qty > 0 &&
                                !b.is_expired &&
                                canConfigureFlashSale && (
                                  <button
                                    type="button"
                                    onClick={() => setFlashSaleBatch(b)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-farmly-cream text-farmly-badge text-xs font-bold hover:opacity-85 transition"
                                  >
                                    <Flame size={13} />
                                    Sale
                                  </button>
                                )}
                              {qty > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setDisposalBatch(b)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-farmly-badge text-white text-xs font-semibold hover:opacity-90 transition"
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

            {/* Phân trang lô hàng */}
            <div className="px-4 py-3 bg-[#F7FBF7] border-t border-farmly-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-3">
                <span>
                  Hiển thị{" "}
                  <strong className="text-farmly-dark">{batches.length}</strong>{" "}
                  / {batchPagination.total_items} lô hàng
                </span>
                <select
                  value={batchLimit}
                  onChange={(e) => {
                    setBatchLimit(Number(e.target.value));
                    setBatchPage(1);
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
                  disabled={batchPage <= 1}
                  onClick={() => setBatchPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-farmly-soft bg-white text-farmly-dark font-semibold disabled:opacity-45 hover:bg-farmly-mint/50 transition"
                >
                  <ChevronLeft size={14} />
                  Trước
                </button>
                <span className="px-3 py-1 font-semibold text-farmly-dark">
                  Trang {batchPagination.page} /{" "}
                  {Math.max(1, batchPagination.total_pages)}
                </span>
                <button
                  type="button"
                  disabled={
                    batchPage >= Math.max(1, batchPagination.total_pages)
                  }
                  onClick={() => setBatchPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-farmly-soft bg-white text-farmly-dark font-semibold disabled:opacity-45 hover:bg-farmly-mint/50 transition"
                >
                  Sau
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {createBatchState.open && (
        <CreateBatchModal
          products={stockProducts}
          defaultProductId={createBatchState.defaultProductId}
          onClose={() => setCreateBatchState({ open: false })}
          onSubmit={handleCreateBatch}
        />
      )}

      {disposalBatch && (
        <DisposalModal
          batch={disposalBatch}
          onClose={() => setDisposalBatch(null)}
          onSubmit={handleCreateDisposal}
        />
      )}

      {flashSaleBatch && (
        <FlashSaleModal
          batch={flashSaleBatch}
          onClose={() => setFlashSaleBatch(null)}
          onSubmit={handleSaveFlashSale}
        />
      )}

      {detailBatchId !== null && (
        <BatchDetailModal
          batchId={detailBatchId}
          onClose={() => setDetailBatchId(null)}
          onUpdated={() => void loadAll()}
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

export default AdminInventoryPage;
