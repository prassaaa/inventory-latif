import { DeleteDialog } from '@/components/confirm-dialog';
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
import { toast } from '@/lib/toast';
import { formatCurrency } from '@/lib/utils';
import type {
    BreadcrumbItem,
    Category,
    PaginatedData,
    Product,
    ProductImage,
} from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface ProductWithCategory
    extends Omit<Product, 'category' | 'creator' | 'images'> {
    category: { id: number; name: string } | null;
    creator?: { id: number; name: string } | null;
    images?: ProductImage[];
}

interface Props {
    products: PaginatedData<ProductWithCategory>;
    categories: Category[];
    filters: { search?: string; category_id?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Produk', href: '/products' },
];

export default function ProductIndex({ products, categories, filters }: Props) {
    const { can } = usePermissions();
    const [search, setSearch] = useState(filters.search ?? '');
    const [categoryId, setCategoryId] = useState(filters.category_id ?? '');
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        product: ProductWithCategory | null;
    }>({
        open: false,
        product: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(
            '/products',
            { search: value, category_id: categoryId },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleCategoryChange = (value: string) => {
        setCategoryId(value);
        router.get(
            '/products',
            { search, category_id: value },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleClearFilters = () => {
        setSearch('');
        setCategoryId('');
        router.get(
            '/products',
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleDelete = () => {
        if (!deleteDialog.product) return;
        setIsDeleting(true);
        const productName = deleteDialog.product.name;
        router.delete(`/products/${deleteDialog.product.id}`, {
            onSuccess: () => {
                toast.success(
                    'Produk Berhasil Dihapus!',
                    `Produk "${productName}" telah dihapus dari katalog`,
                );
                setDeleteDialog({ open: false, product: null });
            },
            onError: (errors) => {
                toast.error(
                    'Gagal Menghapus Produk',
                    Object.values(errors)[0] as string,
                );
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    const columns: ColumnDef<ProductWithCategory>[] = [
        {
            accessorKey: 'sku',
            header: 'SKU',
            cell: ({ row }) => (
                <span className="font-mono text-sm">{row.original.sku}</span>
            ),
        },
        {
            accessorKey: 'name',
            header: 'Nama Produk',
            cell: ({ row }) => {
                const primaryImage =
                    row.original.images?.find((img) => img.is_primary) ||
                    row.original.images?.[0];
                const thumbnailUrl =
                    primaryImage?.thumbnail_url || row.original.thumbnail_url;
                return (
                    <div className="flex items-center gap-3">
                        {thumbnailUrl ? (
                            <img
                                src={thumbnailUrl}
                                alt={row.original.name}
                                className="h-10 w-10 rounded object-cover"
                            />
                        ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                                No img
                            </div>
                        )}
                        <span className="font-medium">{row.original.name}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'category.name',
            header: 'Kategori',
            cell: ({ row }) => row.original.category?.name || '-',
        },
        {
            accessorKey: 'color',
            header: 'Warna',
            cell: ({ row }) => row.original.color || '-',
        },
        {
            accessorKey: 'price',
            header: 'Harga',
            cell: ({ row }) => formatCurrency(row.original.price),
        },
        {
            accessorKey: 'creator.name',
            header: 'Dibuat Oleh',
            cell: ({ row }) => row.original.creator?.name || '-',
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => (
                <ActiveBadge isActive={row.original.is_active} />
            ),
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
                            <Link href={`/products/${row.original.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat
                            </Link>
                        </DropdownMenuItem>
                        {can('edit_product') && (
                            <DropdownMenuItem asChild>
                                <Link
                                    href={`/products/${row.original.id}/edit`}
                                >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </DropdownMenuItem>
                        )}
                        {can('delete_product') && (
                            <DropdownMenuItem
                                className="text-red-600"
                                onClick={() =>
                                    setDeleteDialog({
                                        open: true,
                                        product: row.original,
                                    })
                                }
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

    const categoryOptions = categories.map((c) => ({
        label: c.name,
        value: String(c.id),
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Produk" />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title="Produk"
                    description="Kelola data produk"
                    action={
                        can('create_product')
                            ? {
                                  label: 'Tambah Produk',
                                  href: '/products/create',
                              }
                            : undefined
                    }
                />

                <FilterBar
                    searchPlaceholder="Cari produk..."
                    searchValue={search}
                    onSearchChange={handleSearch}
                    onClearFilters={handleClearFilters}
                    filters={[
                        {
                            label: 'Kategori',
                            value: categoryId,
                            options: categoryOptions,
                            onChange: handleCategoryChange,
                        },
                    ]}
                />

                <DataTable
                    columns={columns}
                    data={products.data}
                    pagination={{
                        pageIndex: products.current_page,
                        pageSize: products.per_page,
                        pageCount: products.last_page,
                        onPageChange: (page) =>
                            router.get(
                                '/products',
                                { ...filters, page },
                                { preserveState: true },
                            ),
                    }}
                />
            </div>

            <DeleteDialog
                open={deleteDialog.open}
                onOpenChange={(open) =>
                    setDeleteDialog({ ...deleteDialog, open })
                }
                onConfirm={handleDelete}
                isLoading={isDeleting}
                itemName={deleteDialog.product?.name}
            />
        </AppLayout>
    );
}
