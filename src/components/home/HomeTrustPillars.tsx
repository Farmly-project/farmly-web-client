import { QrCode, Layers, Truck } from 'lucide-react';

const PILLARS = [
    {
        icon: QrCode,
        title: 'Truy xuất QR từng lô',
        description:
            'Quét mã QR trên bao bì để xem ngày gieo hạt, bón phân, thu hoạch và file scan chứng nhận VietGAP/GlobalGAP.',
    },
    {
        icon: Layers,
        title: 'Tươi chuẩn FEFO',
        description:
            'Hệ thống tự động ưu tiên xuất kho lô thu hoạch sớm nhất còn hạn sử dụng, nói không với rau củ tồn cũ.',
    },
    {
        icon: Truck,
        title: 'Giao nội thành TP.HCM',
        description:
            'Vận chuyển trực tiếp từ nông trại, phí giao hàng minh bạch theo bậc km và hỗ trợ đổi trả/hoàn tiền trong 24h.',
    },
];

export function HomeTrustPillars() {
    return (
        <section className="mx-auto max-w-6xl px-4 pt-10 sm:pt-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PILLARS.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div
                            key={item.title}
                            className="rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-2xs"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF2E2] text-[#1B4332]">
                                <Icon className="h-5 w-5" />
                            </div>
                            <h2 className="mt-3.5 text-base font-extrabold text-gray-900">
                                {item.title}
                            </h2>
                            <p className="mt-1.5 text-xs sm:text-sm text-gray-500 leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}