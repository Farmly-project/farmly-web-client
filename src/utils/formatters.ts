
export function formatCurrency(amount: number | string | null | undefined): string {
    if (amount === null || amount === undefined || amount === '') {
        return '0 ₫';
    }

    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (Number.isNaN(numericAmount)) {
        return '0 ₫';
    }

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(numericAmount);
}

export function formatVND(amount: number): string {
    return `${Math.round(amount).toLocaleString('vi-VN')}đ`;
}


export function formatDate(dateInput: string | Date | null | undefined): string {
    if (!dateInput) return '—';

    // Nếu là chuỗi thuần YYYY-MM-DD (kiểu DATE trong PostgreSQL như harvest_date, exp_date)
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const [year, month, day] = dateInput.split('-');
        return `${day}/${month}/${year}`;
    }

    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
}


export function formatDateTime(dateInput: string | Date | null | undefined): string {
    if (!dateInput) return '—';

    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date);
}


export function formatQuantity(
    quantity: number | string | null | undefined,
    unit?: string
): string {
    if (quantity === null || quantity === undefined) return '0';

    const numericQty = typeof quantity === 'string' ? parseFloat(quantity) : quantity;

    if (Number.isNaN(numericQty)) return '0';

    const formattedNumber = new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(numericQty);

    return unit ? `${formattedNumber} ${unit}` : formattedNumber;
}

/**
 * Hiển thị nhãn thời gian còn lại trước hạn sử dụng (phục vụ badge cảnh báo cận hạn UC05/UC07)
 * VD: 0 -> "Hết hạn hôm nay" | 1 -> "Còn 1 ngày" | -2 -> "Đã quá hạn 2 ngày"
 */
export function formatExpiryCountdown(daysUntilExpiry: number): string {
    if (daysUntilExpiry < 0) {
        return `Quá hạn ${Math.abs(daysUntilExpiry)} ngày`;
    }
    if (daysUntilExpiry === 0) {
        return 'Hết hạn hôm nay';
    }
    return `Còn ${daysUntilExpiry} ngày`;
}