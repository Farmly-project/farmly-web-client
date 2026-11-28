import React, { useEffect, useState } from "react";
import { Check, RefreshCcw, XCircle } from "lucide-react";
import { internalApi } from "../../services/internalApi";
import type { ComplaintRecord } from "../../types/internalTypes";

export const SalesComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [rejectNoteMap, setRejectNoteMap] = useState<Record<number, string>>(
    {},
  );

  const loadComplaints = async () => {
    const res = await internalApi.getComplaints({ status: "pending" });
    setComplaints(res.data.data.items || []);
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleResolve = async (
    c: ComplaintRecord,
    resolution: "refund" | "replacement",
  ) => {
    await internalApi.handleComplaint(c.id, {
      action: "approve",
      resolution,
      auto_confirm_replacement: resolution === "replacement",
      sales_note:
        resolution === "refund"
          ? "Đã duyệt hoàn tiền qua PayOS"
          : "Đã duyệt tạo đơn giao bù 0đ và trừ kho FEFO",
    });
    alert(
      resolution === "refund"
        ? "Đã duyệt hoàn tiền cho khách hàng!"
        : "Đã tạo đơn giao bù 0đ thành công!",
    );
    loadComplaints();
  };

  const handleReject = async (c: ComplaintRecord) => {
    const note = rejectNoteMap[c.id]?.trim();
    if (!note) {
      alert("Vui lòng nhập lý do từ chối khiếu nại!");
      return;
    }
    await internalApi.handleComplaint(c.id, {
      action: "reject",
      sales_note: note,
    });
    loadComplaints();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl border border-farmly-soft">
        <h1 className="text-lg font-bold text-farmly-dark">
          Hàng đợi Khiếu nại & Đổi trả trong 24h ({complaints.length} yêu cầu
          chờ duyệt)
        </h1>
      </div>

      {complaints.map((c) => (
        <div
          key={c.id}
          className="bg-white p-5 rounded-2xl border border-farmly-soft space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-farmly-soft pb-3">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-farmly-cream text-farmly-badge text-xs font-bold mr-2">
                Khiếu nại #{c.id}
              </span>
              <span className="font-bold text-farmly-dark">
                {c.order_item?.product_name} (Số lượng lỗi:{" "}
                {c.quantity_affected})
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Đơn: {c.order_item?.order?.order_number} • Khách:{" "}
                {c.order_item?.order?.customer_name} (
                {c.order_item?.order?.customer_phone})
              </p>
            </div>
            <span className="text-xs font-bold uppercase px-3 py-1 rounded-xl bg-farmly-mint text-farmly-dark">
              Khách đề xuất:{" "}
              {c.requested_resolution === "refund" ? "Hoàn tiền" : "Giao bù"}
            </span>
          </div>

          <p className="text-sm text-slate-700">
            <strong>Lý do ({c.reason}):</strong>{" "}
            {c.description || "Không có mô tả thêm"}
          </p>

          {/* Ảnh/Video minh chứng */}
          {c.media && c.media.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {c.media.map((m) =>
                m.media_type === "image" ? (
                  <img
                    key={m.id}
                    src={m.url}
                    alt="Minh chứng"
                    className="w-24 h-24 object-cover rounded-xl border border-farmly-soft"
                  />
                ) : (
                  <video
                    key={m.id}
                    src={m.url}
                    controls
                    className="w-40 h-24 rounded-xl border border-farmly-soft"
                  />
                ),
              )}
            </div>
          )}

          {/* Thanh hành động của Sales */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleResolve(c, "refund")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-farmly-dark text-white text-xs font-semibold hover:bg-farmly-dark-hover"
              >
                <Check size={14} />
                Duyệt Hoàn tiền
              </button>
              <button
                onClick={() => handleResolve(c, "replacement")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-farmly-dot text-white text-xs font-semibold"
              >
                <RefreshCcw size={14} />
                Tạo đơn Giao bù 0đ
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                placeholder="Nhập lý do nếu từ chối..."
                value={rejectNoteMap[c.id] || ""}
                onChange={(e) =>
                  setRejectNoteMap({ ...rejectNoteMap, [c.id]: e.target.value })
                }
                className="px-3 py-2 rounded-xl border border-farmly-soft text-xs flex-1 min-w-200px"
              />
              <button
                onClick={() => handleReject(c)}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-farmly-badge text-white text-xs font-semibold shrink-0"
              >
                <XCircle size={14} />
                Từ chối
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
