export interface TraceProductInfo {
    id: number;
    name: string;
    slug?: string;
    unit: string;
    base_price?: number;
    description?: string;
    primary_image_url?: string | null;
    category_name?: string;
}

export interface TraceBatchInfo {
    id: number;
    batch_code: string;
    sowing_date: string | null;
    harvest_date: string | null;
    exp_date: string | null;
    initial_quantity?: number;
    current_quantity?: number;
    status: 'growing' | 'in_stock' | 'sold_out' | 'expired';
    qr_code?: string | null;
    qr_scan_count?: number;
    grow_zone?: string;
}

export interface TraceCertificationItem {
    id: number;
    cert_name: string;
    cert_code?: string | null;
    issued_by?: string | null;
    issued_date?: string | null;
    expiry_date?: string | null;
    document_url?: string | null;
}

export interface TraceFarmingLogItem {
    id: number;
    stage: 'sowing' | 'fertilizing' | 'watering' | 'pesticide' | 'harvesting' | string;
    stage_label?: string;
    title?: string;
    description: string;
    evidence_image_url?: string | null;
    logged_at: string;
    performer_name?: string;
}

export interface BatchTraceData {
    batch: TraceBatchInfo;
    product: TraceProductInfo;
    certifications: TraceCertificationItem[];
    farming_logs: TraceFarmingLogItem[];
    farm_info?: {
        name: string;
        address: string;
    };
}