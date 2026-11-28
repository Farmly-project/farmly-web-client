// import { useState, useEffect, useCallback, useMemo } from 'react';
// import {
//     Flame,
//     Search,
//     RefreshCw,
//     AlertTriangle,
//     Calendar,
//     Clock,
//     CheckCircle2,
//     XCircle,
//     Tag,
//     Package,
// } from 'lucide-react';
// import { batchService } from '../../services/batchService';
// import { formatCurrency, formatDate } from '../../utils/formatters';

// interface BatchFlashSaleRow {
//     id: number;
//     batch_code: string;
//     product_id: number;
//     product_name: string;
//     unit: string;
//     base_price: number;
//     harvest_date: string;
//     exp_date: string;
//     days_until_expiry: number;
//     current_quantity: number;
//     status: string;
//     flash_sale_price: number | null;
//     flash_sale_ends_at: string | null;
// }

// function calcDaysUntilExpiry(expDateStr?: string): number {
//     if (!expDateStr) return 0;
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const exp = new Date(expDateStr);
//     exp.setHours(0, 0, 0, 0);
//     return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
// }

// function toLocalDateTimeInput(isoStr?: string | null): string {
//     if (!isoStr) {
//         const endOfDay = new Date();
//         endOfDay.setHours(23, 59, 0, 0);
//         const offset = endOfDay.getTimezoneOffset() * 60000;
//         return new Date(endOfDay.getTime() - offset).toISOString().slice(0, 16);
//     }
//     const d = new Date(isoStr);
//     if (Number.isNaN(d.getTime())) return '';
//     const offset = d.getTimezoneOffset() * 60000;
//     return new Date(d.getTime() - offset).toISOString().slice(0, 16);
// }

// export function FlashSaleConfigPage() {
//     const [batches, setBatches] = useState<BatchFlashSaleRow[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [errorMsg, setErrorMsg] = useState<string | null>(null);
//     const [successMsg, setSuccessMsg] = useState<string | null>(null);

//     const [filterMode, setFilterMode] = useState<'all' | 'near_expiry' | 'active_sale'>('all');
//     const [searchKeyword, setSearchKeyword] = useState('');

//     // Modal cấu hình giá Flash Sale
//     const [selectedBatch, setSelectedBatch] = useState<BatchFlashSaleRow | null>(null);
//     const [salePriceInput, setSalePriceInput] = useState('');
//     const [endsAtInput, setEndsAtInput] = useState('');
//     const [isSaving, setIsSaving] = useState(false);

//     const loadBatches = useCallback(async () => {
//         setLoading(true);
//         setErrorMsg(null);
//         try {
//             const res = await batchService.getBatches({ limit: 100 });
//             const raw = res as {
//                 data?: Record<string, unknown>[] | { items?: Record<string, unknown>[]; batches?: Record<string, unknown>[] };
//                 items?: Record<string, unknown>[];
//                 batches?: Record<string, unknown>[];
//             };

//             const list = Array.isArray(raw?.data)
//                 ? raw.data
//                 : raw?.data?.items ??
//                 raw?.data?.batches ??
//                 raw?.items ??
//                 raw?.batches ??
//                 (Array.isArray(res) ? (res as Record<string, unknown>[]) : []);

//             const normalized: BatchFlashSaleRow[] = list
//                 .map((row) => {
//                     const productObj = (row.product as Record<string, unknown> | undefined) ?? {};
//                     const expDate = String(row.exp_date ?? '');
//                     return {
//                         id: Number(row.id),
//                         batch_code: String(row.batch_code ?? `BATCH-${row.id}`),
//                         product_id: Number(row.product_id ?? productObj.id ?? 0),
//                         product_name: String(
//                             row.product_name ?? productObj.name ?? 'Nông sản Farmly'
//                         ),
//                         unit: String(row.unit ?? productObj.unit ?? 'túi'),
//                         base_price: Number(row.base_price ?? productObj.base_price ?? 0),
//                         harvest_date: String(row.harvest_date ?? ''),
//                         exp_date: expDate,
//                         days_until_expiry:
//                             row.days_until_expiry !== undefined
//                                 ? Number(row.days_until_expiry)
//                                 : calcDaysUntilExpiry(expDate),
//                         current_quantity: Number(row.current_quantity ?? 0),
//                         status: String(row.status ?? 'active'),
//                         flash_sale_price:
//                             row.flash_sale_price !== null && row.flash_sale_price !== undefined
//                                 ? Number(row.flash_sale_price)
//                                 : null,
//                         flash_sale_ends_at: (row.flash_sale_ends_at as string | null) ?? null,
//                     };
//                 })
//                 .filter((b) => b.current_quantity > 0 && b.days_until_expiry >= 0)
//                 .sort((a, b) => a.days_until_expiry - b.days_until_expiry); // Ưu tiên FEFO

//             setBatches(normalized);
//         } catch (err) {
//             setErrorMsg(
//                 err instanceof Error ? err.message : 'Không thể tải danh sách lô hàng.'
//             );
//         } finally {
//             setLoading(false);
//         }
//     }, []);

//     useEffect(() => {
//         loadBatches();
//     }, [loadBatches]);

//     const filteredBatches = useMemo(() => {
//         return batches.filter((b) => {
//             if (filterMode === 'near_expiry' && b.days_until_expiry > 3) return false;
//             if (filterMode === 'active_sale' && !b.flash_sale_price) return false;

//             if (searchKeyword.trim()) {
//                 const kw = searchKeyword.trim().toLowerCase();
//                 const matchCode = b.batch_code.toLowerCase().includes(kw);
//                 const matchName = b.product_name.toLowerCase().includes(kw);
//                 if (!matchCode && !matchName) return false;
//             }
//             return true;
//         });
//     }, [batches, filterMode, searchKeyword]);

//     const stats = useMemo(() => {
//         const nearExpiryCount = batches.filter((b) => b.days_until_expiry <= 3).length;
//         const activeSaleCount = batches.filter((b) => Boolean(b.flash_sale_price)).length;
//         return { total: batches.length, nearExpiryCount, activeSaleCount };
//     }, [batches]);

//     const openConfigModal = (batch: BatchFlashSaleRow) => {
//         setSelectedBatch(batch);
//         const suggestedPrice =
//             batch.flash_sale_price ?? Math.round((batch.base_price * 0.8) / 1000) * 1000;
//         setSalePriceInput(String(suggestedPrice > 0 ? suggestedPrice : ''));
//         setEndsAtInput(toLocalDateTimeInput(batch.flash_sale_ends_at));
//         setErrorMsg(null);
//     };

//     const applyDiscountPercent = (percent: number) => {
//         if (!selectedBatch) return;
//         const discounted =
//             Math.round((selectedBatch.base_price * (100 - percent)) / 100 / 500) * 500;
//         setSalePriceInput(String(Math.max(1000, discounted)));
//     };

//     const handleSaveFlashSale = async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!selectedBatch) return;

//         const price = Number(salePriceInput);
//         if (!price || price <= 0) {
//             setErrorMsg('Giá xả kho phải lớn hơn 0đ.');
//             return;
//         }
//         if (selectedBatch.base_price > 0 && price >= selectedBatch.base_price) {
//             setErrorMsg(
//                 `Giá Flash Sale phải nhỏ hơn giá gốc (${formatCurrency(selectedBatch.base_price)}).`
//             );
//             return;
//         }

//         setIsSaving(true);
//         setErrorMsg(null);
//         try {
//             await batchService.configureFlashSale(selectedBatch.id, {
//                 flash_sale_price: price,
//                 flash_sale_ends_at: endsAtInput ? new Date(endsAtInput).toISOString() : null,
//             });
//             setSuccessMsg(
//                 `Đã kích hoạt giá xả kho ${formatCurrency(price)} cho lô ${selectedBatch.batch_code}.`
//             );
//             setSelectedBatch(null);
//             await loadBatches();
//         } catch (err) {
//             setErrorMsg(
//                 err instanceof Error ? err.message : 'Cập nhật giá Flash Sale thất bại.'
//             );
//         } finally {
//             setIsSaving(false);
//         }
//     };

//     const handleDisableFlashSale = async (batch: BatchFlashSaleRow) => {
//         setIsSaving(true);
//         setErrorMsg(null);
//         try {
//             await batchService.configureFlashSale(batch.id, {
//                 flash_sale_price: null,
//                 flash_sale_ends_at: null,
//             });
//             setSuccessMsg(`Đã tắt Flash Sale cho lô ${batch.batch_code}.`);
//             if (selectedBatch?.id === batch.id) setSelectedBatch(null);
//             await loadBatches();
//         } catch (err) {
//             setErrorMsg(
//                 err instanceof Error ? err.message : 'Không thể tắt Flash Sale.'
//             );
//         } finally {
//             setIsSaving(false);
//         }
//     };

//     return (
//         <div className="space-y-6">
//             {/* Header */}
//             <div className="flex flex-wrap items-center justify-between gap-4">
//                 <div>
//                     <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 mb-1.5">
//                         <Flame className="h-3.5 w-3.5" />
//                         Ưu tiên xuất kho FEFO
//                     </div>
//                     <h1 className="text-2xl font-extrabold text-gray-900">
//                         Cấu hình Flash Sale & Xả lô cận hạn
//                     </h1>
//                     <p className="text-sm text-gray-500 mt-0.5">
//                         Thiết lập giá ưu đãi cho các lô nông sản sắp đến hạn sử dụng để giảm hao hụt sau thu hoạch.
//                     </p>
//                 </div>

//                 <button
//                     type="button"
//                     onClick={loadBatches}
//                     disabled={loading}
//                     className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
//                 >
//                     <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
//                     Làm mới
//                 </button>
//             </div>

//             {/* Thông báo */}
//             {successMsg && (
//                 <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
//                     <div className="flex items-center gap-2">
//                         <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
//                         <span>{successMsg}</span>
//                     </div>
//                     <button
//                         type="button"
//                         onClick={() => setSuccessMsg(null)}
//                         className="text-xs font-bold underline"
//                     >
//                         Đóng
//                     </button>
//                 </div>
//             )}

//             {errorMsg && (
//                 <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
//                     <AlertTriangle className="h-4 w-4 shrink-0" />
//                     <span>{errorMsg}</span>
//                 </div>
//             )}

//             {/* Thống kê nhanh */}
//             <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
//                 <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
//                     <div className="text-xs font-semibold text-gray-500">Tổng lô đang mở bán</div>
//                     <div className="mt-1 text-2xl font-extrabold text-gray-900">{stats.total} lô</div>
//                 </div>
//                 <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-2xs">
//                     <div className="text-xs font-semibold text-amber-800">Lô cận hạn (≤ 3 ngày)</div>
//                     <div className="mt-1 text-2xl font-extrabold text-amber-700">
//                         {stats.nearExpiryCount} lô
//                     </div>
//                 </div>
//                 <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 shadow-2xs">
//                     <div className="text-xs font-semibold text-red-800">Đang chạy Flash Sale</div>
//                     <div className="mt-1 text-2xl font-extrabold text-red-600">
//                         {stats.activeSaleCount} lô
//                     </div>
//                 </div>
//             </div>

//             {/* Bộ lọc & Tìm kiếm */}
//             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//                 <div className="flex flex-wrap gap-2">
//                     {[
//                         { key: 'all', label: `Tất cả (${stats.total})` },
//                         { key: 'near_expiry', label: `Cận hạn ≤ 3 ngày (${stats.nearExpiryCount})` },
//                         { key: 'active_sale', label: `Đang giảm giá (${stats.activeSaleCount})` },
//                     ].map((tab) => (
//                         <button
//                             key={tab.key}
//                             type="button"
//                             onClick={() => setFilterMode(tab.key as typeof filterMode)}
//                             className={`h-10 rounded-xl px-4 text-xs font-bold transition ${filterMode === tab.key
//                                 ? 'bg-[#1E462D] text-white shadow-2xs'
//                                 : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
//                                 }`}
//                         >
//                             {tab.label}
//                         </button>
//                     ))}
//                 </div>

//                 <div className="relative w-full sm:w-72">
//                     <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
//                     <input
//                         type="text"
//                         value={searchKeyword}
//                         onChange={(e) => setSearchKeyword(e.target.value)}
//                         placeholder="Tìm mã lô hoặc tên rau củ..."
//                         className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm focus:border-[#1E462D] focus:outline-none"
//                     />
//                 </div>
//             </div>

//             {/* Bảng danh sách lô FEFO */}
//             <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xs">
//                 <div className="overflow-x-auto">
//                     <table className="w-full text-left text-sm">
//                         <thead className="border-b border-gray-200 bg-gray-50/80 text-xs font-bold uppercase text-gray-600">
//                             <tr>
//                                 <th className="px-4 py-3.5">Mã lô / Sản phẩm</th>
//                                 <th className="px-4 py-3.5">Thu hoạch & HSD (FEFO)</th>
//                                 <th className="px-4 py-3.5">Tồn lô</th>
//                                 <th className="px-4 py-3.5">Giá gốc</th>
//                                 <th className="px-4 py-3.5">Giá Flash Sale</th>
//                                 <th className="px-4 py-3.5 text-right">Thao tác</th>
//                             </tr>
//                         </thead>
//                         <tbody className="divide-y divide-gray-100">
//                             {loading ? (
//                                 <tr>
//                                     <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
//                                         Đang tải danh sách lô hàng FEFO...
//                                     </td>
//                                 </tr>
//                             ) : filteredBatches.length === 0 ? (
//                                 <tr>
//                                     <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
//                                         Không có lô hàng phù hợp với bộ lọc hiện tại.
//                                     </td>
//                                 </tr>
//                             ) : (
//                                 filteredBatches.map((batch) => {
//                                     const isUrgent = batch.days_until_expiry <= 2;
//                                     const isNear = batch.days_until_expiry <= 3;
//                                     const discountPct =
//                                         batch.flash_sale_price && batch.base_price > 0
//                                             ? Math.round(
//                                                 ((batch.base_price - batch.flash_sale_price) /
//                                                     batch.base_price) *
//                                                 100
//                                             )
//                                             : 0;

//                                     return (
//                                         <tr key={batch.id} className="hover:bg-gray-50/70">
//                                             <td className="px-4 py-3.5">
//                                                 <div className="font-mono text-xs font-bold text-[#1E462D]">
//                                                     {batch.batch_code}
//                                                 </div>
//                                                 <div className="font-bold text-gray-900 mt-0.5">
//                                                     {batch.product_name}
//                                                 </div>
//                                                 <div className="text-xs text-gray-500">ĐVT: {batch.unit}</div>
//                                             </td>

//                                             <td className="px-4 py-3.5">
//                                                 <div className="flex items-center gap-1.5 text-xs text-gray-600">
//                                                     <Calendar className="h-3.5 w-3.5 text-gray-400" />
//                                                     <span>TH: {formatDate(batch.harvest_date)}</span>
//                                                 </div>
//                                                 <div className="mt-1 flex items-center gap-1.5">
//                                                     <Clock className="h-3.5 w-3.5 text-amber-600" />
//                                                     <span className="text-xs font-semibold text-gray-800">
//                                                         HSD: {formatDate(batch.exp_date)}
//                                                     </span>
//                                                     <span
//                                                         className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${isUrgent
//                                                             ? 'bg-red-100 text-red-700'
//                                                             : isNear
//                                                                 ? 'bg-amber-100 text-amber-800'
//                                                                 : 'bg-emerald-50 text-emerald-700'
//                                                             }`}
//                                                     >
//                                                         Còn {batch.days_until_expiry} ngày
//                                                     </span>
//                                                 </div>
//                                             </td>

//                                             <td className="px-4 py-3.5">
//                                                 <span className="inline-flex items-center gap-1 font-bold text-gray-800">
//                                                     <Package className="h-3.5 w-3.5 text-gray-400" />
//                                                     {batch.current_quantity}
//                                                 </span>
//                                             </td>

//                                             <td className="px-4 py-3.5 font-medium text-gray-600">
//                                                 {formatCurrency(batch.base_price)}
//                                             </td>

//                                             <td className="px-4 py-3.5">
//                                                 {batch.flash_sale_price ? (
//                                                     <div>
//                                                         <div className="flex items-center gap-1.5">
//                                                             <span className="font-extrabold text-red-600">
//                                                                 {formatCurrency(batch.flash_sale_price)}
//                                                             </span>
//                                                             <span className="rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-extrabold text-red-700">
//                                                                 -{discountPct}%
//                                                             </span>
//                                                         </div>
//                                                         {batch.flash_sale_ends_at && (
//                                                             <div className="text-[11px] text-gray-500 mt-0.5">
//                                                                 Hết hạn sale:{' '}
//                                                                 {new Date(batch.flash_sale_ends_at).toLocaleString(
//                                                                     'vi-VN',
//                                                                     {
//                                                                         hour: '2-digit',
//                                                                         minute: '2-digit',
//                                                                         day: '2-digit',
//                                                                         month: '2-digit',
//                                                                     }
//                                                                 )}
//                                                             </div>
//                                                         )}
//                                                     </div>
//                                                 ) : (
//                                                     <span className="text-xs text-gray-400">Chưa áp dụng</span>
//                                                 )}
//                                             </td>

//                                             <td className="px-4 py-3.5 text-right">
//                                                 <div className="inline-flex items-center justify-end gap-2">
//                                                     <button
//                                                         type="button"
//                                                         onClick={() => openConfigModal(batch)}
//                                                         className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#1E462D] px-3.5 text-xs font-bold text-white hover:bg-[#163622]"
//                                                     >
//                                                         <Tag className="h-3.5 w-3.5" />
//                                                         {batch.flash_sale_price ? 'Sửa giá' : 'Tạo Flash Sale'}
//                                                     </button>

//                                                     {batch.flash_sale_price && (
//                                                         <button
//                                                             type="button"
//                                                             disabled={isSaving}
//                                                             onClick={() => handleDisableFlashSale(batch)}
//                                                             title="Tắt Flash Sale"
//                                                             className="inline-flex h-10 items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
//                                                         >
//                                                             <XCircle className="h-3.5 w-3.5" />
//                                                             Tắt
//                                                         </button>
//                                                     )}
//                                                 </div>
//                                             </td>
//                                         </tr>
//                                     );
//                                 })
//                             )}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>

//             {/* Modal Cấu hình giá Flash Sale */}
//             {selectedBatch && (
//                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
//                     <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
//                         <div className="flex items-start justify-between">
//                             <div>
//                                 <span className="font-mono text-xs font-bold text-[#1E462D]">
//                                     {selectedBatch.batch_code}
//                                 </span>
//                                 <h3 className="text-lg font-extrabold text-gray-900">
//                                     Cấu hình giá xả kho – {selectedBatch.product_name}
//                                 </h3>
//                             </div>
//                             <button
//                                 type="button"
//                                 onClick={() => setSelectedBatch(null)}
//                                 className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
//                             >
//                                 <XCircle className="h-5 w-5" />
//                             </button>
//                         </div>

//                         <div className="rounded-xl bg-[#F3F8F3] p-3 text-xs space-y-1">
//                             <div className="flex justify-between">
//                                 <span className="text-gray-600">Giá gốc niêm yết:</span>
//                                 <strong className="text-gray-900">
//                                     {formatCurrency(selectedBatch.base_price)} / {selectedBatch.unit}
//                                 </strong>
//                             </div>
//                             <div className="flex justify-between">
//                                 <span className="text-gray-600">Hạn sử dụng lô:</span>
//                                 <strong className="text-amber-700">
//                                     {formatDate(selectedBatch.exp_date)} (Còn{' '}
//                                     {selectedBatch.days_until_expiry} ngày)
//                                 </strong>
//                             </div>
//                             <div className="flex justify-between">
//                                 <span className="text-gray-600">Tồn khả dụng trong lô:</span>
//                                 <strong className="text-gray-900">
//                                     {selectedBatch.current_quantity} {selectedBatch.unit}
//                                 </strong>
//                             </div>
//                         </div>

//                         <form onSubmit={handleSaveFlashSale} className="space-y-4">
//                             <div>
//                                 <label className="block text-xs font-bold text-gray-700 mb-1.5">
//                                     Chọn nhanh mức giảm giá:
//                                 </label>
//                                 <div className="grid grid-cols-4 gap-2">
//                                     {[15, 20, 30, 50].map((pct) => (
//                                         <button
//                                             key={pct}
//                                             type="button"
//                                             onClick={() => applyDiscountPercent(pct)}
//                                             className="h-9 rounded-lg border border-emerald-200 bg-emerald-50/70 text-xs font-bold text-[#1E462D] hover:bg-emerald-100"
//                                         >
//                                             -{pct}%
//                                         </button>
//                                     ))}
//                                 </div>
//                             </div>

//                             <div>
//                                 <label className="block text-xs font-bold text-gray-700 mb-1">
//                                     Giá Flash Sale (VNĐ) *
//                                 </label>
//                                 <input
//                                     type="number"
//                                     min={1000}
//                                     step={500}
//                                     required
//                                     value={salePriceInput}
//                                     onChange={(e) => setSalePriceInput(e.target.value)}
//                                     className="h-11 w-full rounded-xl border border-gray-300 px-3.5 text-sm font-bold text-red-600 focus:border-[#1E462D] focus:outline-none"
//                                 />
//                             </div>

//                             <div>
//                                 <label className="block text-xs font-bold text-gray-700 mb-1">
//                                     Thời điểm kết thúc Flash Sale
//                                 </label>
//                                 <input
//                                     type="datetime-local"
//                                     value={endsAtInput}
//                                     onChange={(e) => setEndsAtInput(e.target.value)}
//                                     className="h-11 w-full rounded-xl border border-gray-300 px-3.5 text-sm focus:border-[#1E462D] focus:outline-none"
//                                 />
//                             </div>

//                             <div className="flex items-center justify-end gap-2 pt-2">
//                                 <button
//                                     type="button"
//                                     onClick={() => setSelectedBatch(null)}
//                                     className="h-11 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
//                                 >
//                                     Hủy
//                                 </button>
//                                 <button
//                                     type="submit"
//                                     disabled={isSaving}
//                                     className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#1E462D] px-5 text-sm font-bold text-white hover:bg-[#163622] disabled:opacity-50"
//                                 >
//                                     <Flame className="h-4 w-4" />
//                                     {isSaving ? 'Đang lưu...' : 'Áp dụng Flash Sale'}
//                                 </button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }

// export default FlashSaleConfigPage;

export function FlashSaleConfigPage() {
    return (
        <div className="rounded-2xl border border-emerald-900/10 bg-white p-6">
            <h1 className="text-xl font-extrabold text-gray-900">Cấu hình Flash Sale</h1>
            <p className="mt-2 text-sm text-gray-600">Chức năng đang được cập nhật.</p>
        </div>
    );
}

export default FlashSaleConfigPage;
