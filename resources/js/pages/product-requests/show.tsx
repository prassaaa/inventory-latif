import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { toast } from '@/lib/toast';
import { formatCurrency } from '@/lib/utils';
import type { BreadcrumbItem, ProductRequest } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CheckCircle, FileText, XCircle } from 'lucide-react';
import { useState } from 'react';

interface Props {
    productRequest: ProductRequest;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Request Produk', href: '/product-requests' },
    { title: 'Detail', href: '#' },
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

export default function ProductRequestShow({ productRequest }: Props) {
    const { can } = usePermissions();
    const [rejectDialog, setRejectDialog] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleApprove = () => {
        if (confirm('Apakah Anda yakin ingin menyetujui request ini? Produk akan ditambahkan ke katalog.')) {
            setIsSubmitting(true);
            router.post(`/product-requests/${productRequest.id}/approve`, {}, {
                onSuccess: () => {
                    toast.success('Request Berhasil Disetujui!', 'Produk telah ditambahkan ke katalog');
                },
                onError: (errors) => {
                    toast.error('Gagal Menyetujui Request', Object.values(errors)[0] as string);
                },
                onFinish: () => setIsSubmitting(false),
            });
        }
    };

    const handleReject = () => {
        if (!rejectionReason.trim()) {
            toast.error('Alasan Penolakan Wajib Diisi', 'Mohon isi alasan penolakan terlebih dahulu');
            return;
        }
        setIsSubmitting(true);
        router.post(`/product-requests/${productRequest.id}/reject`, {
            rejection_reason: rejectionReason,
        }, {
            onSuccess: () => {
                toast.success('Request Berhasil Ditolak', 'Request produk telah ditolak');
                setRejectDialog(false);
            },
            onError: (errors) => {
                toast.error('Gagal Menolak Request', Object.values(errors)[0] as string);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Request: ${productRequest.name}`} />

            <div className="flex flex-col gap-6 p-4">
                <PageHeader title={productRequest.name} description={`SKU: ${productRequest.sku}`}>
                    {can('approve_product_request') && productRequest.status === 'pending' && (
                        <>
                            <Button onClick={handleApprove} disabled={isSubmitting}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Setujui
                            </Button>
                            <Button variant="destructive" onClick={() => setRejectDialog(true)} disabled={isSubmitting}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Tolak
                            </Button>
                        </>
                    )}
                </PageHeader>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Informasi Produk
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {productRequest.image_url && (
                                <img
                                    src={productRequest.image_url}
                                    alt={productRequest.name}
                                    className="w-full rounded-lg object-cover aspect-square"
                                />
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Status</span>
                                {getStatusBadge(productRequest.status)}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Kategori</span>
                                <span>{productRequest.category?.name || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Harga</span>
                                <span className="font-semibold">{formatCurrency(productRequest.price)}</span>
                            </div>
                            {productRequest.color && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Warna</span>
                                    <span>{productRequest.color}</span>
                                </div>
                            )}
                            {productRequest.size && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Ukuran</span>
                                    <span>{productRequest.size}</span>
                                </div>
                            )}
                            {productRequest.description && (
                                <div>
                                    <span className="text-muted-foreground">Deskripsi</span>
                                    <p className="mt-1 text-sm">{productRequest.description}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Informasi Request</CardTitle>
                            <CardDescription>Detail pengajuan dan status approval</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label className="text-muted-foreground">Cabang</Label>
                                    <p className="mt-1 font-medium">{productRequest.branch?.name || '-'}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Diminta Oleh</Label>
                                    <p className="mt-1 font-medium">{productRequest.requested_by_user?.name || '-'}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Tanggal Request</Label>
                                    <p className="mt-1">{new Date(productRequest.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                                </div>
                                {productRequest.approved_by_user && (
                                    <div>
                                        <Label className="text-muted-foreground">Diproses Oleh</Label>
                                        <p className="mt-1 font-medium">{productRequest.approved_by_user.name}</p>
                                    </div>
                                )}
                                {productRequest.approved_at && (
                                    <div>
                                        <Label className="text-muted-foreground">Tanggal Diproses</Label>
                                        <p className="mt-1">{new Date(productRequest.approved_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                                    </div>
                                )}
                            </div>

                            {productRequest.request_notes && (
                                <div className="pt-4 border-t">
                                    <Label className="text-muted-foreground">Catatan Request</Label>
                                    <p className="mt-2 text-sm bg-muted p-3 rounded-md">{productRequest.request_notes}</p>
                                </div>
                            )}

                            {productRequest.rejection_reason && (
                                <div className="pt-4 border-t">
                                    <Label className="text-muted-foreground">Alasan Penolakan</Label>
                                    <p className="mt-2 text-sm bg-destructive/10 text-destructive p-3 rounded-md border border-destructive/20">
                                        {productRequest.rejection_reason}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Reject Dialog */}
            <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tolak Request Produk</DialogTitle>
                        <DialogDescription>
                            Berikan alasan penolakan untuk request produk ini
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="rejection_reason">Alasan Penolakan *</Label>
                            <Textarea
                                id="rejection_reason"
                                placeholder="Masukkan alasan penolakan..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialog(false)} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleReject} disabled={isSubmitting}>
                            Tolak Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

