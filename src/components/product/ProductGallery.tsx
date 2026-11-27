import { useState } from 'react';
import { ShieldCheck, Leaf, FlaskConical, Truck } from 'lucide-react';
import type { ProductImageItem } from '../../types/product.types';

interface ProductGalleryProps {
    images: ProductImageItem[];
    productName: string;
    certifications: string[];
}

export function ProductGallery({
    images,
    productName,
    certifications,
}: ProductGalleryProps) {
    const [selectedIdx, setSelectedIdx] = useState(0);

    return (
        <div className="space-y-3">
            {/* Ảnh chính */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <img
                    src={images?.[selectedIdx]?.image_url || '/images/placeholder-veg.webp'}
                    alt={productName}
                    className="h-full w-full object-cover"
                />
                {certifications?.length > 0 && (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#1B5E20] shadow-sm">
                        <ShieldCheck className="h-4 w-4 text-[#1B5E20]" />
                        {certifications[0]}
                    </span>
                )}
            </div>

            {/* Thumbnail ảnh phụ */}
            {images?.length > 0 && (
                <div className="grid grid-cols-4 gap-2.5">
                    {images.map((img, index) => (
                        <button
                            key={img.id}
                            type="button"
                            onClick={() => setSelectedIdx(index)}
                            className={`group overflow-hidden rounded-xl border text-left transition ${selectedIdx === index
                                    ? 'border-[#1B5E20] ring-2 ring-[#1B5E20]/20 bg-[#1B5E20] text-white'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-400'
                                }`}
                        >
                            <div className="aspect-[16/10] w-full overflow-hidden">
                                <img
                                    src={img.image_url}
                                    alt={img.caption || productName}
                                    className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                                />
                            </div>
                            <div className="truncate px-2 py-1 text-center text-[11px] font-medium">
                                {img.caption || `Ảnh ${index + 1}`}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* 3 Thẻ cam kết chất lượng */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-100 bg-[#F1F8E9] p-3 text-center">
                    <Leaf className="h-5 w-5 text-[#1B5E20] mb-1" />
                    <span className="text-xs font-bold text-gray-800">100% Đất Đỏ Bazan</span>
                    <span className="text-[11px] text-gray-500">Giàu khoáng chất tự nhiên</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-100 bg-[#F1F8E9] p-3 text-center">
                    <FlaskConical className="h-5 w-5 text-[#1B5E20] mb-1" />
                    <span className="text-xs font-bold text-gray-800">Không Chất Bảo Quản</span>
                    <span className="text-[11px] text-gray-500">Không ngâm hóa chất làm tươi</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-100 bg-[#F1F8E9] p-3 text-center">
                    <Truck className="h-5 w-5 text-[#1B5E20] mb-1" />
                    <span className="text-xs font-bold text-gray-800">Vận Chuyển 4 Giờ</span>
                    <span className="text-[11px] text-gray-500">Từ nông trại đến bếp nhà bạn</span>
                </div>
            </div>
        </div>
    );
}