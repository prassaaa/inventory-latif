import { DataTable } from '@/components/data-table';
import { FilterBar } from '@/components/filter-bar';
import { PageHeader } from '@/components/page-header';
import { LowStockBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { Branch, BranchStock, BreadcrumbItem, PaginatedData, Product } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { History, Plus } from 'lucide-react';
import { useState } from 'react';

interface StockWithRelations extends Omit<BranchStock, 'branch' | 'product'> {
    branch: { id: number; name: string; code: string };
    product: Product & { category: { id: number; name: string } | null };
}

interface Props {
    stocks: PaginatedData<StockWithRelations>;
    branches: Branch[];
    filters: { search?: string; branch_id?: string; low_stock?: boolean };
    isSuperAdmin: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Stok', href: '/stocks' },
];

export default function StockIndex({ stocks, branches, filters, isSuperAdmin }: Props) {
    const { can } = usePermissions();
    const [search, setSearch] = useState(filters.search ?? '');
    const [branchId, setBranchId] = useState(filters.branch_id ?? '');
    const [lowStock, setLowStock] = useState(filters.low_stock ?? false);

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/stocks', { search: value, branch_id: branchId, low_stock: lowStock || undefined }, { preserveState: true, preserveScroll: true });
    };

    const handleBranchChange = (value: string) => {
        setBranchId(value);
        router.get('/stocks', { search, branch_id: value, low_stock: lowStock || undefined }, { preserveState: true, preserveScroll: true });
    };

    const handleLowStockChange = (checked: boolean) => {
        setLowStock(checked);
        router.get('/stocks', { search, branch_id: branchId, low_stock: checked || undefined }, { preserveState: true, preserveScroll: true });
    };

    const handleClearFilters = () => {
        setSearch('');
        setBranchId('');
        setLowStock(false);
        router.get('/stocks', {}, { preserveState: true, preserveScroll: true });
    };

    const columns: ColumnDef<StockWithRelations>[] = [
        {
            accessorKey: 'product.sku',
            header: 'SKU',
            cell: ({ row }) => <span className="font-mono text-sm">{row.original.product.sku}</span>,
        },
        {
            accessorKey: 'product.name',
            header: 'Produk',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">{row.original.product.name}</p>
                    <p className="text-sm text-muted-foreground">{row.original.product.category?.name}</p>
                </div>
            ),
        },
        ...(isSuperAdmin ? [{
            accessorKey: 'branch.name',
            header: 'Cabang',
            cell: ({ row }: { row: { original: StockWithRelations } }) => (
                <span>{row.original.branch.name} ({row.original.branch.code})</span>
            ),
        }] : []),
        {
            accessorKey: 'quantity',
            header: 'Stok',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className={row.original.quantity <= row.original.min_stock ? 'text-red-600 font-semibold' : 'font-medium'}>
                        {formatNumber(row.original.quantity)}
                    </span>
                    {row.original.quantity <= row.original.min_stock && <LowStockBadge />}
                </div>
            ),
        },
        {
            accessorKey: 'min_stock',
            header: 'Min. Stok',
            cell: ({ row }) => formatNumber(row.original.min_stock),
        },
        {
            accessorKey: 'value',
            header: 'Nilai',
            cell: ({ row }) => formatCurrency(row.original.quantity * row.original.product.price),
        },
    ];

    const branchOptions = branches.map((b) => ({ label: `${b.name} (${b.code})`, value: String(b.id) }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stok" />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader title="Stok" description="Kelola stok produk per cabang">
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/stocks/movements">
                                <History className="mr-2 h-4 w-4" />
                                Riwayat
                            </Link>
                        </Button>
                        {can('adjust_stock') && (
                            <Button asChild>
                                <Link href="/stocks/adjust">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Adjust Stok
                                </Link>
                            </Button>
                        )}
                    </div>
                </PageHeader>

                <FilterBar
                    searchPlaceholder="Cari produk..."
                    searchValue={search}
                    onSearchChange={handleSearch}
                    onClearFilters={handleClearFilters}
                    filters={isSuperAdmin ? [{ label: 'Cabang', value: branchId, options: branchOptions, onChange: handleBranchChange }] : []}
                >
                    <div className="flex items-center gap-2">
                        <Checkbox id="low-stock" checked={lowStock} onCheckedChange={(checked) => handleLowStockChange(!!checked)} />
                        <label htmlFor="low-stock" className="text-sm cursor-pointer">Stok Rendah</label>
                    </div>
                </FilterBar>

                <DataTable
                    columns={columns}
                    data={stocks.data}
                    pagination={{
                        pageIndex: stocks.current_page,
                        pageSize: stocks.per_page,
                        pageCount: stocks.last_page,
                        onPageChange: (page) => router.get('/stocks', { ...filters, page }, { preserveState: true }),
                    }}
                />
            </div>
        </AppLayout>
    );
}

