import { PageHeader } from '@/components/page-header';
import { ActiveBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import type { BreadcrumbItem, Category, Product } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { FolderTree, Pencil } from 'lucide-react';

interface CategoryWithProducts extends Category {
    products: Product[];
}

interface Props {
    category: CategoryWithProducts;
}

export default function CategoryShow({ category }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Kategori', href: '/categories' },
        { title: category.name, href: `/categories/${category.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={category.name} />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader title={category.name} description={`Detail kategori ${category.slug}`}>
                    <Button asChild>
                        <Link href={`/categories/${category.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                </PageHeader>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Category Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FolderTree className="h-5 w-5" />
                                Informasi Kategori
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <ActiveBadge isActive={category.is_active} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Slug</span>
                                <span className="font-mono text-sm">{category.slug}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Total Produk</span>
                                <span className="font-medium">{category.products.length}</span>
                            </div>
                            {category.description && (
                                <div>
                                    <span className="text-muted-foreground">Deskripsi</span>
                                    <p className="mt-1 text-sm">{category.description}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Products List */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Produk dalam Kategori</CardTitle>
                            <CardDescription>Daftar produk yang termasuk dalam kategori ini</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {category.products.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Nama Produk</TableHead>
                                            <TableHead>Warna</TableHead>
                                            <TableHead className="text-right">Harga</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {category.products.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                                                <TableCell>
                                                    <Link
                                                        href={`/products/${product.id}`}
                                                        className="font-medium hover:underline"
                                                    >
                                                        {product.name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>{product.color || '-'}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                                                <TableCell>
                                                    <ActiveBadge isActive={product.is_active} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">
                                    Belum ada produk dalam kategori ini
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

