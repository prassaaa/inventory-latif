import { DeleteDialog } from '@/components/confirm-dialog';
import { DataTable } from '@/components/data-table';
import { FilterBar } from '@/components/filter-bar';
import { PageHeader } from '@/components/page-header';
import { PaymentMethodBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Branch, BreadcrumbItem, PaginatedData, Sale, User } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, FileText, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface SaleWithRelations extends Omit<Sale, 'branch' | 'user'> {
    branch: { id: number; name: string; code: string };
    user: User;
}

interface Props {
    sales: PaginatedData<SaleWithRelations>;
    branches: Branch[];
    filters: { search?: string; branch_id?: string; start_date?: string; end_date?: string };
    isSuperAdmin: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Penjualan', href: '/sales' },
];

export default function SaleIndex({ sales, branches, filters, isSuperAdmin }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [branchId, setBranchId] = useState(filters.branch_id ?? '');
    const [startDate, setStartDate] = useState(filters.start_date ?? '');
    const [endDate, setEndDate] = useState(filters.end_date ?? '');
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; sale: SaleWithRelations | null }>({ open: false, sale: null });
    const [isDeleting, setIsDeleting] = useState(false);

    const applyFilters = (newFilters: Partial<typeof filters>) => {
        const allFilters = { search, branch_id: branchId, start_date: startDate, end_date: endDate, ...newFilters };
        router.get('/sales', Object.fromEntries(Object.entries(allFilters).filter(([, v]) => v)), { preserveState: true, preserveScroll: true });
    };

    const handleClearFilters = () => {
        setSearch(''); setBranchId(''); setStartDate(''); setEndDate('');
        router.get('/sales', {}, { preserveState: true, preserveScroll: true });
    };

    const handleDelete = () => {
        if (!deleteDialog.sale) return;
        setIsDeleting(true);
        router.delete(`/sales/${deleteDialog.sale.id}`, {
            onFinish: () => { setIsDeleting(false); setDeleteDialog({ open: false, sale: null }); },
        });
    };

    const isToday = (date: string) => new Date(date).toDateString() === new Date().toDateString();

    const columns: ColumnDef<SaleWithRelations>[] = [
        {
            accessorKey: 'invoice_number',
            header: 'No. Invoice',
            cell: ({ row }) => <span className="font-mono font-medium">{row.original.invoice_number}</span>,
        },
        {
            accessorKey: 'sale_date',
            header: 'Tanggal',
            cell: ({ row }) => formatDate(row.original.sale_date),
        },
        ...(isSuperAdmin ? [{
            accessorKey: 'branch.name',
            header: 'Cabang',
            cell: ({ row }: { row: { original: SaleWithRelations } }) => row.original.branch.name,
        }] : []),
        {
            accessorKey: 'customer_name',
            header: 'Pelanggan',
            cell: ({ row }) => row.original.customer_name || '-',
        },
        {
            accessorKey: 'grand_total',
            header: 'Total',
            cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.grand_total)}</span>,
        },
        {
            accessorKey: 'payment_method',
            header: 'Pembayaran',
            cell: ({ row }) => <PaymentMethodBadge method={row.original.payment_method} />,
        },
        {
            accessorKey: 'user.name',
            header: 'Kasir',
            cell: ({ row }) => row.original.user.name,
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild><Link href={`/sales/${row.original.id}`}><Eye className="mr-2 h-4 w-4" />Lihat Detail</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><a href={`/sales/${row.original.id}/invoice`} target="_blank"><FileText className="mr-2 h-4 w-4" />Cetak Invoice</a></DropdownMenuItem>
                        {isToday(row.original.sale_date) && (
                            <DropdownMenuItem className="text-red-600" onClick={() => setDeleteDialog({ open: true, sale: row.original })}>
                                <Trash2 className="mr-2 h-4 w-4" />Hapus
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const branchOptions = branches.map((b) => ({ label: `${b.name} (${b.code})`, value: String(b.id) }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Penjualan" />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader title="Penjualan" description="Kelola transaksi penjualan">
                    {!isSuperAdmin && (
                        <Button asChild><Link href="/sales/create"><Plus className="mr-2 h-4 w-4" />Buat Penjualan</Link></Button>
                    )}
                </PageHeader>

                <FilterBar
                    searchPlaceholder="Cari invoice/pelanggan..."
                    searchValue={search}
                    onSearchChange={(v) => { setSearch(v); applyFilters({ search: v }); }}
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

                <DataTable
                    columns={columns}
                    data={sales.data}
                    pagination={{
                        pageIndex: sales.current_page,
                        pageSize: sales.per_page,
                        pageCount: sales.last_page,
                        onPageChange: (page) => router.get('/sales', { ...filters, page }, { preserveState: true }),
                    }}
                />
            </div>

            <DeleteDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })} onConfirm={handleDelete} isLoading={isDeleting} itemName={deleteDialog.sale?.invoice_number} />
        </AppLayout>
    );
}

