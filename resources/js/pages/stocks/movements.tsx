import { DataTable } from '@/components/data-table';
import { FilterBar } from '@/components/filter-bar';
import { PageHeader } from '@/components/page-header';
import { StockMovementBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime, formatNumber, stockReferenceLabels } from '@/lib/utils';
import type { Branch, BreadcrumbItem, PaginatedData, Product, StockMovement, User } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

interface MovementWithRelations extends Omit<StockMovement, 'branch' | 'product' | 'created_by'> {
    branch: { id: number; name: string; code: string };
    product: Product;
    created_by: User | null;
}

interface Props {
    movements: PaginatedData<MovementWithRelations>;
    branches: Branch[];
    filters: { branch_id?: string; type?: string; reference_type?: string; start_date?: string; end_date?: string };
    isSuperAdmin: boolean;
    movementTypes: { value: string; label: string }[];
    referenceTypes: { value: string; label: string }[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Stok', href: '/stocks' },
    { title: 'Riwayat', href: '/stocks/movements' },
];

export default function StockMovements({ movements, branches, filters, isSuperAdmin, movementTypes, referenceTypes }: Props) {
    const [branchId, setBranchId] = useState(filters.branch_id ?? '');
    const [type, setType] = useState(filters.type ?? '');
    const [refType, setRefType] = useState(filters.reference_type ?? '');
    const [startDate, setStartDate] = useState(filters.start_date ?? '');
    const [endDate, setEndDate] = useState(filters.end_date ?? '');

    const applyFilters = (newFilters: Partial<typeof filters>) => {
        const allFilters = { branch_id: branchId, type, reference_type: refType, start_date: startDate, end_date: endDate, ...newFilters };
        router.get('/stocks/movements', Object.fromEntries(Object.entries(allFilters).filter(([, v]) => v)), { preserveState: true, preserveScroll: true });
    };

    const handleClearFilters = () => {
        setBranchId('');
        setType('');
        setRefType('');
        setStartDate('');
        setEndDate('');
        router.get('/stocks/movements', {}, { preserveState: true, preserveScroll: true });
    };

    const columns: ColumnDef<MovementWithRelations>[] = [
        {
            accessorKey: 'created_at',
            header: 'Tanggal',
            cell: ({ row }) => formatDateTime(row.original.created_at),
        },
        {
            accessorKey: 'product.name',
            header: 'Produk',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">{row.original.product.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">{row.original.product.sku}</p>
                </div>
            ),
        },
        ...(isSuperAdmin ? [{
            accessorKey: 'branch.name',
            header: 'Cabang',
            cell: ({ row }: { row: { original: MovementWithRelations } }) => row.original.branch.name,
        }] : []),
        {
            accessorKey: 'type',
            header: 'Tipe',
            cell: ({ row }) => <StockMovementBadge type={row.original.type} />,
        },
        {
            accessorKey: 'reference_type',
            header: 'Referensi',
            cell: ({ row }) => (
                <Badge variant="outline">{stockReferenceLabels[row.original.reference_type] || row.original.reference_type}</Badge>
            ),
        },
        {
            accessorKey: 'quantity',
            header: 'Qty',
            cell: ({ row }) => (
                <span className={row.original.type === 'in' ? 'text-green-600' : 'text-red-600'}>
                    {row.original.type === 'in' ? '+' : '-'}{formatNumber(row.original.quantity)}
                </span>
            ),
        },
        {
            accessorKey: 'stock_before',
            header: 'Sebelum',
            cell: ({ row }) => formatNumber(row.original.stock_before),
        },
        {
            accessorKey: 'stock_after',
            header: 'Sesudah',
            cell: ({ row }) => formatNumber(row.original.stock_after),
        },
        {
            accessorKey: 'created_by.name',
            header: 'Oleh',
            cell: ({ row }) => row.original.created_by?.name || '-',
        },
    ];

    const branchOptions = branches.map((b) => ({ label: `${b.name} (${b.code})`, value: String(b.id) }));
    const typeOptions = movementTypes.map((t) => ({ label: t.label, value: t.value }));
    const refTypeOptions = referenceTypes.map((r) => ({ label: r.label, value: r.value }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Riwayat Stok" />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader title="Riwayat Pergerakan Stok" description="Lihat semua pergerakan stok">
                    <Button variant="outline" asChild>
                        <Link href="/stocks">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                </PageHeader>

                <FilterBar
                    onClearFilters={handleClearFilters}
                    filters={[
                        ...(isSuperAdmin ? [{ label: 'Cabang', value: branchId, options: branchOptions, onChange: (v: string) => { setBranchId(v); applyFilters({ branch_id: v }); } }] : []),
                        { label: 'Tipe', value: type, options: typeOptions, onChange: (v: string) => { setType(v); applyFilters({ type: v }); } },
                        { label: 'Referensi', value: refType, options: refTypeOptions, onChange: (v: string) => { setRefType(v); applyFilters({ reference_type: v }); } },
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

                <DataTable
                    columns={columns}
                    data={movements.data}
                    pagination={{
                        pageIndex: movements.current_page,
                        pageSize: movements.per_page,
                        pageCount: movements.last_page,
                        onPageChange: (page) => router.get('/stocks/movements', { ...filters, page }, { preserveState: true }),
                    }}
                />
            </div>
        </AppLayout>
    );
}

