import { PageHeader } from '@/components/page-header';
import { PaymentMethodBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Branch, BreadcrumbItem, Product, Sale, SaleItem, User } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, FileText } from 'lucide-react';

interface SaleWithRelations extends Sale {
    branch: Branch;
    user: User;
    items: (SaleItem & { product: Product })[];
}

interface Props {
    sale: SaleWithRelations;
}

export default function SaleShow({ sale }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Penjualan', href: '/sales' },
        { title: sale.invoice_number, href: `/sales/${sale.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={sale.invoice_number} />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader title={sale.invoice_number} description="Detail penjualan">
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/sales">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Kembali
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <a href={`/sales/${sale.id}/invoice`} target="_blank">
                                <FileText className="mr-2 h-4 w-4" />
                                Cetak Invoice
                            </a>
                        </Button>
                    </div>
                </PageHeader>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Penjualan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">No. Invoice</span>
                                <span className="font-mono font-medium">{sale.invoice_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tanggal</span>
                                <span>{formatDateTime(sale.sale_date)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Cabang</span>
                                <span>{sale.branch.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Kasir</span>
                                <span>{sale.user.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Pembayaran</span>
                                <PaymentMethodBadge method={sale.payment_method} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Info Pelanggan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Nama</span>
                                <span>{sale.customer_name || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Telepon</span>
                                <span>{sale.customer_phone || '-'}</span>
                            </div>
                            {sale.notes && (
                                <div>
                                    <span className="text-muted-foreground">Catatan</span>
                                    <p className="mt-1">{sale.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Ringkasan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatCurrency(sale.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Diskon</span>
                                <span>-{formatCurrency(sale.discount)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-4 font-bold text-lg">
                                <span>Grand Total</span>
                                <span>{formatCurrency(sale.grand_total)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Item Penjualan</CardTitle>
                        <CardDescription>Daftar produk yang dibeli</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Produk</TableHead>
                                    <TableHead className="text-right">Harga</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sale.items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-mono">{item.product.sku}</TableCell>
                                        <TableCell>{item.product.name}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(item.subtotal)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

