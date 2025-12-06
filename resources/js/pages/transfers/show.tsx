import { ConfirmDialog } from '@/components/confirm-dialog';
import { PageHeader } from '@/components/page-header';
import { TransferStatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime } from '@/lib/utils';
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
}

export default function TransferShow({ transfer }: Props) {
    const { can } = usePermissions();
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [showSendDialog, setShowSendDialog] = useState(false);
    const [showReceiveDialog, setShowReceiveDialog] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [sendItems, setSendItems] = useState(transfer.items.map((i) => ({ id: i.id, quantity_sent: i.quantity_requested })));
    const [receiveItems, setReceiveItems] = useState(transfer.items.map((i) => ({ id: i.id, quantity_received: i.quantity_sent || 0 })));
    const [isLoading, setIsLoading] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Transfer', href: '/transfers' },
        { title: transfer.transfer_number, href: `/transfers/${transfer.id}` },
    ];

    const handleApprove = () => {
        setIsLoading(true);
        router.post(`/transfers/${transfer.id}/approve`, {}, { onFinish: () => { setIsLoading(false); setShowApproveDialog(false); } });
    };

    const handleReject = () => {
        setIsLoading(true);
        router.post(`/transfers/${transfer.id}/reject`, { rejection_reason: rejectionReason }, { onFinish: () => { setIsLoading(false); setShowRejectDialog(false); } });
    };

    const handleSend = () => {
        setIsLoading(true);
        router.post(`/transfers/${transfer.id}/send`, { items: sendItems }, { onFinish: () => { setIsLoading(false); setShowSendDialog(false); } });
    };

    const handleReceive = () => {
        setIsLoading(true);
        router.post(`/transfers/${transfer.id}/receive`, { items: receiveItems }, { onFinish: () => { setIsLoading(false); setShowReceiveDialog(false); } });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={transfer.transfer_number} />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader title={transfer.transfer_number} description="Detail transfer stok">
                    <div className="flex gap-2">
                        {transfer.status === 'pending' && can('approve_transfer') && (
                            <>
                                <Button onClick={() => setShowApproveDialog(true)}><Check className="mr-2 h-4 w-4" />Approve</Button>
                                <Button variant="destructive" onClick={() => setShowRejectDialog(true)}><X className="mr-2 h-4 w-4" />Reject</Button>
                            </>
                        )}
                        {transfer.status === 'approved' && can('send_transfer') && (
                            <Button onClick={() => setShowSendDialog(true)}><Send className="mr-2 h-4 w-4" />Kirim</Button>
                        )}
                        {transfer.status === 'sent' && can('receive_transfer') && (
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
                                    {transfer.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell><p className="font-medium">{item.product.name}</p><p className="text-sm text-muted-foreground font-mono">{item.product.sku}</p></TableCell>
                                            <TableCell className="text-right">{item.quantity_requested}</TableCell>
                                            <TableCell className="text-right">{item.quantity_sent ?? '-'}</TableCell>
                                            <TableCell className="text-right">{item.quantity_received ?? '-'}</TableCell>
                                        </TableRow>
                                    ))}
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

