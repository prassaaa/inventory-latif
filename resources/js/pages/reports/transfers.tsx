import { DataTable } from '@/components/data-table';
import { FilterBar } from '@/components/filter-bar';
import { PageHeader } from '@/components/page-header';
import { TransferStatusBadge } from '@/components/status-badge';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime, formatNumber } from '@/lib/utils';
import type { Branch, BreadcrumbItem, PaginatedData, Transfer } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowRight, Check, Clock, Download, Send, X } from 'lucide-react';
import { useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface TransferWithRelations extends Omit<Transfer, 'from_branch' | 'to_branch'> {
    from_branch: { id: number; name: string; code: string };
    to_branch: { id: number; name: string; code: string };
}

interface Props {
    transfers: PaginatedData<TransferWithRelations>;
    summaryByStatus: { status: string; count: number }[];
    branches: Branch[];
    filters: { branch_id?: string; status?: string; start_date?: string; end_date?: string };
    isSuperAdmin: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Laporan', href: '/reports/transfers' },
    { title: 'Transfer', href: '/reports/transfers' },
];

const STATUS_COLORS: Record<string, string> = { pending: '#FFBB28', approved: '#00C49F', rejected: '#FF8042', sent: '#0088FE', received: '#82ca9d' };
const STATUS_ICONS: Record<string, typeof Clock> = { pending: Clock, approved: Check, rejected: X, sent: Send, received: Check };

export default function TransfersReport({ transfers, summaryByStatus, branches, filters, isSuperAdmin }: Props) {
    const [branchId, setBranchId] = useState(filters.branch_id ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [startDate, setStartDate] = useState(filters.start_date ?? '');
    const [endDate, setEndDate] = useState(filters.end_date ?? '');

    const applyFilters = (newFilters: Partial<typeof filters>) => {
        const currentFilters = {
            branch_id: newFilters.branch_id !== undefined ? newFilters.branch_id : branchId,
            status: newFilters.status !== undefined ? newFilters.status : status,
            start_date: newFilters.start_date !== undefined ? newFilters.start_date : startDate,
            end_date: newFilters.end_date !== undefined ? newFilters.end_date : endDate
        };
        router.get('/reports/transfers', Object.fromEntries(Object.entries(currentFilters).filter(([, v]) => v)), { preserveState: true, preserveScroll: true });
    };

    const handleClearFilters = () => {
        setBranchId(''); setStatus(''); setStartDate(''); setEndDate('');
        router.get('/reports/transfers', {}, { preserveState: true, preserveScroll: true });
    };

    const handleExport = () => {
        const params = new URLSearchParams(Object.fromEntries(Object.entries({ branch_id: branchId, status, start_date: startDate, end_date: endDate }).filter(([, v]) => v)));
        window.open(`/reports/export/transfers?${params.toString()}`, '_blank');
    };

    const columns: ColumnDef<TransferWithRelations>[] = [
        { accessorKey: 'transfer_number', header: 'No. Transfer', cell: ({ row }) => <span className="font-mono font-medium">{row.original.transfer_number}</span> },
        { accessorKey: 'from_branch.name', header: 'Dari', cell: ({ row }) => row.original.from_branch.name },
        { id: 'arrow', cell: () => <ArrowRight className="h-4 w-4 text-muted-foreground" /> },
        { accessorKey: 'to_branch.name', header: 'Ke', cell: ({ row }) => row.original.to_branch.name },
        { accessorKey: 'status', header: 'Status', cell: ({ row }) => <TransferStatusBadge status={row.original.status} /> },
        { accessorKey: 'requested_at', header: 'Tanggal', cell: ({ row }) => formatDateTime(row.original.requested_at) },
    ];

    const branchOptions = branches.map((b) => ({ label: `${b.name} (${b.code})`, value: String(b.id) }));
    const statusOptions = [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Sent', value: 'sent' },
        { label: 'Received', value: 'received' },
    ];

    const pieData = summaryByStatus.map((s) => ({ name: s.status.charAt(0).toUpperCase() + s.status.slice(1), value: s.count, fill: STATUS_COLORS[s.status] || '#8884d8' }));
    const totalTransfers = summaryByStatus.reduce((sum, s) => sum + s.count, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Transfer" />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader title="Laporan Transfer" description="Analisis transfer stok antar cabang">
                    <Button onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export Excel</Button>
                </PageHeader>

                <FilterBar
                    onClearFilters={handleClearFilters}
                    filters={[
                        ...(isSuperAdmin ? [{ label: 'Cabang', value: branchId, options: branchOptions, onChange: (v: string) => { setBranchId(v); applyFilters({ branch_id: v }); } }] : []),
                        { label: 'Status', value: status, options: statusOptions, onChange: (v: string) => { setStatus(v); applyFilters({ status: v }); } },
                    ]}
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

                <div className="grid gap-4 md:grid-cols-5">
                    {summaryByStatus.map((s) => {
                        const Icon = STATUS_ICONS[s.status] || Clock;
                        return <StatCard key={s.status} title={s.status.charAt(0).toUpperCase() + s.status.slice(1)} value={formatNumber(s.count)} icon={Icon} />;
                    })}
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card>
                        <CardHeader><CardTitle>Distribusi Status</CardTitle><CardDescription>Total: {totalTransfers} transfer</CardDescription></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}>
                                        {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader><CardTitle>Daftar Transfer</CardTitle><CardDescription>Transfer terbaru</CardDescription></CardHeader>
                        <CardContent>
                            <DataTable
                                columns={columns}
                                data={transfers.data}
                                pagination={{
                                    pageIndex: transfers.current_page,
                                    pageSize: transfers.per_page,
                                    pageCount: transfers.last_page,
                                    onPageChange: (page) => router.get('/reports/transfers', { ...filters, page }, { preserveState: true }),
                                }}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

