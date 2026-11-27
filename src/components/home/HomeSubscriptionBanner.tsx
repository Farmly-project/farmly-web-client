import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, CalendarDays } from 'lucide-react';

export function HomeSubscriptionBanner() {
    return (
        <section className="mx-auto max-w-6xl px-4 pt-10 sm:pt-12">
            <div className="rounded-3xl bg-[#1E462D] p-6 sm:p-10 text-white shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-7 space-y-4">
                        <span className="inline-block rounded-full bg-white/15 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#DDF2E2]">
                            Gói mua định kỳ theo tuần (UC02)
                        </span>

                        <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                            Đặt một lần – Nhận rau tươi định kỳ mỗi tuần
                        </h2>

                        <p className="text-sm text-emerald-100/90 leading-relaxed">
                            Tự chọn các loại nông sản yêu thích và cố định thứ giao trong tuần
                            (ví dụ: Thứ 3 & Thứ 6). Hệ thống tự động tạo đơn trước ngày giao,
                            chốt giá tại thời điểm đăng ký và xuất kho chuẩn FEFO.
                        </p>

                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs sm:text-sm text-emerald-50">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#DDF2E2] shrink-0" />
                                <span>Chốt giá cố định suốt chu kỳ gói</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#DDF2E2] shrink-0" />
                                <span>Tự động lên đơn lúc 00:00 hôm trước</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#DDF2E2] shrink-0" />
                                <span>Bỏ qua kỳ giao dễ dàng trước 20:00</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#DDF2E2] shrink-0" />
                                <span>Tạm dừng hoặc hủy gói linh hoạt</span>
                            </li>
                        </ul>

                        <div className="pt-2">
                            <Link
                                to="/subscriptions"
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#DDF2E2] px-6 text-sm font-extrabold text-[#1B4332] hover:bg-white transition"
                            >
                                <span>Đăng ký gói định kỳ</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Thẻ minh họa lịch giao mẫu (khớp bảng subscriptions & delivery_schedules) */}
                    <div className="lg:col-span-5">
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-xs space-y-3.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#DDF2E2]">
                                    Ví dụ lịch giao định kỳ 1 tháng
                                </span>
                                <CalendarDays className="h-5 w-5 text-[#DDF2E2]" />
                            </div>

                            <div className="space-y-2 text-xs text-emerald-50">
                                <div className="flex justify-between rounded-xl bg-black/20 px-3.5 py-2.5">
                                    <span>Lịch giao cố định:</span>
                                    <strong className="text-white">Thứ 3 & Thứ 6 hàng tuần</strong>
                                </div>
                                <div className="flex justify-between rounded-xl bg-black/20 px-3.5 py-2.5">
                                    <span>Tổng số kỳ giao:</span>
                                    <strong className="text-white">8 lần giao / tháng</strong>
                                </div>
                                <div className="flex justify-between rounded-xl bg-black/20 px-3.5 py-2.5">
                                    <span>Trạng thái thu hộ:</span>
                                    <strong className="text-[#DDF2E2]">0đ khi nhận (Đã trả trước)</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}