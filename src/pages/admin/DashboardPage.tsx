// src/pages/admin/DashboardPage.tsx
// Dashboard thống kê Admin:
//   GET /dashboard/summary        → KPI tổng quan
//   GET /dashboard/revenue-by-day → Biểu đồ theo ngày
//   GET /dashboard/disposal-report → Hao hụt lô hàng
//   GET /dashboard/export-excel   → Xuất .xlsx
// verbatimModuleSyntax: import type cho mọi interface/type.

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Download,
  Package,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { internalApi } from "../../services/internalApi";
import type {
  DashboardSummary,
  DisposalBatchReport,
  RevenueByDayItem,
} from "../../types/internalTypes";

function formatVND(amount: number): string {
  return amount.toLocaleString("vi-VN") + "đ";
}

export function DashboardPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [revenueSeries, setRevenueSeries] = useState<RevenueByDayItem[]>([]);
  const [disposalBatches, setDisposalBatches] = useState<DisposalBatchReport[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {}),
      };
      const [sumRes, revRes, dispRes] = await Promise.all([
        internalApi.getDashboardSummary(params),
        internalApi.getRevenueByDay(params),
        internalApi.getDisposalReport(params),
      ]);
      setSummary(sumRes.data.data);
      setRevenueSeries(revRes.data.data.series ?? []);
      setDisposalBatches(dispRes.data.data.batches ?? []);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Không thể tải dữ liệu dashboard",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = async () => {
    setExporting(true);
    try {
      await internalApi.exportDashboardExcel({
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {}),
      });
    } catch (err: unknown) {
      alert(
        err instanceof Error ? err.message : "Không có dữ liệu để xuất Excel",
      );
    } finally {
      setExporting(false);
    }
  };

  const maxRevenue = Math.max(...revenueSeries.map((d) => d.net_revenue), 1);

  return (
    <div className="space-y-6">
      {/* Header & Bộ lọc */}
      <div className="bg-white p-5 rounded-2xl border border-farmly-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-farmly-dark">
            Báo cáo Kinh doanh &amp; Hao hụt
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Doanh thu thực nhận và tỷ lệ hao hụt kho FEFO
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
          />
          <span className="text-slate-400">→</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-farmly-soft text-sm focus:outline-none focus:border-farmly-dark"
          />
          <button
            onClick={() => void fetchAll()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-farmly-mint text-farmly-dark border border-farmly-soft text-sm font-semibold hover:opacity-90 disabled:opacity-60"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Lọc dữ liệu
          </button>
          <button
            onClick={() => void handleExport()}
            disabled={exporting || loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-farmly-dark text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            <Download size={15} />
            {exporting ? "Đang xuất..." : "Xuất Excel (.xlsx)"}
          </button>
        </div>
      </div>

      {/* Lỗi */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Skeleton */}
      {loading && !summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border border-farmly-soft animate-pulse h-28"
            />
          ))}
        </div>
      )}

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-farmly-soft">
            <div className="flex items-center justify-between text-farmly-dark">
              <span className="text-xs font-bold uppercase tracking-wider opacity-75">
                Doanh thu ròng
              </span>
              <div className="p-2 rounded-xl bg-farmly-mint">
                <TrendingUp size={18} />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-farmly-dark mt-3">
              {formatVND(summary.revenue.net_revenue)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Đã trừ hoàn tiền: {formatVND(summary.revenue.refunded_amount)}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-farmly-soft">
            <div className="flex items-center justify-between text-farmly-dark">
              <span className="text-xs font-bold uppercase tracking-wider opacity-75">
                Tổng đơn hàng
              </span>
              <div className="p-2 rounded-xl bg-farmly-mint">
                <ShoppingBag size={18} />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-farmly-dark mt-3">
              {summary.orders.total_orders} đơn
            </p>
            <p className="text-xs text-farmly-dot font-medium mt-1">
              Đã giao: {summary.orders.by_status["delivered"] ?? 0} &bull; Gói
              định kỳ: {summary.orders.active_subscriptions}
            </p>
          </div>

          <div className="bg-farmly-cream/70 p-5 rounded-2xl border border-farmly-soft">
            <div className="flex items-center justify-between text-farmly-badge">
              <span className="text-xs font-bold uppercase tracking-wider">
                Tỷ lệ hao hụt kho
              </span>
              <div className="p-2 rounded-xl bg-white">
                <AlertTriangle size={18} />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-farmly-badge mt-3">
              {summary.inventory_loss.overall_disposal_rate}%
            </p>
            <p className="text-xs text-slate-700 mt-1">
              Hủy {summary.inventory_loss.total_disposed_qty} / Nhập{" "}
              {summary.inventory_loss.total_imported_qty} kg
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-farmly-soft">
            <div className="flex items-center justify-between text-farmly-dark">
              <span className="text-xs font-bold uppercase tracking-wider opacity-75">
                Số lô canh tác
              </span>
              <div className="p-2 rounded-xl bg-farmly-mint">
                <Package size={18} />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-farmly-dark mt-3">
              {summary.inventory_loss.total_batches} lô
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Kỳ: {summary.period.start_date} → {summary.period.end_date}
            </p>
          </div>
        </div>
      )}

      {/* Biểu đồ + Top sản phẩm */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-farmly-soft">
            <h2 className="text-base font-bold text-farmly-dark mb-4">
              Biểu đồ Doanh thu ròng theo ngày
            </h2>
            {revenueSeries.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-sm text-slate-400">
                Không có dữ liệu doanh thu trong kỳ này.
              </div>
            ) : (
              <div className="h-56 flex items-end gap-1.5 pt-6 overflow-x-auto">
                {revenueSeries.slice(-14).map((item) => {
                  const h = Math.max(
                    6,
                    Math.round((item.net_revenue / maxRevenue) * 100),
                  );
                  return (
                    <div
                      key={item.date}
                      className="flex-1 min-w-34px flex flex-col items-center group"
                    >
                      <span className="text-[10px] font-semibold text-farmly-dark opacity-0 group-hover:opacity-100 transition mb-1">
                        {(item.net_revenue / 1000).toFixed(0)}k
                      </span>
                      <div
                        style={{ height: `${h}%` }}
                        className="w-full max-w-28px rounded-t-lg bg-farmly-dark group-hover:bg-farmly-dot transition-all"
                        title={`${item.date}: ${formatVND(item.net_revenue)}`}
                      />
                      <span className="text-[10px] text-slate-500 mt-2">
                        {item.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-farmly-soft">
            <h2 className="text-base font-bold text-farmly-dark mb-4">
              Top Nông sản bán chạy
            </h2>
            <div className="space-y-3">
              {summary.top_products.length === 0 ? (
                <p className="text-sm text-slate-400">Chưa có dữ liệu.</p>
              ) : (
                summary.top_products.slice(0, 5).map((p, idx) => (
                  <div
                    key={p.product_id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-farmly-mint/50 border border-farmly-soft/70"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-farmly-dark text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <p className="text-sm font-semibold text-farmly-dark truncate">
                          {p.product_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Đã bán: {p.total_quantity_sold}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-farmly-badge shrink-0">
                      {formatVND(p.total_revenue)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bảng hao hụt */}
      {summary && (
        <div className="bg-white rounded-2xl border border-farmly-soft overflow-hidden">
          <div className="px-5 py-4 bg-farmly-mint/60 border-b border-farmly-soft">
            <h2 className="text-base font-bold text-farmly-dark">
              Chi tiết Tỷ lệ Xuất hủy / Hao hụt theo Lô
            </h2>
          </div>
          <div className="overflow-x-auto">
            {disposalBatches.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-400">
                Không có lô hàng nào trong kỳ được chọn.
              </p>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-farmly-mint text-farmly-dark font-semibold border-b border-farmly-soft">
                  <tr>
                    <th className="px-4 py-3">Mã lô</th>
                    <th className="px-4 py-3">Nông sản</th>
                    <th className="px-4 py-3">Hạn dùng</th>
                    <th className="px-4 py-3 text-right">Nhập kho</th>
                    <th className="px-4 py-3 text-right">Tồn hiện tại</th>
                    <th className="px-4 py-3 text-right">Xuất hủy</th>
                    <th className="px-4 py-3 text-right">Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-farmly-soft/60">
                  {disposalBatches.map((b) => (
                    <tr key={b.batch_id} className="hover:bg-farmly-mint/25">
                      <td className="px-4 py-3 font-mono font-semibold text-farmly-dark">
                        {b.batch_code}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {b.product_name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {b.exp_date ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {b.initial_quantity} {b.unit}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-farmly-dot">
                        {b.current_quantity} {b.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600 font-semibold">
                        {b.disposed_quantity} {b.unit}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            b.disposal_rate >= 10
                              ? "bg-farmly-badge text-white"
                              : "bg-farmly-mint text-farmly-dark"
                          }`}
                        >
                          {b.disposal_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
