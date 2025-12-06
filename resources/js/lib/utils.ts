import { InertiaLinkProps } from '@inertiajs/react';
import { type ClassValue, clsx } from 'clsx';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isSameUrl(
    url1: NonNullable<InertiaLinkProps['href']>,
    url2: NonNullable<InertiaLinkProps['href']>,
) {
    return resolveUrl(url1) === resolveUrl(url2);
}

export function resolveUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

// ============================================
// Currency & Number Formatting
// ============================================

export function formatCurrency(value: number | string | null | undefined): string {
    if (value === null || value === undefined) return 'Rp 0';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(numValue);
}

export function formatNumber(value: number | string | null | undefined): string {
    if (value === null || value === undefined) return '0';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('id-ID').format(numValue);
}

export function formatPercent(value: number | null | undefined, decimals: number = 1): string {
    if (value === null || value === undefined) return '0%';
    return `${value.toFixed(decimals)}%`;
}

// ============================================
// Date Formatting
// ============================================

export function formatDate(date: string | Date | null | undefined, formatStr: string = 'dd MMM yyyy'): string {
    if (!date) return '-';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: id });
}

export function formatDateTime(date: string | Date | null | undefined): string {
    return formatDate(date, 'dd MMM yyyy HH:mm');
}

export function formatDateShort(date: string | Date | null | undefined): string {
    return formatDate(date, 'dd/MM/yyyy');
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
    if (!date) return '-';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: id });
}

// ============================================
// Status Labels & Colors
// ============================================

export type TransferStatusType = 'draft' | 'pending' | 'approved' | 'rejected' | 'sent' | 'received';

export const transferStatusLabels: Record<TransferStatusType, string> = {
    draft: 'Draft',
    pending: 'Menunggu Approval',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    sent: 'Dikirim',
    received: 'Diterima',
};

export const transferStatusColors: Record<TransferStatusType, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    sent: 'bg-purple-100 text-purple-800',
    received: 'bg-green-100 text-green-800',
};

export type PaymentMethodType = 'cash' | 'transfer' | 'debit';

export const paymentMethodLabels: Record<PaymentMethodType, string> = {
    cash: 'Tunai',
    transfer: 'Transfer',
    debit: 'Debit',
};

export const paymentMethodColors: Record<PaymentMethodType, string> = {
    cash: 'bg-green-100 text-green-800',
    transfer: 'bg-blue-100 text-blue-800',
    debit: 'bg-purple-100 text-purple-800',
};

export type StockMovementTypeLabel = 'in' | 'out';

export const stockMovementLabels: Record<StockMovementTypeLabel, string> = {
    in: 'Masuk',
    out: 'Keluar',
};

export const stockMovementColors: Record<StockMovementTypeLabel, string> = {
    in: 'bg-green-100 text-green-800',
    out: 'bg-red-100 text-red-800',
};

export type StockReferenceType = 'sale' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'initial';

export const stockReferenceLabels: Record<StockReferenceType, string> = {
    sale: 'Penjualan',
    transfer_in: 'Transfer Masuk',
    transfer_out: 'Transfer Keluar',
    adjustment: 'Penyesuaian',
    initial: 'Stok Awal',
};

// ============================================
// Helper Functions
// ============================================

export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
}

export function slugify(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function generateSKU(name: string, categoryCode?: string): string {
    const prefix = categoryCode?.toUpperCase().slice(0, 3) || 'PRD';
    const namePart = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${namePart}-${random}`;
}
