import { PageHeader } from '@/components/page-header';
import { ActiveBadge, LowStockBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type {
    Branch,
    BranchStock,
    BreadcrumbItem,
    Category,
    Product,
    ProductImage,
    User,
} from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Package, Pencil } from 'lucide-react';

interface ProductWithRelations
    extends Omit<
        Product,
        'category' | 'branch_stocks' | 'creator' | 'updater' | 'images'
    > {
    category: Category | null;
    branch_stocks: (BranchStock & { branch: Branch })[];
    creator?: Pick<User, 'id' | 'name'> | null;
    updater?: Pick<User, 'id' | 'name'> | null;
    images?: ProductImage[];
}

interface Props {
    product: ProductWithRelations;
}

export default function ProductShow({ product }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Produk', href: '/products' },
        { title: product.name, href: `/products/${product.id}` },
    ];

    const totalStock = product.branch_stocks.reduce(
        (sum, s) => sum + s.quantity,
        0,
    );
    const totalValue = totalStock * product.price;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={product.name} />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title={product.name}
                    description={`SKU: ${product.sku}`}
                >
                    <Button asChild>
                        <Link href={`/products/${product.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                </PageHeader>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Product Image & Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Detail Produk
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Image Gallery */}
                            {product.images && product.images.length > 0 ? (
                                <div className="space-y-2">
                                    <img
                                        src={
                                            product.images.find(
                                                (img) => img.is_primary,
                                            )?.image_url ||
                                            product.images[0]?.image_url
                                        }
                                        alt={product.name}
                                        className="aspect-square w-full rounded-lg object-cover"
                                    />
                                    {product.images.length > 1 && (
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {product.images.map((img) => (
                                                <img
                                                    key={img.id}
                                                    src={img.thumbnail_url}
                                                    alt="Product"
                                                    className={`h-16 w-16 flex-shrink-0 rounded object-cover ${img.is_primary ? 'ring-2 ring-primary' : ''}`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : product.image_url ? (
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="aspect-square w-full rounded-lg object-cover"
                                />
                            ) : null}
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                    Status
                                </span>
                                <ActiveBadge isActive={product.is_active} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                    Kategori
                                </span>
                                <span>{product.category?.name || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                    Harga
                                </span>
                                <span className="font-semibold">
                                    {formatCurrency(product.price)}
                                </span>
                            </div>
                            {product.color && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        Warna
                                    </span>
                                    <span>{product.color}</span>
                                </div>
                            )}
                            {product.size && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        Ukuran
                                    </span>
                                    <span>{product.size}</span>
                                </div>
                            )}
                            {product.description && (
                                <div>
                                    <span className="text-muted-foreground">
                                        Deskripsi
                                    </span>
                                    <p className="mt-1 text-sm">
                                        {product.description}
                                    </p>
                                </div>
                            )}
                            <div className="mt-4 border-t pt-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        Dibuat Oleh
                                    </span>
                                    <span>{product.creator?.name || '-'}</span>
                                </div>
                                {product.updater && (
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-muted-foreground">
                                            Diupdate Oleh
                                        </span>
                                        <span>{product.updater.name}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stock Summary */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Stok per Cabang</CardTitle>
                            <CardDescription>
                                Total: {formatNumber(totalStock)} unit | Nilai:{' '}
                                {formatCurrency(totalValue)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {product.branch_stocks.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cabang</TableHead>
                                            <TableHead className="text-right">
                                                Stok
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Min. Stok
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Nilai
                                            </TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {product.branch_stocks.map((stock) => (
                                            <TableRow key={stock.id}>
                                                <TableCell>
                                                    <Link
                                                        href={`/branches/${stock.branch.id}`}
                                                        className="font-medium hover:underline"
                                                    >
                                                        {stock.branch.name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatNumber(
                                                        stock.quantity,
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {stock.min_stock}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(
                                                        stock.quantity *
                                                            product.price,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {stock.quantity <=
                                                        stock.min_stock && (
                                                        <LowStockBadge />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="py-8 text-center text-muted-foreground">
                                    Belum ada stok di cabang manapun
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
