import { Link } from 'react-router-dom';
import { ArrowRight, QrCode, ShieldCheck, Calendar } from 'lucide-react';

export function HomeHeroSection() {
    return (
        <section className="mx-auto max-w-6xl px-4 pt-5 sm:pt-8">
            <div className="overflow-hidden rounded-3xl border border-emerald-900/10 bg-linear-to-br from-[#E7F4EA] via-[#F3F8F3] to-white p-6 sm:p-10 shadow-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* Cột trái: Thông điệp Single Farm */}
                    <div className="lg:col-span-7 space-y-5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DDF2E2] px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#1B4332]">
                            100% Nông trại đơn nguồn • Không qua trung gian
                        </span>

                        <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-gray-900 leading-[1.15]">
                            Rau củ sạch thu hoạch trong ngày, minh bạch từng lô{' '}
                            <span className="text-[#1B4332]">qua mã QR</span>
                        </h1>

                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-xl">
                            Quản lý tồn kho chuẩn <strong>FEFO</strong> (Hết hạn trước – Xuất
                            trước). Xem trực tiếp ngày gieo trồng, nhật ký chăm sóc và chứng
                            nhận VietGAP của đúng lô nông sản bạn nhận.
                        </p>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                            <Link
                                to="/products"
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1E462D] px-6 text-sm font-bold text-white hover:bg-[#163622] transition"
                            >
                                <span>Khám phá nông sản hôm nay</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>

                            <Link
                                to="/trace/BATCH-20261127-RAU01"
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-emerald-900/20 bg-white px-5 text-sm font-bold text-[#1B4332] hover:bg-[#F3F8F3] transition"
                            >
                                <QrCode className="h-4 w-4" />
                                <span>Tra cứu mã lô QR</span>
                            </Link>
                        </div>

                        {/* 3 chỉ số vận hành sát thực tế nông trại */}
                        <div className="grid grid-cols-3 gap-3 border-t border-emerald-900/10 pt-5 max-w-lg">
                            <div>
                                <p className="text-base sm:text-lg font-extrabold text-[#1B4332]">
                                    05:00 AM
                                </p>
                                <p className="text-[11px] text-gray-500">Thu hoạch mỗi sáng</p>
                            </div>
                            <div>
                                <p className="text-base sm:text-lg font-extrabold text-[#1B4332]">
                                    100% FEFO
                                </p>
                                <p className="text-[11px] text-gray-500">
                                    Xuất kho theo hạn dùng
                                </p>
                            </div>
                            <div>
                                <p className="text-base sm:text-lg font-extrabold text-[#1B4332]">
                                    Nội thành
                                </p>
                                <p className="text-[11px] text-gray-500">
                                    Giao TP.HCM theo km
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Cột phải: Ảnh nông sản & Thẻ minh họa lô truy xuất */}
                    <div className="lg:col-span-5">
                        <div className="relative mx-auto max-w-md">
                            <div className="aspect-4/3 overflow-hidden rounded-3xl border-4 border-white bg-[#DDF2E2] shadow-md">
                                <img
                                    src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=900&q=80"
                                    alt="Rau củ hữu cơ thu hoạch tại nông trại FARMLY"
                                    className="h-full w-full object-cover"
                                />
                            </div>

                            {/* Thẻ nổi minh họa thông tin lô hàng (khớp bảng batches) */}
                            <div className="mt-3 sm:mt-0 sm:absolute sm:-bottom-5 sm:inset-x-4 rounded-2xl border border-emerald-900/10 bg-white/95 backdrop-blur-xs p-4 shadow-md">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="rounded-md bg-[#DDF2E2] px-2 py-0.5 text-[11px] font-extrabold text-[#1B4332]">
                                        LÔ #BATCH-20261127-RAU01
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        Chuẩn VietGAP
                                    </span>
                                </div>

                                <p className="mt-1.5 text-xs font-bold text-gray-900">
                                    Thu hoạch: Hôm nay 05:00 • Khu nhà màng B2 – Củ Chi
                                </p>

                                <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                                    <span className="inline-flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                        HSD: 02/12/2026
                                    </span>
                                    <Link
                                        to="/trace/BATCH-20261127-RAU01"
                                        className="font-bold text-[#1B4332] hover:underline"
                                    >
                                        Xem nhật ký lô →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}