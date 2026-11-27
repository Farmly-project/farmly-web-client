import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Search, ShieldCheck, CheckCircle2 } from 'lucide-react';

const SAMPLE_TIMELINE = [
    {
        step: '01',
        stage: 'Gieo hạt',
        detail: 'Hạt giống rau ăn lá đạt chuẩn, gieo tại luống B2 – Khu nhà màng Củ Chi',
        date: '05/11/2026',
    },
    {
        step: '02',
        stage: 'Bón phân & Tưới nước',
        detail: 'Bón phân hữu cơ vi sinh định kỳ, tưới nhỏ giọt tự động theo độ ẩm đất',
        date: '14/11/2026',
    },
    {
        step: '03',
        stage: 'Thu hoạch & Đóng gói',
        detail: 'Thu hoạch lúc 05:00 sáng, kiểm tra chất lượng và dán tem QR định danh lô',
        date: '27/11/2026',
    },
];

export function HomeQrTracePreview() {
    const navigate = useNavigate();
    const [batchCode, setBatchCode] = useState('BATCH-20261127-RAU01');

    const handleTrace = (e: React.FormEvent) => {
        e.preventDefault();
        const cleaned = batchCode.trim();
        if (!cleaned) return;
        navigate(`/trace/${encodeURIComponent(cleaned)}`);
    };

    return (
        <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
            <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 sm:p-10 shadow-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Cột trái: Ô nhập mã lô & Dòng thời gian canh tác (UC04 & UC10) */}
                    <div className="lg:col-span-7 space-y-5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DDF2E2] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#1B4332]">
                            <QrCode className="h-3.5 w-3.5" />
                            Truy xuất nguồn gốc công khai (UC10)
                        </span>

                        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                            Từ hạt giống đến bàn ăn của bạn
                        </h2>

                        <p className="text-sm text-gray-600 leading-relaxed">
                            Mỗi lô nông sản sau thu hoạch được cấp một mã QR duy nhất. Quét
                            mã trên bao bì hoặc nhập mã lô bên dưới để xem toàn bộ nhật ký
                            canh tác của nông trại.
                        </p>

                        <form
                            onSubmit={handleTrace}
                            className="flex flex-col sm:flex-row gap-2.5"
                        >
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={batchCode}
                                    onChange={(e) => setBatchCode(e.target.value)}
                                    placeholder="Nhập mã lô (VD: BATCH-20261127-RAU01)"
                                    className="h-12 w-full rounded-xl border border-gray-200 bg-[#F4F6F9] pl-10 pr-3.5 text-sm font-semibold text-gray-900 focus:border-[#1E462D] focus:bg-white focus:outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                className="inline-flex h-12 shrink-0 items-center justify-center rounded-xl bg-[#1E462D] px-6 text-sm font-bold text-white hover:bg-[#163622] transition"
                            >
                                Tra cứu ngay
                            </button>
                        </form>

                        {/* Timeline minh họa nhật ký canh tác */}
                        <div className="space-y-3 pt-2">
                            {SAMPLE_TIMELINE.map((item) => (
                                <div
                                    key={item.step}
                                    className="flex items-start gap-3.5 rounded-2xl border border-gray-100 bg-[#F3F8F3]/60 p-3.5"
                                >
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1E462D] text-xs font-extrabold text-white">
                                        {item.step}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-extrabold text-gray-900">
                                                {item.stage}
                                            </p>
                                            <span className="text-[11px] font-semibold text-gray-400">
                                                {item.date}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-xs text-gray-600">
                                            {item.detail}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cột phải: Bảng thông tin lô chuẩn theo bảng batches */}
                    <div className="lg:col-span-5 rounded-2xl border border-emerald-900/10 bg-[#F3F8F3] p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-extrabold text-gray-900">
                                Thông tin lô hàng minh họa
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#DDF2E2] px-2.5 py-0.5 text-[11px] font-bold text-[#1B4332]">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Đang lưu hành
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-white p-3.5 border border-emerald-900/5">
                                <p className="text-[11px] text-gray-400">Nơi canh tác</p>
                                <p className="mt-1 text-xs sm:text-sm font-bold text-gray-900">
                                    Nông trại FARMLY – Củ Chi, TP.HCM
                                </p>
                            </div>
                            <div className="rounded-xl bg-white p-3.5 border border-emerald-900/5">
                                <p className="text-[11px] text-gray-400">Ngày thu hoạch</p>
                                <p className="mt-1 text-xs sm:text-sm font-bold text-gray-900">
                                    27/11/2026 (05:00)
                                </p>
                            </div>
                            <div className="rounded-xl bg-white p-3.5 border border-emerald-900/5">
                                <p className="text-[11px] text-gray-400">Hạn sử dụng lô</p>
                                <p className="mt-1 text-xs sm:text-sm font-bold text-[#1B4332]">
                                    02/12/2026
                                </p>
                            </div>
                            <div className="rounded-xl bg-white p-3.5 border border-emerald-900/5">
                                <p className="text-[11px] text-gray-400">Trạng thái nhật ký</p>
                                <p className="mt-1 text-xs sm:text-sm font-bold text-gray-900">
                                    Đã khóa sau khi cấp QR
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-white p-3.5 border border-emerald-900/10">
                            <div className="flex items-center gap-2.5">
                                <ShieldCheck className="h-5 w-5 text-[#1B4332] shrink-0" />
                                <div>
                                    <p className="text-xs font-extrabold text-gray-900">
                                        Chứng nhận VietGAP nông trại
                                    </p>
                                    <p className="text-[11px] text-gray-500">
                                        Hồ sơ kiểm định chất lượng nông sản
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-[#1B4332]">Hợp lệ</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}