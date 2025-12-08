import { DeleteDialog } from '@/components/confirm-dialog';
import { DataTable } from '@/components/data-table';
import { FilterBar } from '@/components/filter-bar';
import { PageHeader } from '@/components/page-header';
import { ActiveBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Category, PaginatedData } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface CategoryWithCount extends Category {
    products_count: number;
}

interface Props {
    categories: PaginatedData<CategoryWithCount>;
    filters: { search?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Kategori', href: '/categories' },
];

export default function CategoryIndex({ categories, filters }: Props) {
    const { can } = usePermissions();
    const [search, setSearch] = useState(filters.search ?? '');
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; category: CategoryWithCount | null }>({
        open: false,
        category: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/categories', { search: value }, { preserveState: true, preserveScroll: true });
    };

    const handleDelete = () => {
        if (!deleteDialog.category) return;
        setIsDeleting(true);
        router.delete(`/categories/${deleteDialog.category.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteDialog({ open: false, category: null });
            },
        });
    };

    const columns: ColumnDef<CategoryWithCount>[] = [
        {
            accessorKey: 'name',
            header: 'Nama Kategori',
            cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
        },
        {
            accessorKey: 'slug',
            header: 'Slug',
            cell: ({ row }) => <span className="font-mono text-sm text-muted-foreground">{row.original.slug}</span>,
        },
        {
            accessorKey: 'description',
            header: 'Deskripsi',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground line-clamp-1">{row.original.description || '-'}</span>
            ),
        },
        {
            accessorKey: 'products_count',
            header: 'Produk',
            cell: ({ row }) => row.original.products_count,
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
                            <Link href={`/categories/${row.original.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat
                            </Link>
                        </DropdownMenuItem>
                        {can('edit_category') && (
                            <DropdownMenuItem asChild>
                                <Link href={`/categories/${row.original.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </DropdownMenuItem>
                        )}
                        {can('delete_category') && (
                            <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeleteDialog({ open: true, category: row.original })}
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
            <Head title="Kategori" />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title="Kategori"
                    description="Kelola kategori produk"
                    action={can('create_category') ? { label: 'Tambah Kategori', href: '/categories/create' } : undefined}
                />

                <FilterBar
                    searchPlaceholder="Cari kategori..."
                    searchValue={search}
                    onSearchChange={handleSearch}
                    onClearFilters={() => handleSearch('')}
                />

                <DataTable
                    columns={columns}
                    data={categories.data}
                    pagination={{
                        pageIndex: categories.current_page,
                        pageSize: categories.per_page,
                        pageCount: categories.last_page,
                        onPageChange: (page) => router.get('/categories', { ...filters, page }, { preserveState: true }),
                    }}
                />
            </div>

            <DeleteDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
                onConfirm={handleDelete}
                isLoading={isDeleting}
                itemName={deleteDialog.category?.name}
            />
        </AppLayout>
    );
}

