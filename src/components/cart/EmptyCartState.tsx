import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export function EmptyCartState() {
    return (
        <div className="min-h-[75vh] bg-[#F3F8F3] px-4 py-10 flex items-center justify-center">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xs border border-emerald-900/10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#DDF2E2] text-[#1B4332]">
                    <ShoppingBag className="h-8 w-8" />
                </div>
                <h1 className="mt-5 text-xl font-extrabold text-gray-900">
                    Giỏ hàng của bạn đang trống
                </h1>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                    Khám phá các loại rau củ quả tươi thu hoạch trong ngày từ nông trại
                    Farmly và thêm vào giỏ nhé.
                </p>
                <Link
                    to="/products"
                    className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1E462D] px-6 text-sm font-bold text-white hover:bg-[#163622] transition"
                >
                    <span>Khám phá nông sản sạch</span>
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </div>
    );
}