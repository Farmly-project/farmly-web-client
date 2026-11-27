import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    QrCode,
    ShieldCheck,
    Calendar,
    Clock,
    Sprout,
    MapPin,
    Search,
    ExternalLink,
    ShoppingBag,
    AlertCircle,
    CheckCircle2,
    Eye,
    FileCheck2,
    ArrowLeft,
} from 'lucide-react';
import { batchService } from '../../services/batchService';
import { ApiError } from '../../services/apiClient';
import { formatDate } from '../../utils/formatters';
import type {
    BatchTraceData,
    TraceFarmingLogItem,
    TraceCertificationItem,
} from '../../types/batch.types';

const STAGE_META: Record<string, { label: string; defaultTitle: string }> = {
    sowing: { label: 'GIEO HẠT', defaultTitle: 'Xuống giống & Ươm mầm' },
    fertilizing: { label: 'BÓN PHÂN', defaultTitle: 'Bón phân hữu cơ vi sinh' },
    watering: { label: 'TƯỚI NƯỚC', defaultTitle: 'Tưới tiêu & Chăm sóc' },
    pesticide: { label: 'BẢO VỆ THỰC VẬT', defaultTitle: 'Kiểm soát sâu bệnh sinh học' },
    harvesting: { label: 'THU HOẠCH', defaultTitle: 'Thu hoạch & Đóng gói lô' },
};

const BATCH_STATUS_BADGE: Record<string, { label: string; className: string }> = {
    in_stock: {
        label: 'Đang lưu hành • Còn hàng',
        className: 'bg-[#DDF2E2] text-[#1B4332]',
    },
    sold_out: {
        label: 'Đã xuất hết lô',
        className: 'bg-gray-100 text-gray-700',
    },
    growing: {
        label: 'Đang canh tác tại vườn',
        className: 'bg-sky-100 text-sky-800',
    },
    expired: {
        label: 'Đã hết hạn lưu hành',
        className: 'bg-red-100 text-red-700',
    },
};

function normalizeTraceResponse(raw: unknown, fallbackCode: string): BatchTraceData {
    const root =
        (raw as { data?: Record<string, unknown> })?.data ??
        (raw as Record<string, unknown>);

    const rawBatch = (root.batch as Record<string, unknown>) ?? root;
    const rawProduct = (root.product as Record<string, unknown>) ?? {};

    const logsSource = (root.farming_logs ??
        root.logs ??
        rawBatch.farming_logs ??
        []) as Array<Record<string, unknown>>;

    const certsSource = (root.certifications ??
        root.quality_certifications ??
        rawProduct.certifications ??
        []) as Array<Record<string, unknown>>;

    return {
        batch: {
            id: Number(rawBatch.id ?? 0),
            batch_code: String(rawBatch.batch_code ?? fallbackCode),
            sowing_date: (rawBatch.sowing_date as string) ?? null,
            harvest_date: (rawBatch.harvest_date as string) ?? null,
            exp_date: (rawBatch.exp_date as string) ?? null,
            initial_quantity:
                rawBatch.initial_quantity != null ? Number(rawBatch.initial_quantity) : undefined,
            current_quantity:
                rawBatch.current_quantity != null ? Number(rawBatch.current_quantity) : undefined,
            status: (String(rawBatch.status ?? 'in_stock') as BatchTraceData['batch']['status']),
            qr_code: (rawBatch.qr_code as string) ?? null,
            qr_scan_count:
                rawBatch.qr_scan_count != null ? Number(rawBatch.qr_scan_count) : undefined,
            grow_zone: (rawBatch.grow_zone as string) ?? 'Khu nhà màng Củ Chi',
        },
        product: {
            id: Number(rawProduct.id ?? rawBatch.product_id ?? 0),
            name: String(rawProduct.name ?? rawBatch.product_name ?? 'Nông sản sạch Farmly'),
            slug: rawProduct.slug as string | undefined,
            unit: String(rawProduct.unit ?? rawBatch.unit ?? 'túi'),
            base_price:
                rawProduct.base_price != null ? Number(rawProduct.base_price) : undefined,
            description:
                (rawProduct.description as string) ??
                'Nông sản được canh tác, thu hoạch và quản lý tồn kho theo từng lô chuẩn FEFO tại nông trại FARMLY.',
            primary_image_url:
                (rawProduct.primary_image_url as string) ??
                (rawProduct.primary_image as string) ??
                (rawProduct.image_url as string) ??
                null,
            category_name:
                (rawProduct.category_name as string) ??
                ((rawProduct.category as { name?: string })?.name ?? 'Nông sản hữu cơ'),
        },
        certifications: certsSource.map(
            (c, idx): TraceCertificationItem => ({
                id: Number(c.id ?? idx + 1),
                cert_name: String(c.cert_name ?? c.name ?? 'VietGAP'),
                cert_code: (c.cert_code as string) ?? null,
                issued_by: (c.issued_by as string) ?? 'Tổ chức chứng nhận nông nghiệp Việt Nam',
                issued_date: (c.issued_date as string) ?? null,
                expiry_date: (c.expiry_date as string) ?? null,
                document_url: (c.document_url as string) ?? null,
            })
        ),
        farming_logs: logsSource.map(
            (l, idx): TraceFarmingLogItem => {
                const stageKey = String(l.stage ?? 'sowing').toLowerCase();
                const meta = STAGE_META[stageKey] ?? {
                    label: `GIAI ĐOẠN ${idx + 1}`,
                    defaultTitle: 'Hoạt động canh tác',
                };
                return {
                    id: Number(l.id ?? idx + 1),
                    stage: stageKey,
                    stage_label: (l.stage_label as string) ?? meta.label,
                    title: (l.title as string) ?? meta.defaultTitle,
                    description: String(l.description ?? ''),
                    evidence_image_url: (l.evidence_image_url as string) ?? null,
                    logged_at: String(l.logged_at ?? l.created_at ?? ''),
                    performer_name: (l.performer_name as string) ?? 'Kỹ thuật viên Farmly',
                };
            }
        ),
        farm_info: {
            name: 'Nông trại FARMLY – Single Farm',
            address: 'Xã Nhuận Đức, Huyện Củ Chi, TP. Hồ Chí Minh',
        },
    };
}

export function TraceabilityPage() {
    const { batchCode } = useParams<{ batchCode: string }>();
    const navigate = useNavigate();

    const [searchCode, setSearchCode] = useState(batchCode || '');
    const [traceData, setTraceData] = useState<BatchTraceData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(Boolean(batchCode));
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        setSearchCode(batchCode || '');
        if (!batchCode) {
            setIsLoading(false);
            setTraceData(null);
            return;
        }

        let isMounted = true;
        setIsLoading(true);
        setErrorMessage(null);

        batchService
            .getBatchTrace(batchCode)
            .then((res) => {
                if (!isMounted) return;
                setTraceData(normalizeTraceResponse(res, batchCode));
            })
            .catch((err) => {
                if (!isMounted) return;
                setTraceData(null);
                setErrorMessage(
                    err instanceof ApiError
                        ? err.message
                        : `Không tìm thấy hồ sơ truy xuất cho mã lô "${batchCode}".`
                );
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [batchCode]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleaned = searchCode.trim();
        if (!cleaned) return;
        navigate(`/trace/${encodeURIComponent(cleaned)}`);
    };

    const statusBadge = traceData
        ? BATCH_STATUS_BADGE[traceData.batch.status] ?? BATCH_STATUS_BADGE.in_stock
        : null;

    return (
        <div className="min-h-[85vh] bg-[#F3F8F3] pb-16 text-gray-900">
            {/* Thanh banner & tra cứu nhanh mã lô QR */}
            <section className="bg-[#1E462D] text-white">
                <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Link
                            to="/products"
                            className="inline-flex min-h-[44px] items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-100 hover:text-white transition"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Danh sách nông sản</span>
                        </Link>

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                            <QrCode className="h-3.5 w-3.5" />
                            Hệ thống truy xuất minh bạch Single Farm
                        </span>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
                        <div className="lg:col-span-7 space-y-2">
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                Hồ Sơ Truy Xuất Nguồn Gốc Lô Hàng
                            </h1>
                            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                                Dữ liệu nhật ký canh tác được khóa cố định sau khi thu hoạch và cấp tem
                                QR, đảm bảo tính minh bạch từ nông trại đến bàn ăn.
                            </p>
                        </div>

                        <form
                            onSubmit={handleSearchSubmit}
                            className="lg:col-span-5 flex items-center gap-2"
                        >
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchCode}
                                    onChange={(e) => setSearchCode(e.target.value)}
                                    placeholder="Nhập mã lô (VD: LOT-7-20261129)"
                                    className="h-11 w-full rounded-xl bg-white pl-10 pr-3 text-xs sm:text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DDF2E2]"
                                />
                            </div>
                            <button
                                type="submit"
                                className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-[#DDF2E2] px-4 text-xs sm:text-sm font-extrabold text-[#1B4332] hover:bg-white transition"
                            >
                                Tra cứu
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-5xl px-4 pt-6 sm:pt-8">
                {/* Trạng thái đang tải */}
                {isLoading && (
                    <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 sm:p-8 space-y-6 animate-pulse">
                        <div className="h-6 w-1/3 rounded bg-gray-200" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="h-44 rounded-2xl bg-gray-200" />
                            <div className="md:col-span-2 space-y-3">
                                <div className="h-7 w-2/3 rounded bg-gray-200" />
                                <div className="h-24 rounded-2xl bg-gray-200" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Trạng thái không tìm thấy mã lô */}
                {!isLoading && errorMessage && (
                    <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xs">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                            <AlertCircle className="h-7 w-7" />
                        </div>
                        <h2 className="mt-4 text-lg sm:text-xl font-extrabold text-gray-900">
                            Không tìm thấy thông tin lô hàng
                        </h2>
                        <p className="mt-1.5 text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
                            {errorMessage} Vui lòng kiểm tra lại mã lô in trên tem QR bao bì.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <Link
                                to="/products"
                                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1E462D] px-5 text-xs sm:text-sm font-bold text-white hover:bg-[#163622] transition"
                            >
                                Khám phá sản phẩm Farmly
                            </Link>
                        </div>
                    </div>
                )}

                {/* Nội dung hồ sơ lô hàng */}
                {!isLoading && traceData && (
                    <div className="space-y-6">
                        {/* KHỐI 1: THÔNG TIN SẢN PHẨM & LÔ THU HOẠCH */}
                        <div className="overflow-hidden rounded-3xl border border-emerald-900/10 bg-white p-5 sm:p-8 shadow-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <span className="rounded-lg bg-[#F3F8F3] px-3 py-1 font-mono text-xs sm:text-sm font-extrabold text-[#1B4332] border border-emerald-900/10">
                                        #{traceData.batch.batch_code}
                                    </span>
                                    {statusBadge && (
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${statusBadge.className}`}
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            {statusBadge.label}
                                        </span>
                                    )}
                                </div>

                                {typeof traceData.batch.qr_scan_count === 'number' && (
                                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                                        <Eye className="h-3.5 w-3.5 text-[#1B4332]" />
                                        Đã xác thực {traceData.batch.qr_scan_count} lượt quét QR
                                    </span>
                                )}
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-12 items-start">
                                {/* Ảnh đại diện sản phẩm */}
                                <div className="md:col-span-4">
                                    <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-gray-100 bg-[#F8FAF8]">
                                        {traceData.product.primary_image_url ? (
                                            <img
                                                src={traceData.product.primary_image_url}
                                                alt={traceData.product.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full flex-col items-center justify-center text-[#1B4332]/50">
                                                <Sprout className="h-12 w-12" />
                                                <span className="mt-1 text-xs font-semibold">
                                                    Nông sản sạch FARMLY
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Thông tin chi tiết lô hàng */}
                                <div className="md:col-span-8 space-y-4">
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-[#1B4332]">
                                            {traceData.product.category_name}
                                        </span>
                                        <h2 className="mt-0.5 text-2xl font-extrabold text-gray-900">
                                            {traceData.product.name}
                                        </h2>
                                        <p className="mt-1 text-xs sm:text-sm text-gray-600 leading-relaxed">
                                            {traceData.product.description}
                                        </p>
                                    </div>

                                    {/* Lưới 4 thông số lô từ bảng batches */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                        <div className="rounded-2xl bg-[#F8FAF8] border border-gray-100 p-3">
                                            <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                                <Sprout className="h-3.5 w-3.5 text-[#1B4332]" />
                                                Ngày gieo hạt
                                            </div>
                                            <div className="mt-1 text-xs sm:text-sm font-extrabold text-gray-900">
                                                {traceData.batch.sowing_date
                                                    ? formatDate(traceData.batch.sowing_date)
                                                    : 'Theo mùa vụ'}
                                            </div>
                                        </div>

                                        <div className="rounded-2xl bg-[#F8FAF8] border border-gray-100 p-3">
                                            <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                                <Calendar className="h-3.5 w-3.5 text-[#1B4332]" />
                                                Ngày thu hoạch
                                            </div>
                                            <div className="mt-1 text-xs sm:text-sm font-extrabold text-gray-900">
                                                {traceData.batch.harvest_date
                                                    ? formatDate(traceData.batch.harvest_date)
                                                    : 'Chưa thu hoạch'}
                                            </div>
                                        </div>

                                        <div className="rounded-2xl bg-amber-50/70 border border-amber-200/70 p-3">
                                            <div className="flex items-center gap-1 text-[11px] text-amber-800">
                                                <Clock className="h-3.5 w-3.5 text-amber-600" />
                                                Hạn sử dụng
                                            </div>
                                            <div className="mt-1 text-xs sm:text-sm font-extrabold text-gray-900">
                                                {traceData.batch.exp_date
                                                    ? formatDate(traceData.batch.exp_date)
                                                    : '—'}
                                            </div>
                                        </div>

                                        <div className="rounded-2xl bg-[#F8FAF8] border border-gray-100 p-3">
                                            <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                                <MapPin className="h-3.5 w-3.5 text-[#1B4332]" />
                                                Khu vực trồng
                                            </div>
                                            <div className="mt-1 text-xs sm:text-sm font-extrabold text-gray-900 truncate">
                                                {traceData.batch.grow_zone}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Địa chỉ nông trại & Nút xem sản phẩm */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <MapPin className="h-4 w-4 text-[#1B4332] shrink-0" />
                                            <span>
                                                <strong>{traceData.farm_info?.name}:</strong>{' '}
                                                {traceData.farm_info?.address}
                                            </span>
                                        </div>

                                        {traceData.product.id > 0 && (
                                            <Link
                                                to={`/products/${traceData.product.id}`}
                                                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1E462D] px-4 text-xs sm:text-sm font-bold text-white hover:bg-[#163622] transition"
                                            >
                                                <ShoppingBag className="h-4 w-4" />
                                                <span>Đặt mua sản phẩm này</span>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* KHỐI 2: CHỨNG NHẬN CHẤT LƯỢNG (quality_certifications) */}
                        <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 sm:p-7 shadow-xs">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-[#1B4332]" />
                                <h3 className="text-base sm:text-lg font-extrabold text-gray-900">
                                    Chứng nhận chất lượng & Kiểm định
                                </h3>
                            </div>

                            {traceData.certifications.length > 0 ? (
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {traceData.certifications.map((cert) => (
                                        <div
                                            key={cert.id}
                                            className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-900/10 bg-[#F3F8F3] p-4"
                                        >
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <FileCheck2 className="h-4 w-4 text-[#1B4332] shrink-0" />
                                                    <span className="text-sm font-extrabold text-[#1B4332]">
                                                        {cert.cert_name}
                                                    </span>
                                                    {cert.cert_code && (
                                                        <span className="rounded bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-gray-700">
                                                            {cert.cert_code}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-600 truncate">
                                                    Cấp bởi: {cert.issued_by}
                                                </p>
                                                {cert.expiry_date && (
                                                    <p className="text-[11px] text-gray-500">
                                                        Hiệu lực đến: {formatDate(cert.expiry_date)}
                                                    </p>
                                                )}
                                            </div>

                                            {cert.document_url && (
                                                <a
                                                    href={cert.document_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex h-10 shrink-0 items-center gap-1 rounded-xl bg-white px-3 text-xs font-bold text-[#1B4332] border border-emerald-900/10 hover:bg-[#DDF2E2] transition"
                                                >
                                                    <span>Xem bản scan</span>
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-3 rounded-2xl bg-[#F8FAF8] p-4 text-xs sm:text-sm text-gray-600 flex items-center gap-2.5">
                                    <ShieldCheck className="h-5 w-5 text-[#1B4332] shrink-0" />
                                    <span>
                                        Lô hàng thuộc quy trình canh tác hữu cơ khép kín đạt chuẩn VietGAP tại
                                        nông trại FARMLY.
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* KHỐI 3: DÒNG THỜI GIAN NHẬT KÝ CANH TÁC (farming_logs) */}
                        <div className="rounded-3xl border border-emerald-900/10 bg-white p-5 sm:p-7 shadow-xs">
                            <div className="space-y-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#1B4332]">
                                    • NHẬT KÝ THỰC ĐỊA ĐÃ KHÓA SAU THU HOẠCH
                                </span>
                                <h3 className="text-lg sm:text-xl font-extrabold text-gray-900">
                                    Hành trình canh tác lô #{traceData.batch.batch_code}
                                </h3>
                            </div>

                            {traceData.farming_logs.length > 0 ? (
                                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {traceData.farming_logs.map((log, index) => (
                                        <div
                                            key={log.id}
                                            className="flex flex-col justify-between rounded-2xl border border-gray-200/80 bg-[#F8FAF8] p-3.5"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between gap-2 text-[11px] mb-2.5">
                                                    <span className="rounded-md bg-[#DDF2E2] px-2 py-0.5 font-extrabold text-[#1B4332]">
                                                        {log.stage_label || `BƯỚC ${index + 1}`}
                                                    </span>
                                                    <span className="font-medium text-gray-500">
                                                        {log.logged_at ? formatDate(log.logged_at) : ''}
                                                    </span>
                                                </div>

                                                {log.evidence_image_url && (
                                                    <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100 mb-3">
                                                        <img
                                                            src={log.evidence_image_url}
                                                            alt={log.title}
                                                            loading="lazy"
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                )}

                                                <h4 className="text-sm font-extrabold text-gray-900">
                                                    {log.title}
                                                </h4>
                                                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                                                    {log.description}
                                                </p>
                                            </div>

                                            <div className="mt-3 pt-2.5 border-t border-gray-200/60 text-[11px] text-gray-500">
                                                Thực hiện: <strong>{log.performer_name}</strong>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-4 rounded-2xl bg-[#F8FAF8] p-4 text-xs sm:text-sm text-gray-500">
                                    Chưa có bản ghi nhật ký chi tiết cho lô hàng này.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TraceabilityPage;