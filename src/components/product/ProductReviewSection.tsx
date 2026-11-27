import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { ProductReviewItem } from '../../types/product.types';

interface ProductReviewSectionProps {
    ratingSummary: {
        average: number;
        count: number;
    };
    reviews: ProductReviewItem[];
}

export function ProductReviewSection({
    ratingSummary,
    reviews,
}: ProductReviewSectionProps) {
    return (
        <section className="mt-12 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-gray-800 mb-1">
                        <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                            ))}
                        </div>
                        <span>{ratingSummary?.average?.toFixed(1) || '5.0'} / 5.0</span>
                        <span className="text-xs font-normal text-gray-500">
                            ({ratingSummary?.count || 0} đánh giá xác thực mua rau)
                        </span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-900">Cảm Nhận Từ Bếp Gia Đình</h2>
                </div>

                <Link
                    to="/orders"
                    className="inline-flex h-10 items-center rounded-full border border-emerald-200 bg-[#E8F5E9] px-4 text-xs font-bold text-[#1B5E20] hover:bg-emerald-100 transition"
                >
                    Đánh giá trải nghiệm
                </Link>
            </div>

            {reviews.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {reviews.map((rev) => (
                        <div
                            key={rev.id}
                            className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-2.5">
                                    <div className="flex text-amber-400">
                                        {[...Array(rev.rating)].map((_, i) => (
                                            <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    <span className="text-[11px] text-gray-400">{rev.created_at_relative}</span>
                                </div>
                                <p className="text-xs leading-relaxed text-gray-700 italic">"{rev.comment}"</p>
                            </div>

                            <div className="mt-4 flex items-center gap-2.5 pt-3 border-t border-gray-100">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9] text-xs font-bold text-[#1B5E20]">
                                    {rev.customer_initials || rev.customer_name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-gray-900">{rev.customer_name}</div>
                                    <div className="text-[11px] text-emerald-700">
                                        {rev.verified_purchase_note || 'Đã mua hàng tại Farmly'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                    Chưa có đánh giá nào cho sản phẩm này.
                </div>
            )}
        </section>
    );
}