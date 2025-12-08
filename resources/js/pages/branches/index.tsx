import { DataTable } from '@/components/data-table';
import { FilterBar } from '@/components/filter-bar';
import { PageHeader } from '@/components/page-header';
import { ActiveBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import type { Branch, BreadcrumbItem, PaginatedData } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DeleteDialog } from '@/components/confirm-dialog';

interface BranchWithCounts extends Branch {
    users_count: number;
    stocks_count: number;
}

interface Props {
    branches: PaginatedData<BranchWithCounts>;
    filters: {
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Cabang', href: '/branches' },
];

export default function BranchIndex({ branches, filters }: Props) {
    const { can } = usePermissions();
    const [search, setSearch] = useState(filters.search ?? '');
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; branch: BranchWithCounts | null }>({
        open: false,
        branch: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/branches', { search: value }, { preserveState: true, preserveScroll: true });
    };

    const handleDelete = () => {
        if (!deleteDialog.branch) return;
        setIsDeleting(true);
        router.delete(`/branches/${deleteDialog.branch.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteDialog({ open: false, branch: null });
            },
        });
    };

    const columns: ColumnDef<BranchWithCounts>[] = [
        {
            accessorKey: 'code',
            header: 'Kode',
            cell: ({ row }) => <span className="font-mono font-medium">{row.original.code}</span>,
        },
        {
            accessorKey: 'name',
            header: 'Nama Cabang',
        },
        {
            accessorKey: 'pic_name',
            header: 'PIC',
            cell: ({ row }) => row.original.pic_name || '-',
        },
        {
            accessorKey: 'phone',
            header: 'Telepon',
            cell: ({ row }) => row.original.phone || '-',
        },
        {
            accessorKey: 'users_count',
            header: 'Pengguna',
            cell: ({ row }) => row.original.users_count,
        },
        {
            accessorKey: 'stocks_count',
            header: 'Produk',
            cell: ({ row }) => row.original.stocks_count,
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => <ActiveBadge isActive={row.original.is_active} />,
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
                            <Link href={`/branches/${row.original.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat
                            </Link>
                        </DropdownMenuItem>
                        {can('edit_branch') && (
                            <DropdownMenuItem asChild>
                                <Link href={`/branches/${row.original.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </DropdownMenuItem>
                        )}
                        {can('delete_branch') && (
                            <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeleteDialog({ open: true, branch: row.original })}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cabang" />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title="Cabang"
                    description="Kelola data cabang toko"
                    action={can('create_branch') ? { label: 'Tambah Cabang', href: '/branches/create' } : undefined}
                />

                <FilterBar
                    searchPlaceholder="Cari cabang..."
                    searchValue={search}
                    onSearchChange={handleSearch}
                    onClearFilters={() => handleSearch('')}
                />

                <DataTable
                    columns={columns}
                    data={branches.data}
                    pagination={{
                        pageIndex: branches.current_page,
                        pageSize: branches.per_page,
                        pageCount: branches.last_page,
                        onPageChange: (page) => router.get('/branches', { ...filters, page }, { preserveState: true }),
                    }}
                />
            </div>

            <DeleteDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
                onConfirm={handleDelete}
                isLoading={isDeleting}
                itemName={deleteDialog.branch?.name}
            />
        </AppLayout>
    );
}

