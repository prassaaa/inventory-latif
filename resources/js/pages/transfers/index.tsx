import { DeleteDialog } from '@/components/confirm-dialog';
import { DataTable } from '@/components/data-table';
import { FilterBar } from '@/components/filter-bar';
import { PageHeader } from '@/components/page-header';
import { TransferStatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime } from '@/lib/utils';
import type { Branch, BreadcrumbItem, PaginatedData, Transfer, User } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowRight, Eye, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface TransferWithRelations extends Omit<Transfer, 'from_branch' | 'to_branch' | 'requested_by' | 'approved_by'> {
    from_branch: { id: number; name: string; code: string };
    to_branch: { id: number; name: string; code: string };
    requested_by: User | null;
    approved_by: User | null;
}

interface Props {
    transfers: PaginatedData<TransferWithRelations>;
    branches: Branch[];
    filters: { branch_id?: string; status?: string };
    isSuperAdmin: boolean;
    statuses: { value: string; label: string }[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Transfer', href: '/transfers' },
];

export default function TransferIndex({ transfers, branches, filters, isSuperAdmin, statuses }: Props) {
    const [branchId, setBranchId] = useState(filters.branch_id ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; transfer: TransferWithRelations | null }>({
        open: false,
        transfer: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);

    const handleBranchChange = (value: string) => {
        setBranchId(value);
        router.get('/transfers', { branch_id: value, status }, { preserveState: true, preserveScroll: true });
    };

    const handleStatusChange = (value: string) => {
        setStatus(value);
        router.get('/transfers', { branch_id: branchId, status: value }, { preserveState: true, preserveScroll: true });
    };

    const handleClearFilters = () => {
        setBranchId('');
        setStatus('');
        router.get('/transfers', {}, { preserveState: true, preserveScroll: true });
    };

    const handleDelete = () => {
        if (!deleteDialog.transfer) return;
        setIsDeleting(true);
        router.delete(`/transfers/${deleteDialog.transfer.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteDialog({ open: false, transfer: null });
            },
        });
    };

    const columns: ColumnDef<TransferWithRelations>[] = [
        {
            accessorKey: 'transfer_number',
            header: 'No. Transfer',
            cell: ({ row }) => <span className="font-mono font-medium">{row.original.transfer_number}</span>,
        },
        {
            accessorKey: 'from_branch.name',
            header: 'Dari',
            cell: ({ row }) => row.original.from_branch.name,
        },
        {
            id: 'arrow',
            cell: () => <ArrowRight className="h-4 w-4 text-muted-foreground" />,
        },
        {
            accessorKey: 'to_branch.name',
            header: 'Ke',
            cell: ({ row }) => row.original.to_branch.name,
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <TransferStatusBadge status={row.original.status} />,
        },
        {
            accessorKey: 'requested_at',
            header: 'Tanggal Request',
            cell: ({ row }) => formatDateTime(row.original.requested_at),
        },
        {
            accessorKey: 'requested_by.name',
            header: 'Oleh',
            cell: ({ row }) => row.original.requested_by?.name || '-',
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
                            <Link href={`/transfers/${row.original.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Detail
                            </Link>
                        </DropdownMenuItem>
                        {['draft', 'pending'].includes(row.original.status) && (
                            <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeleteDialog({ open: true, transfer: row.original })}
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

    const branchOptions = branches.map((b) => ({ label: `${b.name} (${b.code})`, value: String(b.id) }));
    const statusOptions = statuses.map((s) => ({ label: s.label, value: s.value }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transfer" />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader title="Transfer Stok" description="Kelola transfer stok antar cabang">
                    <Button asChild>
                        <Link href="/transfers/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Buat Transfer
                        </Link>
                    </Button>
                </PageHeader>

                <FilterBar
                    onClearFilters={handleClearFilters}
                    filters={[
                        ...(isSuperAdmin ? [{ label: 'Cabang', value: branchId, options: branchOptions, onChange: handleBranchChange }] : []),
                        { label: 'Status', value: status, options: statusOptions, onChange: handleStatusChange },
                    ]}
                />

                <DataTable
                    columns={columns}
                    data={transfers.data}
                    pagination={{
                        pageIndex: transfers.current_page,
                        pageSize: transfers.per_page,
                        pageCount: transfers.last_page,
                        onPageChange: (page) => router.get('/transfers', { ...filters, page }, { preserveState: true }),
                    }}
                />
            </div>

            <DeleteDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
                onConfirm={handleDelete}
                isLoading={isDeleting}
                itemName={deleteDialog.transfer?.transfer_number}
            />
        </AppLayout>
    );
}

