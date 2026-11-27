import { apiFetch } from './apiClient';
import type { BatchTraceData } from '../types/batch.types';

export const batchService = {
    // API #32: GET /api/v1/trace/:batchCode (UC10 - Public QR Traceability)
    getBatchTrace: (batchCode: string) =>
        apiFetch<BatchTraceData>(`/trace/${encodeURIComponent(batchCode.trim())}`),
};