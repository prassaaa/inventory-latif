import { FilterBar } from '@/components/filter-bar';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { Branch, BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Download, DollarSign, Receipt, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Props {
    summary: { total_sales: number; total_transactions: number; average_sale: number };
    dailySales: { date: string; total: number; count: number }[];
    salesByBranch: { branch_name: string; total: number; count: number }[];
    branches: Branch[];
    filters: { branch_id?: string; start_date?: string; end_date?: string };
    isSuperAdmin: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan', href: '/reports/sales' },
    { title: 'Penjualan', href: '/reports/sales' },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function SalesReport({ summary, dailySales, salesByBranch, branches, filters, isSuperAdmin }: Props) {
    const [branchId, setBranchId] = useState(filters.branch_id ?? '');
    const [startDate, setStartDate] = useState(filters.start_date ?? '');
    const [endDate, setEndDate] = useState(filters.end_date ?? '');

    const applyFilters = (newFilters: Partial<typeof filters>) => {
        const allFilters = { branch_id: branchId, start_date: startDate, end_date: endDate, ...newFilters };
        router.get('/reports/sales', Object.fromEntries(Object.entries(allFilters).filter(([, v]) => v)), { preserveState: true, preserveScroll: true });
    };

    const handleClearFilters = () => {
        setBranchId(''); setStartDate(''); setEndDate('');
        router.get('/reports/sales', {}, { preserveState: true, preserveScroll: true });
    };

    const handleExport = () => {
        const params = new URLSearchParams(Object.fromEntries(Object.entries({ branch_id: branchId, start_date: startDate, end_date: endDate }).filter(([, v]) => v)));
        window.open(`/reports/export/sales?${params.toString()}`, '_blank');
    };

    const branchOptions = branches.map((b) => ({ label: `${b.name} (${b.code})`, value: String(b.id) }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Penjualan" />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader title="Laporan Penjualan" description="Analisis penjualan berdasarkan periode">
                    <Button onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export Excel</Button>
                </PageHeader>

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

                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard title="Total Penjualan" value={formatCurrency(summary.total_sales)} icon={DollarSign} />
                    <StatCard title="Jumlah Transaksi" value={formatNumber(summary.total_transactions)} icon={Receipt} />
                    <StatCard title="Rata-rata per Transaksi" value={formatCurrency(summary.average_sale)} icon={TrendingUp} />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle>Penjualan Harian</CardTitle><CardDescription>Grafik penjualan per hari</CardDescription></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={dailySales}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                    <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Bar dataKey="total" fill="#8884d8" name="Total" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {isSuperAdmin && salesByBranch.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>Penjualan per Cabang</CardTitle><CardDescription>Distribusi penjualan antar cabang</CardDescription></CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie data={salesByBranch} dataKey="total" nameKey="branch_name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}>
                                            {salesByBranch.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

