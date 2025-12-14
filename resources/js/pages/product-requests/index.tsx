import { DataTable } from '@/components/data-table';
import { FilterBar } from '@/components/filter-bar';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { toast } from '@/lib/toast';
import { formatCurrency } from '@/lib/utils';
import type { BreadcrumbItem, PaginatedData, ProductRequest } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { CheckCircle, Eye, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

interface ProductRequestWithRelations extends Omit<ProductRequest, 'branch' | 'category' | 'requested_by_user' | 'approved_by_user'> {
    branch?: { id: number; name: string; code: string };
    requested_by_user?: { id: number; name: string };
    approved_by_user?: { id: number; name: string };
    category?: { id: number; name: string };
}

interface Props {
    productRequests: PaginatedData<ProductRequestWithRelations>;
    filters: { search?: string; status?: string; branch_id?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Request Produk', href: '/product-requests' },
];

const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
        pending: { variant: 'outline', label: 'Menunggu Approval' },
        approved: { variant: 'default', label: 'Disetujui' },
        rejected: { variant: 'destructive', label: 'Ditolak' },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function ProductRequestIndex({ productRequests, filters }: Props) {
    const { can, isSuperAdmin } = usePermissions();
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/product-requests', { search: value }, { preserveState: true, preserveScroll: true });
    };

    const handleClearFilters = () => {
        setSearch('');
        router.get('/product-requests', {}, { preserveState: true, preserveScroll: true });
    };

    const handleApprove = (id: number, name: string) => {
        if (confirm(`Apakah Anda yakin ingin menyetujui request "${name}"? Produk akan ditambahkan ke katalog.`)) {
            router.post(`/product-requests/${id}/approve`, {}, {
                onSuccess: () => {
                    toast.success('Request Berhasil Disetujui!', `Produk "${name}" telah ditambahkan ke katalog`);
                },
                onError: (errors) => {
                    toast.error('Gagal Menyetujui Request', Object.values(errors)[0] as string);
                },
            });
        }
    };

    const columns: ColumnDef<ProductRequestWithRelations>[] = [
        {
            accessorKey: 'sku',
            header: 'SKU',
            cell: ({ row }) => <span className="font-mono text-sm">{row.original.sku}</span>,
        },
        {
            accessorKey: 'name',
            header: 'Nama Produk',
        },
        {
            accessorKey: 'category',
            header: 'Kategori',
            cell: ({ row }) => row.original.category?.name || '-',
        },
        {
            accessorKey: 'price',
            header: 'Harga',
            cell: ({ row }) => formatCurrency(row.original.price),
        },
        {
            accessorKey: 'branch',
            header: 'Cabang',
            cell: ({ row }) => row.original.branch?.name || '-',
        },
        {
            accessorKey: 'requested_by_user',
            header: 'Diminta Oleh',
            cell: ({ row }) => row.original.requested_by_user?.name || '-',
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => getStatusBadge(row.original.status),
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/product-requests/${row.original.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Detail
                            </Link>
                        </DropdownMenuItem>
                        {can('approve_product_request') && row.original.status === 'pending' && (
                            <DropdownMenuItem
                                onClick={() => handleApprove(row.original.id, row.original.name)}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Setujui
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Request Produk" />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title="Request Produk"
                    description="Kelola request produk baru dari cabang"
                    action={can('create_product_request') && !isSuperAdmin ? { label: 'Request Produk Baru', href: '/product-requests/create' } : undefined}
                />

                <FilterBar
                    searchValue={search}
                    searchPlaceholder="Cari SKU atau nama produk..."
                    onSearchChange={handleSearch}
                    onClearFilters={handleClearFilters}
                />

                <DataTable
                    columns={columns}
                    data={productRequests.data}
                    pagination={{
                        pageIndex: productRequests.current_page - 1,
                        pageSize: productRequests.per_page,
                        pageCount: productRequests.last_page,
                        onPageChange: (page: number) => {
                            router.get('/product-requests', { search, page: page + 1 }, { preserveState: true, preserveScroll: true });
                        },
                    }}
                />
            </div>
        </AppLayout>
    );
}

