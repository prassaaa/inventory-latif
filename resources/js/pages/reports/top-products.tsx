import { DataTable } from '@/components/data-table';
import { FilterBar } from '@/components/filter-bar';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { Branch, BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Medal, Trophy } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface TopProduct {
    product_id: number;
    product_name: string;
    product_sku: string;
    total_quantity: number;
    total_revenue: number;
}

interface Props {
    topProducts: TopProduct[];
    branches: Branch[];
    filters: { branch_id?: string; start_date?: string; end_date?: string };
    isSuperAdmin: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan', href: '/reports/top-products' },
    { title: 'Produk Terlaris', href: '/reports/top-products' },
];

export default function TopProductsReport({ topProducts, branches, filters, isSuperAdmin }: Props) {
    const [branchId, setBranchId] = useState(filters.branch_id ?? '');
    const [startDate, setStartDate] = useState(filters.start_date ?? '');
    const [endDate, setEndDate] = useState(filters.end_date ?? '');

    const applyFilters = (newFilters: Partial<typeof filters>) => {
        const allFilters = { branch_id: branchId, start_date: startDate, end_date: endDate, ...newFilters };
        router.get('/reports/top-products', Object.fromEntries(Object.entries(allFilters).filter(([, v]) => v)), { preserveState: true, preserveScroll: true });
    };

    const handleClearFilters = () => {
        setBranchId(''); setStartDate(''); setEndDate('');
        router.get('/reports/top-products', {}, { preserveState: true, preserveScroll: true });
    };

    const columns: ColumnDef<TopProduct>[] = [
        {
            id: 'rank',
            header: '#',
            cell: ({ row }) => {
                const rank = row.index + 1;
                if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
                if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
                if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
                return <span className="text-muted-foreground">{rank}</span>;
            },
        },
        { accessorKey: 'product_sku', header: 'SKU', cell: ({ row }) => <span className="font-mono">{row.original.product_sku}</span> },
        { accessorKey: 'product_name', header: 'Produk' },
        { accessorKey: 'total_quantity', header: 'Qty Terjual', cell: ({ row }) => <span className="font-medium">{formatNumber(row.original.total_quantity)}</span> },
        { accessorKey: 'total_revenue', header: 'Total Pendapatan', cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.total_revenue)}</span> },
    ];

    const branchOptions = branches.map((b) => ({ label: `${b.name} (${b.code})`, value: String(b.id) }));
    const chartData = topProducts.slice(0, 10).map((p) => ({ name: p.product_name.length > 15 ? p.product_name.substring(0, 15) + '...' : p.product_name, quantity: p.total_quantity, revenue: p.total_revenue }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Produk Terlaris" />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader title="Produk Terlaris" description="Produk dengan penjualan tertinggi" />

                <FilterBar
                    onClearFilters={handleClearFilters}
                    filters={isSuperAdmin ? [{ label: 'Cabang', value: branchId, options: branchOptions, onChange: (v: string) => { setBranchId(v); applyFilters({ branch_id: v }); } }] : []}
                >
                    <div className="flex items-center gap-2">
                        <Label className="text-sm">Dari</Label>
                        <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); applyFilters({ start_date: e.target.value }); }} className="w-auto" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Label className="text-sm">Sampai</Label>
                        <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); applyFilters({ end_date: e.target.value }); }} className="w-auto" />
                    </div>
                </FilterBar>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle>Top 10 - Kuantitas</CardTitle><CardDescription>Berdasarkan jumlah terjual</CardDescription></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(value: number) => formatNumber(value)} />
                                    <Bar dataKey="quantity" fill="#82ca9d" name="Kuantitas" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Top 10 - Pendapatan</CardTitle><CardDescription>Berdasarkan total pendapatan</CardDescription></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Bar dataKey="revenue" fill="#8884d8" name="Pendapatan" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader><CardTitle>Daftar Produk Terlaris</CardTitle><CardDescription>Semua produk berdasarkan penjualan</CardDescription></CardHeader>
                    <CardContent><DataTable columns={columns} data={topProducts} /></CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

