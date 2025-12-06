import { DataTable } from '@/components/data-table';
import { FilterBar } from '@/components/filter-bar';
import { PageHeader } from '@/components/page-header';
import { LowStockBadge } from '@/components/status-badge';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { Branch, BranchStock, BreadcrumbItem, Product } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, Download, Package, Warehouse } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface StockWithRelations extends Omit<BranchStock, 'branch' | 'product'> {
    branch: { id: number; name: string; code: string };
    product: Product & { category: { id: number; name: string } | null };
}

interface Props {
    stocks: StockWithRelations[];
    summary: { total_items: number; total_quantity: number; total_value: number; low_stock_count: number };
    stockByCategory: { category_name: string; total_quantity: number; total_value: number }[];
    branches: Branch[];
    filters: { branch_id?: string };
    isSuperAdmin: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan', href: '/reports/stock' },
    { title: 'Stok', href: '/reports/stock' },
];

export default function StockReport({ stocks, summary, stockByCategory, branches, filters, isSuperAdmin }: Props) {
    const [branchId, setBranchId] = useState(filters.branch_id ?? '');

    const handleBranchChange = (value: string) => {
        setBranchId(value);
        router.get('/reports/stock', value ? { branch_id: value } : {}, { preserveState: true, preserveScroll: true });
    };

    const handleClearFilters = () => {
        setBranchId('');
        router.get('/reports/stock', {}, { preserveState: true, preserveScroll: true });
    };

    const handleExport = () => {
        const params = branchId ? `?branch_id=${branchId}` : '';
        window.open(`/reports/stock/export${params}`, '_blank');
    };

    const columns: ColumnDef<StockWithRelations>[] = [
        { accessorKey: 'product.sku', header: 'SKU', cell: ({ row }) => <span className="font-mono">{row.original.product.sku}</span> },
        { accessorKey: 'product.name', header: 'Produk' },
        { accessorKey: 'product.category.name', header: 'Kategori', cell: ({ row }) => row.original.product.category?.name || '-' },
        ...(isSuperAdmin && !branchId ? [{ accessorKey: 'branch.name', header: 'Cabang', cell: ({ row }: { row: { original: StockWithRelations } }) => row.original.branch.name }] : []),
        {
            accessorKey: 'quantity',
            header: 'Stok',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className={row.original.quantity <= row.original.min_stock ? 'text-red-600 font-semibold' : ''}>{formatNumber(row.original.quantity)}</span>
                    {row.original.quantity <= row.original.min_stock && <LowStockBadge />}
                </div>
            ),
        },
        { accessorKey: 'min_stock', header: 'Min. Stok', cell: ({ row }) => formatNumber(row.original.min_stock) },
        { accessorKey: 'value', header: 'Nilai', cell: ({ row }) => formatCurrency(row.original.quantity * row.original.product.price) },
    ];

    const branchOptions = branches.map((b) => ({ label: `${b.name} (${b.code})`, value: String(b.id) }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Stok" />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader title="Laporan Stok" description="Analisis stok produk">
                    <Button onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export Excel</Button>
                </PageHeader>

                <FilterBar
                    onClearFilters={handleClearFilters}
                    filters={isSuperAdmin ? [{ label: 'Cabang', value: branchId, options: branchOptions, onChange: handleBranchChange }] : []}
                />

                <div className="grid gap-4 md:grid-cols-4">
                    <StatCard title="Total Item" value={formatNumber(summary.total_items)} icon={Package} />
                    <StatCard title="Total Kuantitas" value={formatNumber(summary.total_quantity)} icon={Warehouse} />
                    <StatCard title="Nilai Stok" value={formatCurrency(summary.total_value)} icon={Package} />
                    <StatCard title="Stok Rendah" value={formatNumber(summary.low_stock_count)} icon={AlertTriangle} variant={summary.low_stock_count > 0 ? 'destructive' : 'default'} />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle>Stok per Kategori</CardTitle><CardDescription>Distribusi stok berdasarkan kategori</CardDescription></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={stockByCategory} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="category_name" type="category" width={100} tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={(value: number) => formatNumber(value)} />
                                    <Bar dataKey="total_quantity" fill="#82ca9d" name="Kuantitas" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Nilai Stok per Kategori</CardTitle><CardDescription>Nilai stok berdasarkan kategori</CardDescription></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={stockByCategory} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                                    <YAxis dataKey="category_name" type="category" width={100} tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Bar dataKey="total_value" fill="#8884d8" name="Nilai" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader><CardTitle>Detail Stok</CardTitle><CardDescription>Daftar lengkap stok produk</CardDescription></CardHeader>
                    <CardContent><DataTable columns={columns} data={stocks} /></CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

