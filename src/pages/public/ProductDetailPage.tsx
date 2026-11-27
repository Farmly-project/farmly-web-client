import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MapPin, CheckCircle2 } from 'lucide-react';
import type {
    ProductDetailData,
    ProductCardItem,
    FarmingLogItem,
    ProductReviewItem,
} from '../../types/product.types';
import {
    ProductCard,
    ProductGallery,
    FefoBatchCard,
    ProductPurchaseBox,
    FarmingLogTimeline,
    ProductReviewSection,
} from '../../components/product';
import { productService } from '../../services/productService';
import { ApiError } from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatters';

export function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [product, setProduct] = useState<ProductDetailData | null>(null);
    const [farmingLogs, setFarmingLogs] = useState<FarmingLogItem[]>([]);
    const [relatedProducts, setRelatedProducts] = useState<ProductCardItem[]>([]);
    const [reviews, setReviews] = useState<ProductReviewItem[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!id) return;
        let isMounted = true;

        async function fetchProductDetail() {
            setIsLoading(true);
            setErrorMsg(null);

            try {
                const detail = await productService.getProductById(id!);
                if (!isMounted) return;
                setProduct(detail);

                const [logsData, reviewsData, relatedData] = await Promise.all([
                    detail.fefo_batch?.id
                        ? productService.getBatchFarmingLogs(detail.fefo_batch.id).catch(() => [])
                        : Promise.resolve(detail.farming_logs || []),
                    productService.getProductReviews(detail.id).catch(() => detail.reviews || []),
                    detail.category?.id
                        ? productService
                            .getRelatedProducts(detail.category.id, 4)
                            .catch(() => detail.related_products || [])
                        : Promise.resolve(detail.related_products || []),
                ]);

                if (!isMounted) return;
                setFarmingLogs(Array.isArray(logsData) ? logsData : []);
                setReviews(Array.isArray(reviewsData) ? reviewsData : []);

                const rawRelated = Array.isArray(relatedData)
                    ? relatedData
                    : (relatedData as unknown as { items?: ProductCardItem[] })?.items || [];
                setRelatedProducts(rawRelated.filter((item) => item.id !== detail.id).slice(0, 4));
            } catch (err) {
                if (!isMounted) return;
                setErrorMsg(
                    err instanceof ApiError && err.status === 404
                        ? 'Sản phẩm không còn kinh doanh hoặc không tồn tại.'
                        : 'Không thể tải thông tin sản phẩm. Vui lòng thử lại.'
                );
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        fetchProductDetail();
        return () => {
            isMounted = false;
        };
    }, [id]);

    const handleAddToCart = async (targetProductId: number, qty = 1, redirectCheckout = false) => {
        setIsSubmitting(true);
        try {
            await productService.addToCart(targetProductId, qty);
            if (redirectCheckout) {
                navigate('/cart');
            } else {
                alert('Đã thêm nông sản vào giỏ hàng!');
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Thêm vào giỏ hàng thất bại');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubscribe = async (quantity: number, weekdays: string[]) => {
        if (!product) return;
        setIsSubmitting(true);
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            await productService.createSubscription({
                product_id: product.id,
                quantity_per_delivery: quantity,
                delivery_weekdays: weekdays,
                start_date: tomorrow.toISOString().split('T')[0],
            });
            navigate('/subscriptions');
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                navigate('/login', { state: { from: `/products/${id}` } });
                return;
            }
            alert(err instanceof Error ? err.message : 'Đăng ký gói thất bại');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-10 animate-pulse">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    <div className="lg:col-span-6 aspect-[4/3] rounded-2xl bg-gray-200" />
                    <div className="lg:col-span-6 space-y-4">
                        <div className="h-8 w-2/3 rounded bg-gray-200" />
                        <div className="h-44 rounded-2xl bg-gray-200" />
                        <div className="h-36 rounded-2xl bg-gray-200" />
                    </div>
                </div>
            </div>
        );
    }

    if (errorMsg || !product) {
        return (
            <div className="mx-auto max-w-xl px-4 py-20 text-center space-y-4">
                <h2 className="text-xl font-bold text-gray-800">{errorMsg || 'Không tìm thấy sản phẩm'}</h2>
                <Link
                    to="/products"
                    className="inline-flex h-11 items-center rounded-xl bg-[#1B5E20] px-6 text-sm font-bold text-white"
                >
                    Quay lại danh sách sản phẩm
                </Link>
            </div>
        );
    }

    // Đồng bộ trường tồn kho từ DB thực tế (available_quantity) hoặc available_stock
    const availableStock = Number(product.available_quantity ?? product.available_stock ?? 0);
    const isOutOfStock = availableStock <= 0;

    // Đồng bộ giá Flash Sale từ lô FEFO hoặc trường phẳng trên product
    const flashPrice =
        product.fefo_batch?.flash_sale_price ??
        (product.has_flash_sale ? product.flash_sale_price : null);
    const activePrice = flashPrice !== null && flashPrice < product.base_price ? flashPrice : product.base_price;

    const discountPercent =
        activePrice < product.base_price
            ? Math.round(((product.base_price - activePrice) / product.base_price) * 100)
            : 0;

    // Chuẩn hóa danh sách ảnh cho ProductGallery (hỗ trợ cả mảng images và primary_image)
    const galleryImages =
        Array.isArray(product.images) && product.images.length > 0
            ? product.images
            : product.primary_image
                ? [
                    {
                        id: 1,
                        image_url: product.primary_image,
                        caption: 'Ảnh sản phẩm',
                        is_primary: true,
                        display_order: 1,
                    },
                ]
                : [];

    // Chuẩn hóa chứng nhận thành mảng chuỗi tên chứng nhận
    const certificationsList: string[] = Array.isArray(product.certifications)
        ? product.certifications.map((c) => (typeof c === 'string' ? c : c.cert_name))
        : [];

    // Nếu Backend chưa trả object fefo_batch đầy đủ nhưng có nearest_exp_date thì tự dựng lô tóm tắt
    const resolvedFefoBatch =
        product.fefo_batch ??
        (product.nearest_exp_date
            ? {
                id: 0,
                batch_code: `LOT-${product.id}-${product.nearest_exp_date.replace(/-/g, '')}`,
                harvest_date: product.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                exp_date: product.nearest_exp_date,
                days_until_expiry: Math.max(
                    0,
                    Math.ceil(
                        (new Date(product.nearest_exp_date).getTime() - new Date().setHours(0, 0, 0, 0)) /
                        (1000 * 60 * 60 * 24)
                    )
                ),
                current_quantity: availableStock,
                qr_code: `LOT-${product.id}`,
                flash_sale_price: flashPrice ?? null,
                flash_sale_ends_at: null,
            }
            : null);

    return (
        <div className="min-h-screen bg-[#F8FAF8] text-gray-900 pb-24 md:pb-12">
            <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    <div className="lg:col-span-6">
                        <ProductGallery
                            images={galleryImages}
                            productName={product.name}
                            certifications={certificationsList}
                        />
                    </div>

                    <div className="lg:col-span-6 space-y-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded-md bg-[#E8F5E9] px-2.5 py-1 font-bold uppercase tracking-wide text-[#1B5E20]">
                                Thu hoạch sáng nay
                            </span>
                            <span className="inline-flex items-center gap-1 text-gray-600 font-medium">
                                <MapPin className="h-3.5 w-3.5 text-[#1B5E20]" />
                                {product.farm_location || 'Nông trại Farmly, Lâm Đồng'}
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                            {product.name}
                        </h1>

                        {product.short_description && (
                            <p className="text-sm text-gray-600">{product.short_description}</p>
                        )}

                        <div className="flex flex-wrap items-baseline gap-2.5">
                            <span className="text-3xl font-extrabold text-[#1B5E20]">
                                {formatCurrency(activePrice)}
                            </span>
                            <span className="text-sm text-gray-500">/ {product.unit}</span>
                            {discountPercent > 0 && (
                                <>
                                    <span className="text-sm text-gray-400 line-through">
                                        {formatCurrency(product.base_price)}
                                    </span>
                                    <span className="rounded-full bg-[#E8F5E9] px-2.5 py-0.5 text-xs font-bold text-[#1B5E20]">
                                        Tiết kiệm {discountPercent}%
                                    </span>
                                </>
                            )}
                        </div>

                        <FefoBatchCard
                            batch={resolvedFefoBatch}
                            availableStock={availableStock}
                            unit={product.unit}
                        />

                        <ProductPurchaseBox
                            productId={product.id}
                            unit={product.unit}
                            activePrice={activePrice}
                            availableStock={availableStock}
                            allowSubscription={Boolean(product.category?.allow_subscription)}
                            isOutOfStock={isOutOfStock}
                            isSubmitting={isSubmitting}
                            onAddToCart={handleAddToCart}
                            onSubscribe={handleSubscribe}
                        />

                        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-[#F1F8E9] p-3 text-xs text-gray-700">
                            <CheckCircle2 className="h-4 w-4 text-[#1B5E20] shrink-0 mt-0.5" />
                            <p>
                                <strong>Cam kết Farmly 100%:</strong> Bạn nhận được nếu rau bị hư hoặc dập do vận
                                chuyển, phản hồi hình ảnh lại trong <strong>24 giờ</strong> để được hoàn 100% tiền
                                hoặc bù ngay kỳ mới.
                            </p>
                        </div>
                    </div>
                </div>

                <FarmingLogTimeline
                    batchCode={resolvedFefoBatch?.batch_code}
                    description={product.description || product.short_description || ''}
                    logs={farmingLogs}
                />

                {relatedProducts.length > 0 && (
                    <section className="mt-12 space-y-4">
                        <h2 className="text-2xl font-extrabold text-gray-900">Sản phẩm tương tự</h2>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {relatedProducts.map((item) => (
                                <ProductCard
                                    key={item.id}
                                    product={item}
                                    onAddToCart={(prodId: number) => handleAddToCart(prodId, 1, false)}
                                />
                            ))}
                        </div>
                    </section>
                )}

                <ProductReviewSection
                    ratingSummary={product.rating_summary ?? { average: 5.0, count: reviews.length }}
                    reviews={reviews}
                />
            </div>
        </div>
    );
}