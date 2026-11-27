import { Sparkles } from 'lucide-react';

interface SubscriptionHeroHeaderProps {
    activeTab: 'builder' | 'my-list';
    mySubscriptionCount: number;
    onSelectBuilder: () => void;
    onSelectMyList: () => void;
}

export function SubscriptionHeroHeader({
    activeTab,
    mySubscriptionCount,
    onSelectBuilder,
    onSelectMyList,
}: SubscriptionHeroHeaderProps) {
    return (
        <section className="bg-[#1E462D] text-white">
            <div className="mx-auto max-w-6xl px-4 py-8 sm:py-11">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="max-w-2xl space-y-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#DDF2E2]">
                            <Sparkles className="h-3.5 w-3.5" />
                            Gói rau định kỳ Single Farm • Chốt giá cả tháng
                        </span>
                        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                            Đặt Một Lần – Nhận Rau Tươi Mỗi Tuần
                        </h1>
                        <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                            Tự chọn nông sản yêu thích và cố định thứ giao trong tuần. Hệ thống tự
                            động tạo đơn lúc 00:00 trước ngày giao, xuất lô mới nhất theo chuẩn
                            FEFO và hỗ trợ bỏ qua kỳ giao linh hoạt trước 20:00.
                        </p>
                    </div>

                    <div className="inline-flex rounded-2xl bg-black/25 p-1.5">
                        <button
                            type="button"
                            onClick={onSelectBuilder}
                            className={`min-h-11 rounded-xl px-4 text-xs sm:text-sm font-bold transition ${activeTab === 'builder'
                                ? 'bg-[#DDF2E2] text-[#1B4332]'
                                : 'text-emerald-100 hover:text-white'
                                }`}
                        >
                            + Đăng ký gói mới
                        </button>

                        <button
                            type="button"
                            onClick={onSelectMyList}
                            className={`min-h-11 rounded-xl px-4 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${activeTab === 'my-list'
                                ? 'bg-[#DDF2E2] text-[#1B4332]'
                                : 'text-emerald-100 hover:text-white'
                                }`}
                        >
                            <span>Gói của tôi</span>
                            {mySubscriptionCount > 0 && (
                                <span className="rounded-full bg-[#1E462D] px-2 py-0.5 text-[11px] text-white">
                                    {mySubscriptionCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}