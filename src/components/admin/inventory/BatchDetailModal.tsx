import { useEffect, useState, type FormEvent } from "react";
import {
  BookOpen,
  ExternalLink,
  Loader2,
  Plus,
  QrCode,
  Trash2,
  X,
} from "lucide-react";
import {
  extractInventoryErrorMessage,
  inventoryService,
} from "../../../services/inventoryService";
import type {
  BatchFarmingLogRecord,
  DisposalReason,
  FarmingStage,
  InventoryBatchRecord,
} from "../../../types/inventory.types";
import { formatDate, formatDateTime } from "../../../utils/formatters";

interface BatchDetailModalProps {
  batchId: number;
  onClose: () => void;
  onUpdated?: () => void;
}

const STAGE_LABEL: Record<FarmingStage, string> = {
  sowing: "Gieo hạt",
  watering: "Tưới nước",
  fertilizing: "Bón phân hữu cơ",
  pest_control: "Phòng trừ sinh học",
  harvesting: "Thu hoạch",
  packaging: "Đóng gói",
};

const DISPOSAL_REASON_LABEL: Record<DisposalReason, string> = {
  damaged: "Dập nát lưu kho",
  rotten: "Hư hỏng tự nhiên",
  expired: "Quá hạn sử dụng",
  quality_failed: "Không đạt chất lượng",
  other: "Lý do khác",
};

export function BatchDetailModal({
  batchId,
  onClose,
  onUpdated,
}: BatchDetailModalProps) {
  const [batch, setBatch] = useState<InventoryBatchRecord | null>(null);
  const [logs, setLogs] = useState<BatchFarmingLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form thêm nhật ký canh tác
  const [stage, setStage] = useState<FarmingStage>("watering");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loggedAt, setLoggedAt] = useState("");
  const [expDate, setExpDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [savingLog, setSavingLog] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);

  const reloadDetail = async () => {
    const [bRes, tRes] = await Promise.all([
      inventoryService.getBatchById(batchId),
      inventoryService.getFarmingTimeline(batchId),
    ]);
    setBatch(bRes);
    setLogs(Array.isArray(tRes?.logs) ? tRes.logs : []);
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      inventoryService.getBatchById(batchId),
      inventoryService.getFarmingTimeline(batchId),
    ])
      .then(([bRes, tRes]) => {
        if (!cancelled) {
          setBatch(bRes);
          setLogs(Array.isArray(tRes?.logs) ? tRes.logs : []);
          setLoadError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(
            extractInventoryErrorMessage(
              err,
              "Không thể tải chi tiết lô hàng.",
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
  }, [batchId]);

  const handleAddLog = async (e: FormEvent) => {
    e.preventDefault();
    setLogError(null);

    if (title.trim().length < 2) {
      setLogError("Tiêu đề nhật ký tối thiểu 2 ký tự.");
      return;
    }

    if (loggedAt) {
      const chosen = new Date(loggedAt);
      if (Number.isNaN(chosen.getTime())) {
        setLogError("Thời gian thực hiện không hợp lệ.");
        return;
      }
      if (chosen.getTime() > Date.now() + 60 * 1000) {
        setLogError("Thời gian thực hiện không được lớn hơn hiện tại.");
        return;
      }
      const chosenDate = chosen.toISOString().split("T")[0];
      if (batch?.sowing_date && chosenDate < batch.sowing_date) {
        setLogError(
          `Ngày thực hiện (${chosenDate}) không được trước ngày gieo hạt (${batch.sowing_date}).`,
        );
        return;
      }
    }

    setSavingLog(true);
    try {
      await inventoryService.createFarmingLog(batchId, {
        stage,
        title: title.trim(),
        description: description.trim() || undefined,
        logged_at: loggedAt ? new Date(loggedAt).toISOString() : undefined,
        exp_date: stage === "harvesting" && expDate ? expDate : undefined,
        file,
      });
      setTitle("");
      setDescription("");
      setLoggedAt("");
      setExpDate("");
      setFile(null);
      await reloadDetail();
      onUpdated?.();
    } catch (err: unknown) {
      setLogError(
        extractInventoryErrorMessage(err, "Không thể ghi nhật ký canh tác."),
      );
    } finally {
      setSavingLog(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-farmly-soft shadow-xl max-w-3xl w-full overflow-hidden">
        <div className="px-6 py-4 bg-farmly-mint border-b border-farmly-soft flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-farmly-dark">
            <div className="w-8 h-8 rounded-xl bg-farmly-dark text-white flex items-center justify-center">
              <BookOpen size={16} />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Chi tiết Lô hàng &amp; Nhật ký vận hành
              </h3>
              <p className="text-xs text-slate-600">
                {batch
                  ? `${batch.batch_code} — ${batch.product?.name ?? ""}`
                  : `Lô #${batchId}`}
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
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 size={24} className="animate-spin text-farmly-dark" />
              <span>Đang tải dữ liệu lô hàng...</span>
            </div>
          ) : loadError || !batch ? (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {loadError || "Không tìm thấy lô hàng."}
            </div>
          ) : (
            <>
              {/* Thông số tổng quan lô */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#F7FBF7] border border-farmly-soft text-xs">
                <div>
                  <span className="text-slate-500 block">Tồn hiện tại</span>
                  <strong className="text-sm text-farmly-dot">
                    {batch.current_quantity} / {batch.initial_quantity}{" "}
                    {batch.product?.unit ?? "kg"}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Đã xuất hủy</span>
                  <strong className="text-sm text-red-600">
                    {batch.disposed_quantity} {batch.product?.unit ?? "kg"}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Thu hoạch</span>
                  <strong className="text-sm text-farmly-dark">
                    {formatDate(batch.harvest_date)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Hạn sử dụng</span>
                  <strong className="text-sm text-farmly-badge">
                    {formatDate(batch.exp_date)}
                  </strong>
                </div>
              </div>

              {batch.qr_code && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-farmly-mint/40 border border-farmly-soft text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-farmly-dark">
                    <QrCode size={15} className="text-farmly-dot" />
                    Mã truy xuất QR đã kích hoạt ({batch.qr_scan_count ?? 0}{" "}
                    lượt quét)
                  </span>
                  <a
                    href={`/trace/${batch.batch_code}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-farmly-dot hover:underline"
                  >
                    Mở trang QR <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {/* Lịch sử xuất hủy */}
              {batch.disposals && batch.disposals.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-sm font-bold text-farmly-badge flex items-center gap-1.5">
                    <Trash2 size={15} />
                    Lịch sử Xuất hủy hao hụt ({batch.disposals.length})
                  </h4>
                  <div className="space-y-2">
                    {batch.disposals.map((d) => (
                      <div
                        key={d.id}
                        className="p-3 rounded-xl border border-farmly-soft bg-farmly-cream/35 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <p className="font-bold text-farmly-badge">
                            -{d.quantity_disposed}{" "}
                            {batch.product?.unit ?? "kg"} &bull;{" "}
                            {DISPOSAL_REASON_LABEL[d.reason] ?? d.reason}
                          </p>
                          {d.note && (
                            <p className="text-slate-600 mt-0.5">{d.note}</p>
                          )}
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {formatDateTime(d.created_at)}
                          </p>
                        </div>
                        {d.image_url && (
                          <a
                            href={d.image_url}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-farmly-soft text-farmly-dark font-semibold hover:bg-farmly-mint"
                          >
                            Ảnh minh chứng <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form ghi nhật ký canh tác */}
              {!batch.qr_code && (
                <form
                  onSubmit={handleAddLog}
                  className="p-4 rounded-2xl bg-farmly-mint/45 border border-farmly-soft space-y-3"
                >
                  <h4 className="text-xs font-bold text-farmly-dark uppercase tracking-wider">
                    Ghi nhận nhật ký canh tác mới
                  </h4>

                  {logError && (
                    <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                      {logError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value as FarmingStage)}
                      className="px-3 py-2 rounded-xl bg-white border border-farmly-soft text-xs font-semibold text-farmly-dark"
                    >
                      {Object.entries(STAGE_LABEL).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={200}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Tiêu đề hoạt động..."
                      className="px-3 py-2 rounded-xl bg-white border border-farmly-soft text-xs"
                    />
                    <input
                      type="datetime-local"
                      value={loggedAt}
                      onChange={(e) => setLoggedAt(e.target.value)}
                      title="Thời gian thực hiện (để trống = hiện tại)"
                      className="px-3 py-2 rounded-xl bg-white border border-farmly-soft text-xs"
                    />
                  </div>

                  {stage === "harvesting" && batch.status === "growing" && (
                    <div>
                      <label className="block text-[11px] font-bold text-farmly-dark mb-1">
                        Hạn sử dụng sau thu hoạch (tùy chọn)
                      </label>
                      <input
                        type="date"
                        value={expDate}
                        onChange={(e) => setExpDate(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-farmly-soft text-xs"
                      />
                    </div>
                  )}

                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Chi tiết chăm sóc, liều lượng hoặc ghi chú thực tế..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-farmly-soft text-xs"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.mp4,.mov"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-white file:text-farmly-dark file:text-xs file:font-semibold"
                    />
                    <button
                      type="submit"
                      disabled={savingLog}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-farmly-dark text-white text-xs font-semibold hover:bg-farmly-dark-hover disabled:opacity-60"
                    >
                      {savingLog ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Plus size={13} />
                      )}
                      Ghi nhật ký
                    </button>
                  </div>
                </form>
              )}

              {/* Dòng thời gian nhật ký */}
              <div className="space-y-2.5">
                <h4 className="text-sm font-bold text-farmly-dark">
                  Dòng thời gian canh tác ({logs.length})
                </h4>
                {logs.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 rounded-xl border border-dashed border-farmly-soft text-center">
                    Chưa có nhật ký canh tác nào cho lô này.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {logs.map((l) => (
                      <div
                        key={l.id}
                        className="p-3 rounded-xl border border-farmly-soft bg-white text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-farmly-dark">
                            <span className="px-2 py-0.5 rounded bg-farmly-mint text-farmly-dark text-[10px] mr-2">
                              {STAGE_LABEL[l.stage] ?? l.stage}
                            </span>
                            {l.title}
                          </span>
                          <span className="text-slate-400 shrink-0">
                            {formatDateTime(l.logged_at)}
                          </span>
                        </div>
                        {l.description && (
                          <p className="text-slate-600">{l.description}</p>
                        )}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                          {l.staff?.full_name ? (
                            <span className="text-[11px] text-slate-400">
                              Thực hiện: {l.staff.full_name}
                            </span>
                          ) : (
                            <span />
                          )}
                          {l.evidence_image_url && (
                            <a
                              href={l.evidence_image_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-farmly-dot font-semibold hover:underline"
                            >
                              Xem minh chứng <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
