import { Wallet, QrCode, Banknote, ShieldCheck } from 'lucide-react';
import type { PaymentMethod } from '../../types/order.types';

interface CheckoutPaymentCardProps {
    selectedMethod: PaymentMethod;
    onSelectMethod: (method: PaymentMethod) => void;
}

export function CheckoutPaymentCard({
    selectedMethod,
    onSelectMethod,
}: CheckoutPaymentCardProps) {
    return (
        <section className="rounded-3xl border border-emerald-900/10 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DDF2E2] text-[#1B4332]">
                    <Wallet className="h-4 w-4" />
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
                    3. Phương thức thanh toán
                </h2>
            </div>

            <div className="space-y-3">
                {/* Option 1: PayOS / VietQR */}
                <button
                    type="button"
                    onClick={() => onSelectMethod('payos')}
                    className={`flex w-full flex-wrap sm:flex-nowrap items-center justify-between gap-3 rounded-2xl border p-4 text-left transition ${selectedMethod === 'payos'
                        ? 'border-[#1E462D]/40 bg-[#DDF2E2]/55'
                        : 'border-transparent bg-[#EFF3FA] hover:bg-gray-200/60'
                        }`}
                >
                    <div className="flex items-start gap-3">
                        <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selectedMethod === 'payos' ? 'border-[#1E462D]' : 'border-gray-400 bg-white'
                                }`}
                        >
                            {selectedMethod === 'payos' && (
                                <span className="h-2.5 w-2.5 rounded-full bg-[#1E462D]" />
                            )}
                        </span>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs sm:text-sm font-extrabold text-gray-900">
                                    Thanh toán chuyển khoản QR (PayOS / VietQR)
                                </span>
                                <span className="rounded-full bg-[#BCEAD0] px-2.5 py-0.5 text-[11px] font-bold text-[#163622]">
                                    Khuyên dùng
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-600">
                                Quét mã VietQR qua mọi ứng dụng ngân hàng (Vietcombank, MB, Techcombank...), xác
                                nhận tự động tức thì không cần chụp bill.
                            </p>
                        </div>
                    </div>

                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-extrabold text-[#1B4332]">
                        <QrCode className="h-3.5 w-3.5" />
                        <span>VIETQR • PayOS</span>
                    </span>
                </button>

                {/* Option 2: COD */}
                <button
                    type="button"
                    onClick={() => onSelectMethod('cod')}
                    className={`flex w-full flex-wrap sm:flex-nowrap items-center justify-between gap-3 rounded-2xl border p-4 text-left transition ${selectedMethod === 'cod'
                        ? 'border-[#1E462D]/40 bg-[#DDF2E2]/55'
                        : 'border-transparent bg-[#EFF3FA] hover:bg-gray-200/60'
                        }`}
                >
                    <div className="flex items-start gap-3">
                        <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selectedMethod === 'cod' ? 'border-[#1E462D]' : 'border-gray-400 bg-white'
                                }`}
                        >
                            {selectedMethod === 'cod' && (
                                <span className="h-2.5 w-2.5 rounded-full bg-[#1E462D]" />
                            )}
                        </span>
                        <div>
                            <p className="text-xs sm:text-sm font-extrabold text-gray-900">
                                Thanh toán khi nhận hàng (COD)
                            </p>
                            <p className="mt-1 text-xs text-gray-600">
                                Thanh toán tiền mặt cho nhân viên giao hàng sau khi kiểm tra rau tươi và tem QR
                                truy xuất lô hàng.
                            </p>
                        </div>
                    </div>

                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-extrabold text-gray-700">
                        <Banknote className="h-3.5 w-3.5" />
                        <span>Tiền mặt</span>
                    </span>
                </button>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[#EFF3FA] px-3.5 py-2.5 text-[11px] text-gray-500">
                <span>Giao dịch thanh toán được bảo mật trực tiếp qua cổng PayOS</span>
                <ShieldCheck className="h-4 w-4 text-[#1B4332] shrink-0" />
            </div>
        </section>
    );
}