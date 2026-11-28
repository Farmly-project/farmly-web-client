import { Download, ExternalLink, Printer, QrCode, X } from "lucide-react";
import type { GeneratedQrData } from "../../../types/inventory.types";

interface BatchQrModalProps {
  qrData: GeneratedQrData;
  productName?: string;
  onClose: () => void;
}

export function BatchQrModal({
  qrData,
  productName,
  onClose,
}: BatchQrModalProps) {
  const handlePrint = () => {
    if (!qrData.qr_image_base64) return;
    const printWin = window.open("", "_blank", "width=460,height=560");
    if (!printWin) return;
    printWin.document.write(`<!doctype html>
<html>
  <head>
    <title>Tem QR - ${qrData.batch_code}</title>
    <style>
      body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
      .card { border: 2px solid #1e4620; border-radius: 16px; padding: 24px; text-align: center; width: 320px; }
      .brand { font-weight: 800; color: #1e4620; font-size: 18px; letter-spacing: 1px; margin-bottom: 4px; }
      .prod { font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 12px; }
      img { width: 240px; height: 240px; display: block; margin: 0 auto 12px; }
      .code { font-family: monospace; font-size: 14px; font-weight: 700; color: #1e4620; }
      .hint { font-size: 11px; color: #64748b; margin-top: 6px; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="brand">FARMLY</div>
      <div class="prod">${productName ?? "Nông sản sạch truy xuất nguồn gốc"}</div>
      <img src="${qrData.qr_image_base64}" alt="QR ${qrData.batch_code}" />
      <div class="code">${qrData.batch_code}</div>
      <div class="hint">Quét mã QR để xem nhật ký canh tác</div>
    </div>
    <script>window.onload = function() { window.print(); };</script>
  </body>
</html>`);
    printWin.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-farmly-soft shadow-xl max-w-md w-full overflow-hidden">
        <div className="px-5 py-4 bg-farmly-mint border-b border-farmly-soft flex items-center justify-between">
          <div className="flex items-center gap-2 text-farmly-dark">
            <QrCode size={18} />
            <div>
              <h3 className="font-bold text-sm leading-tight">
                Tem QR Truy xuất Nguồn gốc
              </h3>
              <p className="text-[11px] font-mono text-slate-600">
                {qrData.batch_code}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-farmly-dark hover:bg-white/70 transition"
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center text-center space-y-4">
          {productName && (
            <p className="text-sm font-bold text-farmly-dark">{productName}</p>
          )}

          {qrData.qr_image_base64 ? (
            <div className="p-3 rounded-2xl border-2 border-farmly-soft bg-white shadow-xs">
              <img
                src={qrData.qr_image_base64}
                alt={`QR ${qrData.batch_code}`}
                className="w-56 h-56 object-contain"
              />
            </div>
          ) : (
            <div className="w-56 h-56 rounded-2xl border border-dashed border-farmly-soft flex items-center justify-center text-xs text-slate-500">
              Không có ảnh QR base64
            </div>
          )}

          <div className="w-full p-3 rounded-xl bg-[#F7FBF7] border border-farmly-soft text-xs text-left space-y-1">
            <span className="text-[11px] font-bold text-slate-500 block">
              Liên kết truy xuất công khai:
            </span>
            <p className="font-mono text-farmly-dark break-all">
              {qrData.qr_code}
            </p>
          </div>

          <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2">
            {qrData.qr_image_base64 && (
              <>
                <a
                  href={qrData.qr_image_base64}
                  download={`QR-${qrData.batch_code}.png`}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-farmly-soft text-farmly-dark text-xs font-semibold hover:bg-farmly-mint/50 transition"
                >
                  <Download size={14} />
                  Tải PNG
                </a>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-farmly-mint border border-farmly-soft text-farmly-dark text-xs font-semibold hover:bg-farmly-cream transition"
                >
                  <Printer size={14} />
                  In tem
                </button>
              </>
            )}
            <a
              href={`/trace/${encodeURIComponent(qrData.batch_code)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-farmly-dark text-white text-xs font-semibold hover:bg-farmly-dark-hover transition"
            >
              <ExternalLink size={14} />
              Mở trang QR
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
