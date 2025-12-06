import { PageHeader } from '@/components/page-header';
import { ActiveBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { Branch, BranchStock, BreadcrumbItem, User } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Building2, MapPin, Pencil, Phone, User as UserIcon } from 'lucide-react';

interface BranchWithRelations extends Branch {
    users: User[];
    stocks: (BranchStock & { product: { id: number; name: string; sku: string; price: number } })[];
}

interface Props {
    branch: BranchWithRelations;
}

export default function BranchShow({ branch }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Cabang', href: '/branches' },
        { title: branch.name, href: `/branches/${branch.id}` },
    ];

    const totalStockValue = branch.stocks.reduce((sum, stock) => sum + stock.quantity * stock.product.price, 0);
    const totalStockQty = branch.stocks.reduce((sum, stock) => sum + stock.quantity, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={branch.name} />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader title={branch.name} description={`Detail cabang ${branch.code}`}>
                    <Button asChild>
                        <Link href={`/branches/${branch.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                </PageHeader>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Branch Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Informasi Cabang
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <ActiveBadge isActive={branch.is_active} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Kode</span>
                                <span className="font-mono font-medium">{branch.code}</span>
                            </div>
                            {branch.pic_name && (
                                <div className="flex items-start gap-2">
                                    <UserIcon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                    <span>{branch.pic_name}</span>
                                </div>
                            )}
                            {branch.phone && (
                                <div className="flex items-start gap-2">
                                    <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                    <span>{branch.phone}</span>
                                </div>
                            )}
                            {branch.address && (
                                <div className="flex items-start gap-2">
                                    <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{branch.address}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stock Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Ringkasan Stok</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Total Produk</span>
                                <span className="font-medium">{branch.stocks.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Total Unit</span>
                                <span className="font-medium">{formatNumber(totalStockQty)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Nilai Stok</span>
                                <span className="font-medium">{formatCurrency(totalStockValue)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Users */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pengguna ({branch.users.length})</CardTitle>
                            <CardDescription>Admin yang terdaftar di cabang ini</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {branch.users.length > 0 ? (
                                <ul className="space-y-2">
                                    {branch.users.map((user) => (
                                        <li key={user.id} className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">Belum ada pengguna</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Stock List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Stok</CardTitle>
                        <CardDescription>Produk yang tersedia di cabang ini</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {branch.stocks.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Produk</TableHead>
                                        <TableHead className="text-right">Harga</TableHead>
                                        <TableHead className="text-right">Stok</TableHead>
                                        <TableHead className="text-right">Min. Stok</TableHead>
                                        <TableHead className="text-right">Nilai</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {branch.stocks.map((stock) => (
                                        <TableRow key={stock.id}>
                                            <TableCell className="font-mono text-sm">{stock.product.sku}</TableCell>
                                            <TableCell>{stock.product.name}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(stock.product.price)}</TableCell>
                                            <TableCell className="text-right">
                                                <span className={stock.quantity <= stock.min_stock ? 'text-red-600 font-semibold' : ''}>
                                                    {stock.quantity}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">{stock.min_stock}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(stock.quantity * stock.product.price)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">Belum ada stok di cabang ini</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

