import { DeleteDialog } from '@/components/confirm-dialog';
import { DataTable } from '@/components/data-table';
import { FilterBar } from '@/components/filter-bar';
import { PageHeader } from '@/components/page-header';
import { ActiveBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import type { Branch, BreadcrumbItem, PaginatedData, Role, User } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface UserWithRelations extends Omit<User, 'branch' | 'roles'> {
    branch: { id: number; name: string; code: string } | null;
    roles: Role[];
}

interface Props {
    users: PaginatedData<UserWithRelations>;
    branches: Branch[];
    roles: Role[];
    filters: { search?: string; branch_id?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Pengguna', href: '/users' },
];

export default function UserIndex({ users, branches, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [branchId, setBranchId] = useState(filters.branch_id ?? '');
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: UserWithRelations | null }>({
        open: false,
        user: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/users', { search: value, branch_id: branchId }, { preserveState: true, preserveScroll: true });
    };

    const handleBranchChange = (value: string) => {
        setBranchId(value);
        router.get('/users', { search, branch_id: value }, { preserveState: true, preserveScroll: true });
    };

    const handleClearFilters = () => {
        setSearch('');
        setBranchId('');
        router.get('/users', {}, { preserveState: true, preserveScroll: true });
    };

    const handleDelete = () => {
        if (!deleteDialog.user) return;
        setIsDeleting(true);
        router.delete(`/users/${deleteDialog.user.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteDialog({ open: false, user: null });
            },
        });
    };

    const columns: ColumnDef<UserWithRelations>[] = [
        {
            accessorKey: 'name',
            header: 'Nama',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-medium">
                        {row.original.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-medium">{row.original.name}</p>
                        <p className="text-sm text-muted-foreground">{row.original.email}</p>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'roles',
            header: 'Role',
            cell: ({ row }) => (
                <Badge variant={row.original.roles[0]?.name === 'super_admin' ? 'default' : 'secondary'}>
                    {row.original.roles[0]?.name === 'super_admin' ? 'Super Admin' : 'Admin Cabang'}
                </Badge>
            ),
        },
        {
            accessorKey: 'branch.name',
            header: 'Cabang',
            cell: ({ row }) => row.original.branch?.name || '-',
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
                            <Link href={`/users/${row.original.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/users/${row.original.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeleteDialog({ open: true, user: row.original })}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const branchOptions = branches.map((b) => ({ label: `${b.name} (${b.code})`, value: String(b.id) }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengguna" />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader title="Pengguna" description="Kelola data pengguna" action={{ label: 'Tambah Pengguna', href: '/users/create' }} />

                <FilterBar
                    searchPlaceholder="Cari pengguna..."
                    searchValue={search}
                    onSearchChange={handleSearch}
                    onClearFilters={handleClearFilters}
                    filters={[{ label: 'Cabang', value: branchId, options: branchOptions, onChange: handleBranchChange }]}
                />

                <DataTable
                    columns={columns}
                    data={users.data}
                    pagination={{
                        pageIndex: users.current_page,
                        pageSize: users.per_page,
                        pageCount: users.last_page,
                        onPageChange: (page) => router.get('/users', { ...filters, page }, { preserveState: true }),
                    }}
                />
            </div>

            <DeleteDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
                onConfirm={handleDelete}
                isLoading={isDeleting}
                itemName={deleteDialog.user?.name}
            />
        </AppLayout>
    );
}

