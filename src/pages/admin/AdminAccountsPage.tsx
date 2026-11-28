import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Phone,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  Sprout,
  Store,
  Unlock,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  accountService,
  extractAccountErrorMessage,
} from "../../services/accountService";
import type {
  CreateStaffAccountPayload,
  StaffAccountRecord,
  StaffAccountsQueryParams,
  StaffPaginationMeta,
  StaffRole,
  StaffStatusFilter,
} from "../../types/account.types";
import { formatDate } from "../../utils/formatters";
import { CreateStaffModal } from "../../components/admin/accounts/CreateStaffModal";
import { AccountStatusModal } from "../../components/admin/accounts/AccountStatusModal";

const ROLE_META: Record<
  string,
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  farm_staff: {
    label: "Nông trại (FARM_STAFF)",
    badgeClass: "bg-farmly-mint text-farmly-dark border border-farmly-soft",
    icon: <Sprout size={12} />,
  },
  sales: {
    label: "Bán hàng & CSKH (SALES)",
    badgeClass: "bg-farmly-cream text-farmly-badge border border-farmly-soft",
    icon: <Store size={12} />,
  },
};

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "NV";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function AdminAccountsPage() {
  const { user: currentUser } = useAuth();

  const [accounts, setAccounts] = useState<StaffAccountRecord[]>([]);
  const [pagination, setPagination] = useState<StaffPaginationMeta>({
    page: 1,
    limit: 20,
    total_items: 0,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bộ lọc khớp getAccountsQuerySchema
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | StaffRole>("");
  const [statusFilter, setStatusFilter] = useState<"" | StaffStatusFilter>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Modals & Banner
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<StaffAccountRecord | null>(
    null,
  );
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => setBanner(null), 5000);
    return () => clearTimeout(timer);
  }, [banner]);

  const buildQuery = useCallback((): StaffAccountsQueryParams => {
    return {
      page,
      limit,
      ...(roleFilter ? { role: roleFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(appliedSearch ? { search: appliedSearch } : {}),
    };
  }, [page, limit, roleFilter, statusFilter, appliedSearch]);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await accountService.getAccounts(buildQuery());
      setAccounts(Array.isArray(res?.items) ? res.items : []);
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (err: unknown) {
      setError(
        extractAccountErrorMessage(
          err,
          "Không thể tải danh sách tài khoản nhân sự.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    let cancelled = false;
    accountService
      .getAccounts(buildQuery())
      .then((res) => {
        if (!cancelled) {
          setAccounts(Array.isArray(res?.items) ? res.items : []);
          if (res?.pagination) {
            setPagination(res.pagination);
          }
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            extractAccountErrorMessage(
              err,
              "Không thể tải danh sách tài khoản nhân sự.",
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
    let active = 0;
    let locked = 0;
    let farmStaff = 0;
    let sales = 0;
    for (const acc of accounts) {
      if (acc.is_active) active += 1;
      else locked += 1;
      if (acc.role === "farm_staff") farmStaff += 1;
      else if (acc.role === "sales") sales += 1;
    }
    return { active, locked, farmStaff, sales };
  }, [accounts]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(searchInput.trim().slice(0, 100));
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setAppliedSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setPage(1);
  };

  const handleCreateAccount = async (payload: CreateStaffAccountPayload) => {
    try {
      const created = await accountService.createAccount(payload);
      setCreateModalOpen(false);
      setBanner({
        type: "success",
        text: `Đã cấp tài khoản cho ${created.full_name} (${created.email}).`,
      });
      await loadAccounts();
    } catch (err: unknown) {
      throw new Error(
        extractAccountErrorMessage(err, "Tạo tài khoản nhân viên thất bại."),
        { cause: err },
      );
    }
  };

  const handleToggleAccountStatus = async (
    nextIsActive: boolean,
    reason?: string,
  ) => {
    if (!statusTarget) return;
    try {
      await accountService.updateAccountStatus(statusTarget.id, {
        is_active: nextIsActive,
        reason,
      });
      setBanner({
        type: "success",
        text: nextIsActive
          ? `Đã mở khóa tài khoản ${statusTarget.full_name}.`
          : `Đã khóa tài khoản ${statusTarget.full_name}.`,
      });
      setStatusTarget(null);
      await loadAccounts();
    } catch (err: unknown) {
      throw new Error(
        extractAccountErrorMessage(
          err,
          "Cập nhật trạng thái tài khoản thất bại.",
        ),
        { cause: err },
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Nút tạo mới */}
      <div className="bg-white p-5 rounded-2xl border border-farmly-soft flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-farmly-dark flex items-center gap-2">
            <Users size={22} className="text-farmly-dot" />
            Quản lý Nhân sự Nội bộ
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Cấp tài khoản và quản lý trạng thái hoạt động của nhân viên Nông
            trại &amp; Bán hàng / CSKH
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadAccounts()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-farmly-soft bg-white text-farmly-dark text-xs font-semibold hover:bg-farmly-mint/50 disabled:opacity-60 transition"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-farmly-dark text-white text-sm font-semibold hover:bg-farmly-dark-hover shadow-sm transition"
          >
            <UserPlus size={16} />
            Cấp tài khoản mới
          </button>
        </div>
      </div>

      {/* KPI tóm tắt */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-farmly-soft">
          <div className="flex items-center justify-between text-farmly-dark">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">
              Tổng nhân sự
            </span>
            <div className="p-2 rounded-xl bg-farmly-mint">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-farmly-dark mt-2">
            {pagination.total_items}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Theo bộ lọc hiện tại
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-farmly-soft">
          <div className="flex items-center justify-between text-farmly-dark">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">
              Đang hoạt động
            </span>
            <div className="p-2 rounded-xl bg-farmly-mint">
              <UserCheck size={16} className="text-farmly-dot" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-farmly-dot mt-2">
            {statsOnPage.active}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Trang {pagination.page}: {statsOnPage.locked} đã khóa
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-farmly-soft">
          <div className="flex items-center justify-between text-farmly-dark">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">
              NV Nông trại
            </span>
            <div className="p-2 rounded-xl bg-farmly-mint">
              <Sprout size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-farmly-dark mt-2">
            {statsOnPage.farmStaff}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Bộ phận canh tác &amp; kho lô
          </p>
        </div>

        <div className="bg-farmly-cream/60 p-4 rounded-2xl border border-farmly-soft">
          <div className="flex items-center justify-between text-farmly-badge">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              NV Bán hàng / CSKH
            </span>
            <div className="p-2 rounded-xl bg-white">
              <Store size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-farmly-badge mt-2">
            {statsOnPage.sales}
          </p>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Duyệt FEFO &amp; khiếu nại
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

      {/* Bộ lọc & Tìm kiếm */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white p-4 rounded-2xl border border-farmly-soft grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
      >
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
            placeholder="Tìm theo họ tên, email hoặc số điện thoại..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as "" | StaffRole);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-farmly-soft text-sm bg-white focus:outline-none focus:border-farmly-dark"
        >
          <option value="">Tất cả vai trò</option>
          <option value="farm_staff">Nhân viên Nông trại</option>
          <option value="sales">Nhân viên Bán hàng / CSKH</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as "" | StaffStatusFilter);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-farmly-soft text-sm bg-white focus:outline-none focus:border-farmly-dark"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="locked">Đã khóa</option>
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
            onClick={handleResetFilters}
            title="Đặt lại bộ lọc"
            className="p-2 rounded-xl border border-farmly-soft text-slate-600 hover:bg-farmly-mint/50 transition"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </form>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Bảng danh sách nhân sự */}
      <div className="bg-white rounded-2xl border border-farmly-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-farmly-mint text-farmly-dark font-semibold border-b border-farmly-soft">
              <tr>
                <th className="px-4 py-3">Nhân viên</th>
                <th className="px-4 py-3">Liên hệ</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-farmly-soft/60">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={6} className="px-4 py-3.5">
                      <div className="h-10 rounded-xl bg-farmly-mint/40" />
                    </td>
                  </tr>
                ))
              ) : accounts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    Không tìm thấy tài khoản nhân viên nào phù hợp.
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => {
                  const roleMeta = ROLE_META[acc.role] ?? {
                    label: acc.role,
                    badgeClass: "bg-slate-100 text-slate-700",
                    icon: null,
                  };
                  const isSelf = currentUser?.id === acc.id;

                  return (
                    <tr
                      key={acc.id}
                      className="hover:bg-farmly-mint/20 transition"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-farmly-dark text-white text-xs font-bold flex items-center justify-center shrink-0 overflow-hidden">
                            {acc.avatar_url ? (
                              <img
                                src={acc.avatar_url}
                                alt={acc.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              getInitials(acc.full_name)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-farmly-dark truncate">
                              {acc.full_name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {acc.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                        {acc.phone ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-farmly-dark">
                            <Phone size={12} className="text-farmly-dot" />
                            {acc.phone}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">
                            Chưa cập nhật
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${roleMeta.badgeClass}`}
                        >
                          {roleMeta.icon}
                          {roleMeta.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              acc.is_active ? "bg-farmly-dot" : "bg-red-500"
                            }`}
                          />
                          <span
                            className={
                              acc.is_active ? "text-farmly-dark" : "text-red-600"
                            }
                          >
                            {acc.is_active ? "Đang hoạt động" : "Đã khóa"}
                          </span>
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                        {formatDate(acc.created_at)}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          disabled={isSelf}
                          onClick={() => setStatusTarget(acc)}
                          title={
                            isSelf
                              ? "Không thể tự khóa tài khoản đang đăng nhập"
                              : acc.is_active
                                ? "Khóa tài khoản nhân viên"
                                : "Mở khóa tài khoản nhân viên"
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-45 ${
                            acc.is_active
                              ? "border border-farmly-soft text-farmly-badge hover:bg-farmly-cream"
                              : "bg-farmly-dark text-white hover:bg-farmly-dark-hover"
                          }`}
                        >
                          {acc.is_active ? (
                            <>
                              <Lock size={13} />
                              Khóa
                            </>
                          ) : (
                            <>
                              <Unlock size={13} />
                              Mở khóa
                            </>
                          )}
                        </button>
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
              <strong className="text-farmly-dark">{accounts.length}</strong> /{" "}
              {pagination.total_items} tài khoản
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

      {/* Modals */}
      {createModalOpen && (
        <CreateStaffModal
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateAccount}
        />
      )}

      {statusTarget && (
        <AccountStatusModal
          account={statusTarget}
          onClose={() => setStatusTarget(null)}
          onConfirm={handleToggleAccountStatus}
        />
      )}
    </div>
  );
}

export default AdminAccountsPage;
