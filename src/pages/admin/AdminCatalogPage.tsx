import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarSync,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  FolderTree,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import {
  catalogService,
  extractCatalogErrorMessage,
} from "../../services/catalogService";
import type {
  AdminPaginationMeta,
  AdminProductQueryParams,
  CategoryPayload,
  CategoryRecord,
  ProductPayload,
  ProductRecord,
} from "../../types/catalog.types";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { CategoryFormModal } from "../../components/admin/catalog/CategoryFormModal";
import { ProductFormModal } from "../../components/admin/catalog/ProductFormModal";
import { ProductDetailCertModal } from "../../components/admin/catalog/ProductDetailCertModal";
import { ConfirmDeleteModal } from "../../components/admin/catalog/ConfirmDeleteModal";

type CatalogTab = "products" | "categories";

export function AdminCatalogPage() {
  const [activeTab, setActiveTab] = useState<CatalogTab>("products");

  // Thông báo trạng thái thao tác
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Dữ liệu Danh mục
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState("");
  const [categorySubFilter, setCategorySubFilter] = useState<
    "all" | "yes" | "no"
  >("all");

  // Dữ liệu Sản phẩm
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [pagination, setPagination] = useState<AdminPaginationMeta>({
    page: 1,
    limit: 20,
    total_items: 0,
    total_pages: 1,
  });
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);

  // Bộ lọc Sản phẩm (khớp getProductsQuerySchema ở backend)
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");
  const [filterSubscription, setFilterSubscription] = useState<
    "" | "true" | "false"
  >("");
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">(
    "newest",
  );
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // State Modals
  const [categoryModalState, setCategoryModalState] = useState<{
    open: boolean;
    category: CategoryRecord | null;
  }>({ open: false, category: null });

  const [productModalState, setProductModalState] = useState<{
    open: boolean;
    product: ProductRecord | null;
  }>({ open: false, product: null });
  const [loadingProductForEdit, setLoadingProductForEdit] = useState<
    number | null
  >(null);

  const [detailProductId, setDetailProductId] = useState<number | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    kind: "category" | "product";
    id: number;
    name: string;
  } | null>(null);

  const showBanner = useCallback(
    (type: "success" | "error", text: string) => {
      setBanner({ type, text });
    },
    [],
  );

  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => setBanner(null), 5000);
    return () => clearTimeout(timer);
  }, [banner]);

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    setCategoryError(null);
    try {
      const list = await catalogService.getCategories();
      setCategories(Array.isArray(list) ? list : []);
    } catch (err: unknown) {
      setCategoryError(
        extractCatalogErrorMessage(err, "Không thể tải danh sách danh mục."),
      );
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const buildProductQuery = useCallback((): AdminProductQueryParams => {
    return {
      page,
      limit,
      sort_by: sortBy,
      ...(appliedSearch ? { search: appliedSearch } : {}),
      ...(filterCategoryId ? { category_id: Number(filterCategoryId) } : {}),
      ...(filterSubscription !== ""
        ? { allow_subscription: filterSubscription === "true" }
        : {}),
      ...(filterMinPrice !== "" && Number(filterMinPrice) >= 0
        ? { min_price: Number(filterMinPrice) }
        : {}),
      ...(filterMaxPrice !== "" && Number(filterMaxPrice) >= 0
        ? { max_price: Number(filterMaxPrice) }
        : {}),
    };
  }, [
    page,
    limit,
    sortBy,
    appliedSearch,
    filterCategoryId,
    filterSubscription,
    filterMinPrice,
    filterMaxPrice,
  ]);

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    setProductError(null);
    try {
      const result = await catalogService.getProducts(buildProductQuery());
      setProducts(Array.isArray(result?.items) ? result.items : []);
      if (result?.pagination) {
        setPagination(result.pagination);
      }
    } catch (err: unknown) {
      setProductError(
        extractCatalogErrorMessage(err, "Không thể tải danh sách sản phẩm."),
      );
    } finally {
      setLoadingProducts(false);
    }
  }, [buildProductQuery]);

  useEffect(() => {
    let cancelled = false;
    catalogService
      .getCategories()
      .then((list) => {
        if (!cancelled) {
          setCategories(Array.isArray(list) ? list : []);
          setCategoryError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setCategoryError(
            extractCatalogErrorMessage(
              err,
              "Không thể tải danh sách danh mục.",
            ),
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingCategories(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const query = buildProductQuery();
    catalogService
      .getProducts(query)
      .then((result) => {
        if (!cancelled) {
          setProducts(Array.isArray(result?.items) ? result.items : []);
          if (result?.pagination) {
            setPagination(result.pagination);
          }
          setProductError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setProductError(
            extractCatalogErrorMessage(err, "Không thể tải danh sách sản phẩm."),
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [buildProductQuery]);

  // Lọc danh mục phía client
  const filteredCategories = useMemo(() => {
    const keyword = categorySearch.trim().toLowerCase();
    return categories.filter((cat) => {
      const matchesKeyword =
        !keyword ||
        cat.name.toLowerCase().includes(keyword) ||
        cat.slug.toLowerCase().includes(keyword) ||
        (cat.description ?? "").toLowerCase().includes(keyword);

      const matchesSub =
        categorySubFilter === "all" ||
        (categorySubFilter === "yes" && cat.allow_subscription) ||
        (categorySubFilter === "no" && !cat.allow_subscription);

      return matchesKeyword && matchesSub;
    });
  }, [categories, categorySearch, categorySubFilter]);

  const subscriptionCategoryCount = useMemo(
    () => categories.filter((c) => c.allow_subscription).length,
    [categories],
  );

  // --- Handlers Danh mục ---
  const handleSaveCategory = async (payload: CategoryPayload) => {
    try {
      if (categoryModalState.category) {
        await catalogService.updateCategory(
          categoryModalState.category.id,
          payload,
        );
        showBanner("success", `Đã cập nhật danh mục "${payload.name}".`);
      } else {
        await catalogService.createCategory(payload);
        showBanner("success", `Đã tạo danh mục "${payload.name}" thành công.`);
      }
      setCategoryModalState({ open: false, category: null });
      await Promise.all([loadCategories(), loadProducts()]);
    } catch (err: unknown) {
      throw new Error(
        extractCatalogErrorMessage(err, "Lưu danh mục thất bại."),
        { cause: err },
      );
    }
  };

  // --- Handlers Sản phẩm ---
  const handleOpenEditProduct = async (product: ProductRecord) => {
    setLoadingProductForEdit(product.id);
    try {
      const detail = await catalogService.getProductById(product.id);
      setProductModalState({ open: true, product: detail });
    } catch (err: unknown) {
      showBanner(
        "error",
        extractCatalogErrorMessage(
          err,
          "Không thể tải chi tiết sản phẩm để chỉnh sửa.",
        ),
      );
    } finally {
      setLoadingProductForEdit(null);
    }
  };

  const handleSaveProduct = async (payload: ProductPayload) => {
    try {
      if (productModalState.product) {
        await catalogService.updateProduct(
          productModalState.product.id,
          payload,
        );
        showBanner("success", `Đã cập nhật sản phẩm "${payload.name}".`);
      } else {
        await catalogService.createProduct(payload);
        showBanner("success", `Đã tạo sản phẩm "${payload.name}" thành công.`);
      }
      setProductModalState({ open: false, product: null });
      await loadProducts();
    } catch (err: unknown) {
      throw new Error(
        extractCatalogErrorMessage(err, "Lưu sản phẩm thất bại."),
        { cause: err },
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.kind === "category") {
        await catalogService.deleteCategory(deleteTarget.id);
        showBanner(
          "success",
          `Đã xóa mềm danh mục "${deleteTarget.name}".`,
        );
        setDeleteTarget(null);
        await Promise.all([loadCategories(), loadProducts()]);
      } else {
        await catalogService.deleteProduct(deleteTarget.id);
        showBanner(
          "success",
          `Đã xóa mềm sản phẩm "${deleteTarget.name}".`,
        );
        setDeleteTarget(null);
        await loadProducts();
      }
    } catch (err: unknown) {
      throw new Error(
        extractCatalogErrorMessage(err, "Không thể xóa mục đã chọn."),
        { cause: err },
      );
    }
  };

  const handleApplyProductSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(searchInput.trim().slice(0, 100));
  };

  const handleResetProductFilters = () => {
    setSearchInput("");
    setAppliedSearch("");
    setFilterCategoryId("");
    setFilterSubscription("");
    setFilterMinPrice("");
    setFilterMaxPrice("");
    setSortBy("newest");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header & KPI nhanh */}
      <div className="bg-white p-5 rounded-2xl border border-farmly-soft flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-farmly-dark flex items-center gap-2">
            <FolderTree size={22} className="text-farmly-dot" />
            Quản lý Danh mục &amp; Sản phẩm
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Quản trị danh mục nông sản, thông tin sản phẩm, giá bán và chứng
            nhận kiểm định chất lượng
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3.5 py-2 rounded-xl bg-farmly-mint/60 border border-farmly-soft text-xs">
            <span className="text-slate-600">Danh mục:</span>{" "}
            <strong className="text-farmly-dark">{categories.length}</strong>{" "}
            <span className="text-farmly-dot font-medium">
              ({subscriptionCategoryCount} định kỳ)
            </span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-farmly-mint/60 border border-farmly-soft text-xs">
            <span className="text-slate-600">Sản phẩm:</span>{" "}
            <strong className="text-farmly-dark">
              {pagination.total_items}
            </strong>
          </div>
          <button
            type="button"
            onClick={() => {
              void loadCategories();
              void loadProducts();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-farmly-soft bg-white text-farmly-dark text-xs font-semibold hover:bg-farmly-mint/50 transition"
          >
            <RefreshCw
              size={14}
              className={
                loadingCategories || loadingProducts ? "animate-spin" : ""
              }
            />
            Làm mới
          </button>
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

      {/* Tabs chuyển đổi Sản phẩm / Danh mục */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-2xl bg-white border border-farmly-soft">
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === "products"
                ? "bg-farmly-dark text-white shadow-sm"
                : "text-farmly-dark hover:bg-farmly-mint/60"
            }`}
          >
            <Package size={16} />
            Sản phẩm
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === "products"
                  ? "bg-white/20 text-white"
                  : "bg-farmly-mint text-farmly-dark"
              }`}
            >
              {pagination.total_items}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === "categories"
                ? "bg-farmly-dark text-white shadow-sm"
                : "text-farmly-dark hover:bg-farmly-mint/60"
            }`}
          >
            <FolderTree size={16} />
            Danh mục
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === "categories"
                  ? "bg-white/20 text-white"
                  : "bg-farmly-mint text-farmly-dark"
              }`}
            >
              {categories.length}
            </span>
          </button>
        </div>

        {activeTab === "products" ? (
          <button
            type="button"
            onClick={() => setProductModalState({ open: true, product: null })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-farmly-dark text-white text-sm font-semibold hover:bg-farmly-dark-hover shadow-sm transition"
          >
            <Plus size={16} />
            Thêm sản phẩm mới
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              setCategoryModalState({ open: true, category: null })
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-farmly-dark text-white text-sm font-semibold hover:bg-farmly-dark-hover shadow-sm transition"
          >
            <Plus size={16} />
            Thêm danh mục mới
          </button>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          TAB 1: QUẢN LÝ SẢN PHẨM
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === "products" && (
        <div className="space-y-4">
          {/* Thanh tìm kiếm & bộ lọc */}
          <form
            onSubmit={handleApplyProductSearch}
            className="bg-white p-4 rounded-2xl border border-farmly-soft space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="lg:col-span-2 relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  maxLength={100}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm theo tên sản phẩm..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
                />
              </div>

              <select
                value={filterCategoryId}
                onChange={(e) => {
                  setFilterCategoryId(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-farmly-soft text-sm bg-white focus:outline-none focus:border-farmly-dark"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={filterSubscription}
                onChange={(e) => {
                  setFilterSubscription(
                    e.target.value as "" | "true" | "false",
                  );
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-farmly-soft text-sm bg-white focus:outline-none focus:border-farmly-dark"
              >
                <option value="">Mọi loại gói</option>
                <option value="true">Hỗ trợ gói định kỳ</option>
                <option value="false">Chỉ bán lẻ</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(
                    e.target.value as "newest" | "price_asc" | "price_desc",
                  );
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-farmly-soft text-sm bg-white focus:outline-none focus:border-farmly-dark"
              >
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
              </select>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-farmly-mint border border-farmly-soft text-farmly-dark text-xs font-bold hover:bg-farmly-cream transition"
                >
                  Tìm kiếm
                </button>
                <button
                  type="button"
                  onClick={handleResetProductFilters}
                  title="Đặt lại bộ lọc"
                  className="p-2 rounded-xl border border-farmly-soft text-slate-600 hover:bg-farmly-mint/50 transition"
                >
                  <RotateCcw size={15} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
              <span className="font-semibold text-farmly-dark">
                Khoảng giá (VNĐ):
              </span>
              <input
                type="number"
                min={0}
                step={1000}
                value={filterMinPrice}
                onChange={(e) => {
                  setFilterMinPrice(e.target.value);
                  setPage(1);
                }}
                placeholder="Từ giá"
                className="w-28 px-3 py-1.5 rounded-lg border border-farmly-soft text-xs focus:outline-none focus:border-farmly-dark"
              />
              <span>—</span>
              <input
                type="number"
                min={0}
                step={1000}
                value={filterMaxPrice}
                onChange={(e) => {
                  setFilterMaxPrice(e.target.value);
                  setPage(1);
                }}
                placeholder="Đến giá"
                className="w-28 px-3 py-1.5 rounded-lg border border-farmly-soft text-xs focus:outline-none focus:border-farmly-dark"
              />
            </div>
          </form>

          {productError && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium">
              {productError}
            </div>
          )}

          {/* Bảng danh sách sản phẩm */}
          <div className="bg-white rounded-2xl border border-farmly-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-farmly-mint text-farmly-dark font-semibold border-b border-farmly-soft">
                  <tr>
                    <th className="px-4 py-3">Sản phẩm</th>
                    <th className="px-4 py-3">Danh mục</th>
                    <th className="px-4 py-3 text-right">Giá cơ bản</th>
                    <th className="px-4 py-3 text-right">Tồn FEFO</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-farmly-soft/60">
                  {loadingProducts ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="px-4 py-3.5" colSpan={6}>
                          <div className="h-10 rounded-xl bg-farmly-mint/40" />
                        </td>
                      </tr>
                    ))
                  ) : products.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-sm text-slate-500"
                      >
                        Không tìm thấy sản phẩm nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    products.map((prod) => (
                      <tr
                        key={prod.id}
                        className="hover:bg-farmly-mint/20 transition"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-52">
                            <div className="w-12 h-12 rounded-xl border border-farmly-soft bg-farmly-mint/30 overflow-hidden flex items-center justify-center shrink-0">
                              {prod.primary_image ||
                              prod.images?.[0]?.image_url ? (
                                <img
                                  src={
                                    prod.primary_image ||
                                    prod.images?.[0]?.image_url ||
                                    ""
                                  }
                                  alt={prod.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package
                                  size={18}
                                  className="text-farmly-dot"
                                />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-farmly-dark truncate max-w-xs">
                                {prod.name}
                              </p>
                              <p className="text-[11px] font-mono text-slate-400 truncate max-w-xs">
                                #{prod.id} &bull; {prod.slug}
                              </p>
                              {prod.short_description && (
                                <p className="text-xs text-slate-500 truncate max-w-xs mt-0.5">
                                  {prod.short_description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-col items-start gap-1">
                            <span className="px-2.5 py-0.5 rounded-lg bg-farmly-mint text-farmly-dark text-xs font-semibold">
                              {prod.category?.name ?? "Chưa phân loại"}
                            </span>
                            {prod.category?.allow_subscription && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-farmly-dot">
                                <CalendarSync size={12} />
                                Gói định kỳ
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <p className="font-bold text-farmly-dark">
                            {formatCurrency(prod.base_price)}
                            <span className="text-xs font-normal text-slate-500">
                              /{prod.unit}
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Bảo quản {prod.preservation_days} ngày
                          </p>
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <p
                            className={`font-bold ${
                              (prod.available_quantity ?? 0) > 0
                                ? "text-farmly-dot"
                                : "text-slate-400"
                            }`}
                          >
                            {prod.available_quantity ?? 0} {prod.unit}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {prod.nearest_exp_date
                              ? `HSD: ${formatDate(prod.nearest_exp_date)}`
                              : "Chưa có lô tồn"}
                          </p>
                          {prod.has_flash_sale && prod.flash_sale_price && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-farmly-cream text-farmly-badge text-[10px] font-bold">
                              Sale: {formatCurrency(prod.flash_sale_price)}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                prod.is_active
                                  ? "bg-farmly-dot"
                                  : "bg-slate-400"
                              }`}
                            />
                            {prod.is_active ? "Đang bán" : "Ngừng bán"}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDetailProductId(prod.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-farmly-mint text-farmly-dark text-xs font-semibold hover:bg-farmly-cream transition"
                              title="Xem chi tiết & Chứng nhận kiểm định"
                            >
                              <ShieldCheck size={13} />
                              Chứng nhận
                            </button>
                            <button
                              type="button"
                              disabled={loadingProductForEdit === prod.id}
                              onClick={() => void handleOpenEditProduct(prod)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-farmly-soft text-farmly-dark text-xs font-semibold hover:bg-farmly-mint/50 disabled:opacity-60 transition"
                              title="Chỉnh sửa sản phẩm"
                            >
                              {loadingProductForEdit === prod.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Edit3 size={13} />
                              )}
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  kind: "product",
                                  id: prod.id,
                                  name: prod.name,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition"
                              title="Xóa mềm sản phẩm"
                            >
                              <Trash2 size={13} />
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Phân trang */}
            <div className="px-4 py-3 bg-[#F7FBF7] border-t border-farmly-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-3">
                <span>
                  Hiển thị{" "}
                  <strong className="text-farmly-dark">
                    {products.length}
                  </strong>{" "}
                  / {pagination.total_items} sản phẩm
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
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB 2: QUẢN LÝ DANH MỤC
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-farmly-soft flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Tìm danh mục theo tên, slug hoặc mô tả..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
              />
            </div>

            <select
              value={categorySubFilter}
              onChange={(e) =>
                setCategorySubFilter(e.target.value as "all" | "yes" | "no")
              }
              className="px-3.5 py-2 rounded-xl border border-farmly-soft text-sm bg-white focus:outline-none focus:border-farmly-dark"
            >
              <option value="all">Tất cả danh mục</option>
              <option value="yes">Hỗ trợ gói định kỳ</option>
              <option value="no">Không hỗ trợ định kỳ</option>
            </select>
          </div>

          {categoryError && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium">
              {categoryError}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-farmly-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-farmly-mint text-farmly-dark font-semibold border-b border-farmly-soft">
                  <tr>
                    <th className="px-4 py-3">Danh mục</th>
                    <th className="px-4 py-3">Mô tả</th>
                    <th className="px-4 py-3">Gói định kỳ</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-farmly-soft/60">
                  {loadingCategories ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="px-4 py-3.5" colSpan={5}>
                          <div className="h-10 rounded-xl bg-farmly-mint/40" />
                        </td>
                      </tr>
                    ))
                  ) : filteredCategories.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-sm text-slate-500"
                      >
                        Chưa có danh mục nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat) => (
                      <tr
                        key={cat.id}
                        className="hover:bg-farmly-mint/20 transition"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl border border-farmly-soft bg-farmly-mint/40 overflow-hidden flex items-center justify-center shrink-0">
                              {cat.image_url ? (
                                <img
                                  src={cat.image_url}
                                  alt={cat.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FolderTree
                                  size={18}
                                  className="text-farmly-dot"
                                />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-farmly-dark">
                                {cat.name}
                              </p>
                              <p className="text-[11px] font-mono text-slate-400">
                                #{cat.id} &bull; {cat.slug}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-xs text-slate-600 max-w-md">
                          {cat.description || (
                            <span className="text-slate-400 italic">
                              Chưa có mô tả
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          {cat.allow_subscription ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-farmly-mint text-farmly-dark text-xs font-semibold">
                              <CalendarSync size={12} />
                              Hỗ trợ định kỳ
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                              Chỉ bán lẻ
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                cat.is_active ? "bg-farmly-dot" : "bg-slate-400"
                              }`}
                            />
                            {cat.is_active ? "Đang hoạt động" : "Tạm ẩn"}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setCategoryModalState({
                                  open: true,
                                  category: cat,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-farmly-soft text-farmly-dark text-xs font-semibold hover:bg-farmly-mint/50 transition"
                            >
                              <Edit3 size={13} />
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  kind: "category",
                                  id: cat.id,
                                  name: cat.name,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition"
                            >
                              <Trash2 size={13} />
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {categoryModalState.open && (
        <CategoryFormModal
          initialCategory={categoryModalState.category}
          onClose={() =>
            setCategoryModalState({ open: false, category: null })
          }
          onSubmit={handleSaveCategory}
        />
      )}

      {productModalState.open && (
        <ProductFormModal
          categories={categories}
          initialProduct={productModalState.product}
          onClose={() => setProductModalState({ open: false, product: null })}
          onSubmit={handleSaveProduct}
        />
      )}

      {detailProductId !== null && (
        <ProductDetailCertModal
          productId={detailProductId}
          onClose={() => setDetailProductId(null)}
          onCertificationAdded={() => void loadProducts()}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          title={
            deleteTarget.kind === "category"
              ? "Xóa mềm danh mục nông sản"
              : "Xóa mềm sản phẩm"
          }
          description={`Bạn có chắc muốn xóa ${
            deleteTarget.kind === "category" ? "danh mục" : "sản phẩm"
          } "${deleteTarget.name}"? Dữ liệu sẽ được ẩn khỏi gian hàng (soft-delete).`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

export default AdminCatalogPage;
