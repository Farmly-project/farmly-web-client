import React, { useEffect, useState } from "react";
import { CheckCircle2, Flame, Truck } from "lucide-react";
import { internalApi } from "../../services/internalApi";
import type { BatchItem, OrderRecord } from "../../types/internalTypes";

export const SalesOrdersPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [nearExpiryBatches, setNearExpiryBatches] = useState<BatchItem[]>([]);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadData = async () => {
    const [ordRes, batchRes] = await Promise.all([
      internalApi.getOrders(
        statusFilter ? { status: statusFilter } : undefined,
      ),
      internalApi.getBatches({ status: "in_stock" }),
    ]);
    setOrders(ordRes.data.data.items || []);
    setNearExpiryBatches((batchRes.data.data.items || []).slice(0, 5));
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleConfirmFefo = async (orderId: number) => {
    setProcessingId(orderId);
    try {
      await internalApi.confirmOrderFefo(orderId);
      alert("Đã duyệt đơn và tự động phân bổ trừ kho theo lô FEFO!");
      loadData();
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          "Không đủ tồn kho các lô còn hạn để duyệt đơn",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleNextStatus = async (order: OrderRecord) => {
    const nextMap: Record<string, OrderRecord["status"]> = {
      confirmed: "preparing",
      preparing: "shipping",
      shipping: "delivered",
    };
    const next = nextMap[order.status];
    if (!next) return;
    await internalApi.updateOrderStatus(order.id, next);
    loadData();
  };

  const handleQuickFlashSale = async (batch: BatchItem) => {
    const basePrice = batch.product?.base_price || 30000;
    const discountPrice = Math.round(basePrice * 0.7);
    await internalApi.setBatchFlashSale(batch.id, {
      flash_sale_price: discountPrice,
      flash_sale_ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    });
    alert(
      `Đã bật Flash Sale giảm 30% (${discountPrice.toLocaleString("vi-VN")}đ) cho lô ${batch.batch_code}`,
    );
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Băng rôn Xả hàng Lô cận hạn (UC19) */}
      {nearExpiryBatches.length > 0 && (
        <div className="bg-farmly-cream p-4 rounded-2xl border border-farmly-soft">
          <div className="flex items-center gap-2 text-farmly-badge font-bold text-sm mb-3">
            <Flame size={18} />
            <span>
              Đề xuất Xả hàng Flash Sale (Ưu tiên lô hạn dùng gần nhất)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {nearExpiryBatches.slice(0, 3).map((b) => (
              <div
                key={b.id}
                className="bg-white p-3 rounded-xl border border-farmly-soft flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-mono font-bold text-farmly-dark">
                    {b.batch_code}
                  </p>
                  <p className="text-sm font-semibold truncate">
                    {b.product?.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Tồn: {b.current_quantity} • HSD: {b.exp_date}
                  </p>
                </div>
                <button
                  onClick={() => handleQuickFlashSale(b)}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-farmly-badge text-white text-xs font-bold hover:opacity-90"
                >
                  {b.flash_sale_price ? "Đang Sale" : "Bật Sale -30%"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs lọc trạng thái đơn hàng */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "pending", label: "Chờ duyệt FEFO" },
          { key: "confirmed", label: "Đã xuất kho" },
          { key: "preparing", label: "Đang đóng gói" },
          { key: "shipping", label: "Đang giao" },
          { key: "delivered", label: "Đã giao" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              statusFilter === tab.key
                ? "bg-farmly-dark text-white"
                : "bg-white border border-farmly-soft text-farmly-dark hover:bg-farmly-mint"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bảng Đơn hàng */}
      <div className="bg-white rounded-2xl border border-farmly-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-farmly-mint text-farmly-dark font-semibold border-b border-farmly-soft">
              <tr>
                <th className="px-4 py-3">Mã đơn</th>
                <th className="px-4 py-3">Khách nhận</th>
                <th className="px-4 py-3">Loại đơn</th>
                <th className="px-4 py-3 text-right">Tổng tiền</th>
                <th className="px-4 py-3 text-right">Xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-farmly-soft/60">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-farmly-mint/25">
                  <td className="px-4 py-3 font-mono font-bold text-farmly-dark">
                    {ord.order_number}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{ord.customer_name}</p>
                    <p className="text-xs text-slate-500">
                      {ord.customer_phone} • {ord.shipping_address}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-farmly-mint text-farmly-dark text-xs font-semibold uppercase">
                      {ord.order_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-farmly-dark">
                    {ord.total_amount.toLocaleString("vi-VN")}đ
                  </td>
                  <td className="px-4 py-3 text-right">
                    {ord.status === "pending" && (
                      <button
                        onClick={() => handleConfirmFefo(ord.id)}
                        disabled={processingId === ord.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-farmly-dark text-white text-xs font-semibold hover:bg-farmly-dark-hover disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} />
                        {processingId === ord.id
                          ? "Đang trừ kho..."
                          : "Duyệt & Trừ FEFO"}
                      </button>
                    )}
                    {["confirmed", "preparing", "shipping"].includes(
                      ord.status,
                    ) && (
                      <button
                        onClick={() => handleNextStatus(ord)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-farmly-dot text-white text-xs font-semibold"
                      >
                        <Truck size={14} />
                        Chuyển bước tiếp theo
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
