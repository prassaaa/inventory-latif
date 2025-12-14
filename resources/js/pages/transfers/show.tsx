import { ConfirmDialog } from '@/components/confirm-dialog';
import { PageHeader } from '@/components/page-header';
import { TransferStatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { toast } from '@/lib/toast';
import { cn, formatDateTime } from '@/lib/utils';
import type { Branch, BreadcrumbItem, Product, Transfer, TransferItem, User } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ArrowRight, Check, FileText, Send, X } from 'lucide-react';
import { useState } from 'react';

interface TransferWithRelations extends Omit<Transfer, 'from_branch' | 'to_branch' | 'requested_by' | 'approved_by' | 'items'> {
    from_branch: Branch;
    to_branch: Branch;
    requested_by: User | null;
    approved_by: User | null;
    items: (TransferItem & { product: Product })[];
}

interface Props {
    transfer: TransferWithRelations;
    userBranch: Branch | null;
    isSuperAdmin: boolean;
}

export default function TransferShow({ transfer, userBranch, isSuperAdmin }: Props) {
    const { can } = usePermissions();
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [showSendDialog, setShowSendDialog] = useState(false);
    const [showReceiveDialog, setShowReceiveDialog] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [sendItems, setSendItems] = useState(transfer.items.map((i) => ({ id: i.id, quantity_sent: i.quantity_requested })));
    const [receiveItems, setReceiveItems] = useState(transfer.items.map((i) => ({ id: i.id, quantity_received: i.quantity_sent || 0 })));
    const [isLoading, setIsLoading] = useState(false);

    // Helper function to get row styling based on quantity comparison
    const getQuantityStatus = (requested: number, actual: number | null) => {
        if (actual === null) return null;

        const diff = actual - requested;

        if (diff === 0) {
            return {
                bgClass: 'bg-green-50 hover:bg-green-100',
                badge: <Badge variant="default" className="bg-green-600 text-white">✓ Sesuai</Badge>,
            };
        } else if (diff < 0) {
            return {
                bgClass: 'bg-yellow-50 hover:bg-yellow-100',
                badge: <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">⚠️ Kurang {Math.abs(diff)}</Badge>,
            };
        } else {
            return {
                bgClass: 'bg-blue-50 hover:bg-blue-100',
                badge: <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">+ Lebih {diff}</Badge>,
            };
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Transfer', href: '/transfers' },
        { title: transfer.transfer_number, href: `/transfers/${transfer.id}` },
    ];

    const handleApprove = () => {
        setIsLoading(true);
        router.post(`/transfers/${transfer.id}/approve`, {}, {
            onSuccess: () => {
                toast.success('Transfer Berhasil Disetujui!', `Transfer ${transfer.transfer_number} telah disetujui`);
                setShowApproveDialog(false);
            },
            onError: (errors) => {
                toast.error('Gagal Menyetujui Transfer', Object.values(errors)[0] as string);
            },
            onFinish: () => setIsLoading(false),
        });
    };

    const handleReject = () => {
        if (!rejectionReason.trim()) {
            toast.error('Alasan Penolakan Wajib Diisi', 'Mohon isi alasan penolakan terlebih dahulu');
            return;
        }
        setIsLoading(true);
        router.post(`/transfers/${transfer.id}/reject`, { rejection_reason: rejectionReason }, {
            onSuccess: () => {
                toast.success('Transfer Berhasil Ditolak', `Transfer ${transfer.transfer_number} telah ditolak`);
                setShowRejectDialog(false);
            },
            onError: (errors) => {
                toast.error('Gagal Menolak Transfer', Object.values(errors)[0] as string);
            },
            onFinish: () => setIsLoading(false),
        });
    };

    const handleSend = () => {
        setIsLoading(true);
        router.post(`/transfers/${transfer.id}/send`, { items: sendItems }, {
            onSuccess: () => {
                toast.success('Transfer Berhasil Dikirim!', `Transfer ${transfer.transfer_number} telah dikirim`);
                setShowSendDialog(false);
            },
            onError: (errors) => {
                toast.error('Gagal Mengirim Transfer', Object.values(errors)[0] as string);
            },
            onFinish: () => setIsLoading(false),
        });
    };

    const handleReceive = () => {
        setIsLoading(true);
        router.post(`/transfers/${transfer.id}/receive`, { items: receiveItems }, {
            onSuccess: () => {
                toast.success('Transfer Berhasil Diterima!', `Transfer ${transfer.transfer_number} telah diterima`);
                setShowReceiveDialog(false);
            },
            onError: (errors) => {
                toast.error('Gagal Menerima Transfer', Object.values(errors)[0] as string);
            },
            onFinish: () => setIsLoading(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={transfer.transfer_number} />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader title={transfer.transfer_number} description="Detail transfer stok">
                    <div className="flex gap-2">
                        {/* Super Admin: Approve/Reject when pending */}
                        {transfer.status === 'pending' && isSuperAdmin && can('approve_transfer') && (
                            <>
                                <Button onClick={() => setShowApproveDialog(true)}><Check className="mr-2 h-4 w-4" />Approve</Button>
                                <Button variant="destructive" onClick={() => setShowRejectDialog(true)}><X className="mr-2 h-4 w-4" />Reject</Button>
                            </>
                        )}
                        {/* Admin Cabang Pengirim (from_branch): Kirim when approved */}
                        {transfer.status === 'approved' && can('send_transfer') && userBranch?.id === transfer.from_branch.id && (
                            <Button onClick={() => setShowSendDialog(true)}><Send className="mr-2 h-4 w-4" />Kirim</Button>
                        )}
                        {/* Admin Cabang Penerima (to_branch): Terima when sent */}
                        {transfer.status === 'sent' && can('receive_transfer') && userBranch?.id === transfer.to_branch.id && (
                            <Button onClick={() => setShowReceiveDialog(true)}><Check className="mr-2 h-4 w-4" />Terima</Button>
                        )}
                        {transfer.delivery_note_number && (
                            <Button variant="outline" asChild>
                                <a href={`/transfers/${transfer.id}/delivery-note`} target="_blank"><FileText className="mr-2 h-4 w-4" />Surat Jalan</a>
                            </Button>
                        )}
                    </div>
                </PageHeader>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card>
                        <CardHeader><CardTitle>Informasi Transfer</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><TransferStatusBadge status={transfer.status} /></div>
                            <div className="flex items-center gap-2">
                                <span>{transfer.from_branch.name}</span>
                                <ArrowRight className="h-4 w-4" />
                                <span>{transfer.to_branch.name}</span>
                            </div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Tanggal Request</span><span>{formatDateTime(transfer.requested_at)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Diminta oleh</span><span>{transfer.requested_by?.name || '-'}</span></div>
                            {transfer.approved_at && <div className="flex justify-between"><span className="text-muted-foreground">Tanggal Approve</span><span>{formatDateTime(transfer.approved_at)}</span></div>}
                            {transfer.approved_by && <div className="flex justify-between"><span className="text-muted-foreground">Diapprove oleh</span><span>{transfer.approved_by.name}</span></div>}
                            {transfer.sent_at && <div className="flex justify-between"><span className="text-muted-foreground">Tanggal Kirim</span><span>{formatDateTime(transfer.sent_at)}</span></div>}
                            {transfer.received_at && <div className="flex justify-between"><span className="text-muted-foreground">Tanggal Terima</span><span>{formatDateTime(transfer.received_at)}</span></div>}
                            {transfer.rejection_reason && <div><span className="text-muted-foreground">Alasan Reject</span><p className="text-red-600 mt-1">{transfer.rejection_reason}</p></div>}
                            {transfer.notes && <div><span className="text-muted-foreground">Catatan</span><p className="mt-1">{transfer.notes}</p></div>}
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader><CardTitle>Item Transfer</CardTitle><CardDescription>Daftar produk yang ditransfer</CardDescription></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Produk</TableHead>
                                        <TableHead className="text-right">Diminta</TableHead>
                                        <TableHead className="text-right">Dikirim</TableHead>
                                        <TableHead className="text-right">Diterima</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transfer.items.map((item) => {
                                        // Determine which quantity to compare based on transfer status
                                        const actualQuantity = transfer.status === 'received'
                                            ? item.quantity_received
                                            : transfer.status === 'sent'
                                            ? item.quantity_sent
                                            : null;

                                        const status = getQuantityStatus(item.quantity_requested, actualQuantity);

                                        return (
                                            <TableRow key={item.id} className={cn(status?.bgClass)}>
                                                <TableCell>
                                                    <p className="font-medium">{item.product.name}</p>
                                                    <p className="text-sm text-muted-foreground font-mono">{item.product.sku}</p>
                                                </TableCell>
                                                <TableCell className="text-right">{item.quantity_requested}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span>{item.quantity_sent ?? '-'}</span>
                                                        {transfer.status === 'sent' && status?.badge}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span>{item.quantity_received ?? '-'}</span>
                                                        {transfer.status === 'received' && status?.badge}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmDialog open={showApproveDialog} onOpenChange={setShowApproveDialog} title="Approve Transfer" description="Apakah Anda yakin ingin menyetujui transfer ini?" onConfirm={handleApprove} isLoading={isLoading} />

            <ConfirmDialog open={showRejectDialog} onOpenChange={setShowRejectDialog} title="Reject Transfer" description="Masukkan alasan penolakan:" onConfirm={handleReject} isLoading={isLoading} confirmText="Reject" variant="destructive">
                <Textarea placeholder="Alasan penolakan..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="mt-4" />
            </ConfirmDialog>

            <ConfirmDialog open={showSendDialog} onOpenChange={setShowSendDialog} title="Kirim Transfer" description="Masukkan jumlah yang dikirim:" onConfirm={handleSend} isLoading={isLoading} confirmText="Kirim">
                <div className="mt-4 space-y-2">
                    {transfer.items.map((item, idx) => (
                        <div key={item.id} className="flex items-center justify-between gap-4">
                            <span className="text-sm">{item.product.name}</span>
                            <Input type="number" className="w-24" value={sendItems[idx]?.quantity_sent} onChange={(e) => setSendItems((prev) => prev.map((p, i) => i === idx ? { ...p, quantity_sent: Number(e.target.value) } : p))} />
                        </div>
                    ))}
                </div>
            </ConfirmDialog>

            <ConfirmDialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog} title="Terima Transfer" description="Masukkan jumlah yang diterima:" onConfirm={handleReceive} isLoading={isLoading} confirmText="Terima">
                <div className="mt-4 space-y-2">
                    {transfer.items.map((item, idx) => (
                        <div key={item.id} className="flex items-center justify-between gap-4">
                            <span className="text-sm">{item.product.name} (dikirim: {item.quantity_sent})</span>
                            <Input type="number" className="w-24" value={receiveItems[idx]?.quantity_received} onChange={(e) => setReceiveItems((prev) => prev.map((p, i) => i === idx ? { ...p, quantity_received: Number(e.target.value) } : p))} />
                        </div>
                    ))}
                </div>
            </ConfirmDialog>
        </AppLayout>
    );
}

