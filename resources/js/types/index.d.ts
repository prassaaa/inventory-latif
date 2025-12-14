import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

// ============================================
// Auth & Navigation Types
// ============================================

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    permission?: string;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
}

// ============================================
// User & Role Types
// ============================================

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    branch_id: number | null;
    branch?: Branch;
    is_active: boolean;
    roles?: Role[];
    permissions?: string[];
    created_at: string;
    updated_at: string;
}

export interface Role {
    id: number;
    name: string;
    guard_name: string;
}

// ============================================
// Branch Types
// ============================================

export interface Branch {
    id: number;
    name: string;
    code: string;
    address: string | null;
    phone: string | null;
    pic_name: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// ============================================
// Category Types
// ============================================

export interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// ============================================
// Product Types
// ============================================

export interface Product {
    id: number;
    sku: string;
    name: string;
    category_id: number;
    category?: Category;
    description: string | null;
    color: string | null;
    size: string | null;
    price: number;
    image: string | null;
    image_url: string | null;
    thumbnail_url: string | null;
    is_active: boolean;
    branch_stocks?: BranchStock[];
    created_at: string;
    updated_at: string;
}

export type ProductRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ProductRequest {
    id: number;
    branch_id: number;
    requested_by: number;
    sku: string;
    name: string;
    category_id: number;
    color: string | null;
    size: string | null;
    price: number;
    image: string | null;
    image_url: string | null;
    thumbnail_url: string | null;
    description: string | null;
    status: ProductRequestStatus;
    request_notes: string | null;
    approved_by: number | null;
    approved_at: string | null;
    rejection_reason: string | null;
    product_id: number | null;
    branch?: Branch;
    requested_by_user?: User;
    category?: Category;
    approved_by_user?: User;
    product?: Product;
    created_at: string;
    updated_at: string;
}

// ============================================
// Stock Types
// ============================================

export interface BranchStock {
    id: number;
    branch_id: number;
    product_id: number;
    branch?: Branch;
    product?: Product;
    quantity: number;
    min_stock: number;
    created_at: string;
    updated_at: string;
}

export type StockMovementType = 'in' | 'out';
export type StockReferenceType = 'sale' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'initial';

export interface StockMovement {
    id: number;
    branch_id: number;
    product_id: number;
    branch?: Branch;
    product?: Product;
    type: StockMovementType;
    reference_type: StockReferenceType;
    reference_id: number | null;
    quantity: number;
    stock_before: number;
    stock_after: number;
    notes: string | null;
    created_by: number;
    creator?: User;
    created_at: string;
    updated_at: string;
}

// ============================================
// Transfer Types
// ============================================

export type TransferStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'sent' | 'received';

export interface Transfer {
    id: number;
    transfer_number: string;
    from_branch_id: number;
    to_branch_id: number;
    from_branch?: Branch;
    to_branch?: Branch;
    requested_by: number;
    requester?: User;
    approved_by: number | null;
    approver?: User;
    requested_at: string | null;
    status: TransferStatus;
    delivery_note_number: string | null;
    notes: string | null;
    rejection_reason: string | null;
    approved_at: string | null;
    sent_at: string | null;
    received_at: string | null;
    receiving_notes: string | null;
    receiving_photo: string | null;
    items?: TransferItem[];
    created_at: string;
    updated_at: string;
}

export interface TransferItem {
    id: number;
    transfer_id: number;
    product_id: number;
    product?: Product;
    quantity_requested: number;
    quantity_sent: number | null;
    quantity_received: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

// ============================================
// Sale Types
// ============================================

export type PaymentMethod = 'cash' | 'transfer' | 'debit';

export interface Sale {
    id: number;
    invoice_number: string;
    branch_id: number;
    user_id: number;
    branch?: Branch;
    user?: User;
    sale_date: string;
    customer_name: string | null;
    customer_phone: string | null;
    subtotal: number;
    discount: number;
    grand_total: number;
    payment_method: PaymentMethod;
    notes: string | null;
    items?: SaleItem[];
    created_at: string;
    updated_at: string;
}

export interface SaleItem {
    id: number;
    sale_id: number;
    product_id: number;
    product?: Product;
    quantity: number;
    unit_price: number;
    subtotal: number;
    created_at: string;
    updated_at: string;
}

// ============================================
// Pagination Types
// ============================================

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: PaginationLink[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

// ============================================
// Dashboard Types
// ============================================

export interface DashboardStats {
    totalStock: number;
    totalStockValue: number;
    salesToday: number;
    salesCountToday: number;
    salesThisMonth: number;
    salesCountThisMonth: number;
    pendingTransfers?: number;
    outgoingTransfers?: number;
    incomingTransfers?: number;
}

export interface SalesByBranch {
    branch_id: number;
    total: number;
    count: number;
    branch: Branch;
}

// ============================================
// Report Types
// ============================================

export interface SalesSummary {
    total_sales: number;
    total_transactions: number;
    total_discount: number;
    average_transaction: number;
}

export interface DailySales {
    date: string;
    total: number;
    count: number;
}

export interface StockSummary {
    total_items: number;
    total_value: number;
    low_stock_count: number;
    total_products: number;
}

export interface StockByCategory {
    category: string;
    quantity: number;
    value: number;
    products_count: number;
}

export interface TopProduct {
    id: number;
    name: string;
    sku: string;
    category_name: string;
    total_quantity: number;
    total_revenue: number;
}

// ============================================
// Form Types
// ============================================

export interface SelectOption {
    value: string | number;
    label: string;
}

export interface FilterParams {
    search?: string;
    branch_id?: number | string;
    category_id?: number | string;
    status?: string;
    start_date?: string;
    end_date?: string;
    [key: string]: string | number | undefined;
}
