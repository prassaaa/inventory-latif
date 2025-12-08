import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { Branch, BranchStock, BreadcrumbItem, Product } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

const transferSchema = z.object({
    from_branch_id: z.string().min(1, 'Cabang asal wajib dipilih'),
    notes: z.string().max(500).optional().nullable(),
    items: z.array(z.object({
        product_id: z.string().min(1, 'Produk wajib dipilih'),
        quantity_requested: z.number().min(1, 'Minimal 1'),
    })).min(1, 'Minimal 1 item'),
});

type TransferFormValues = z.infer<typeof transferSchema>;

interface Props {
    branches: Branch[];
    products: Product[];
    allBranchStocks: Record<number, (BranchStock & { product: Product })[]>;
    userBranch: Branch;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Transfer', href: '/transfers' },
    { title: 'Buat Transfer', href: '/transfers/create' },
];

export default function TransferCreate({ branches, products, allBranchStocks, userBranch }: Props) {
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

    const form = useForm<TransferFormValues>({
        resolver: zodResolver(transferSchema),
        defaultValues: { from_branch_id: '', notes: '', items: [{ product_id: '', quantity_requested: 1 }] },
    });

    const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });

    // eslint-disable-next-line react-hooks/incompatible-library -- React Compiler auto-skips incompatible hooks
    const selectedFromBranchId = form.watch('from_branch_id');

    // Get stocks for selected source branch
    const branchStocks = useMemo(() => {
        if (!selectedFromBranchId) return [];
        return allBranchStocks[Number(selectedFromBranchId)] || [];
    }, [selectedFromBranchId, allBranchStocks]);

    const getAvailableStock = (productId: string) => {
        const stock = branchStocks.find((s) => String(s.product_id) === productId);
        return stock?.quantity ?? 0;
    };

    const handleFromBranchChange = (branchId: string) => {
        form.setValue('from_branch_id', branchId);
        // Reset items when branch changes
        setSelectedProducts(new Set());
        form.setValue('items', [{ product_id: '', quantity_requested: 1 }]);
    };

    const handleProductChange = (index: number, productId: string) => {
        const oldProductId = form.getValues(`items.${index}.product_id`);
        if (oldProductId) {
            setSelectedProducts((prev) => { const next = new Set(prev); next.delete(oldProductId); return next; });
        }
        setSelectedProducts((prev) => new Set(prev).add(productId));
        form.setValue(`items.${index}.product_id`, productId);
    };

    const handleRemoveItem = (index: number) => {
        const productId = form.getValues(`items.${index}.product_id`);
        if (productId) {
            setSelectedProducts((prev) => { const next = new Set(prev); next.delete(productId); return next; });
        }
        remove(index);
    };

    const onSubmit = (data: TransferFormValues) => {
        router.post('/transfers', data);
    };

    // Get products that have stock in selected branch
    const productsWithStock = useMemo(() => {
        const stockProductIds = branchStocks.map(s => String(s.product_id));
        return products.filter((p) => stockProductIds.includes(String(p.id)));
    }, [products, branchStocks]);

    // Get available products for a specific row (exclude already selected, but include current row's product)
    const getAvailableProductsForRow = (currentProductId: string) => {
        return productsWithStock.filter((p) =>
            !selectedProducts.has(String(p.id)) || String(p.id) === currentProductId
        );
    };

    // Get product label for display
    const getProductLabel = (productId: string) => {
        const product = products.find(p => String(p.id) === productId);
        return product ? `${product.sku} - ${product.name}` : '';
    };

    const selectedFromBranch = branches.find(b => String(b.id) === selectedFromBranchId);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Transfer" />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader title="Request Transfer Stok" description={`Request stok untuk ${userBranch.name}`} />

                <Card>
                    <CardHeader>
                        <CardTitle>Form Request Transfer</CardTitle>
                        <CardDescription>Minta transfer stok dari cabang lain ke cabang Anda ({userBranch.name})</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField control={form.control} name="from_branch_id" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Dari Cabang (Pengirim) *</FormLabel>
                                            <Select onValueChange={handleFromBranchChange} value={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Pilih cabang pengirim" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {branches.map((b) => (<SelectItem key={b.id} value={String(b.id)}>{b.name} ({b.code})</SelectItem>))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <div>
                                        <FormLabel>Ke Cabang (Penerima)</FormLabel>
                                        <Input value={`${userBranch.name} (${userBranch.code})`} disabled className="mt-2" />
                                    </div>
                                </div>

                                {selectedFromBranchId && (
                                    <>
                                        <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
                                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                                <strong>Info:</strong> Anda meminta stok dari <strong>{selectedFromBranch?.name}</strong> untuk dikirim ke <strong>{userBranch.name}</strong>.
                                                Setelah request dibuat, Super Admin akan mereview dan menyetujui. Kemudian {selectedFromBranch?.name} akan mengirim barang.
                                            </p>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <FormLabel>Item Transfer *</FormLabel>
                                                <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: '', quantity_requested: 1 })}>
                                                    <Plus className="mr-2 h-4 w-4" />Tambah Item
                                                </Button>
                                            </div>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Produk</TableHead>
                                                        <TableHead className="w-32">Stok di {selectedFromBranch?.name}</TableHead>
                                                        <TableHead className="w-32">Jumlah Diminta</TableHead>
                                                        <TableHead className="w-16"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {fields.map((field, index) => {
                                                        const productId = form.getValues(`items.${index}.product_id`);
                                                        const availableStock = getAvailableStock(productId);
                                                        const rowProducts = getAvailableProductsForRow(productId);
                                                        return (
                                                            <TableRow key={field.id}>
                                                                <TableCell>
                                                                    <FormField control={form.control} name={`items.${index}.product_id`} render={({ field: f }) => (
                                                                        <Select onValueChange={(v) => handleProductChange(index, v)} value={f.value}>
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="Pilih produk">
                                                                                    {f.value ? getProductLabel(f.value) : 'Pilih produk'}
                                                                                </SelectValue>
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {rowProducts.map((p) => (<SelectItem key={p.id} value={String(p.id)}>{p.sku} - {p.name}</SelectItem>))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    )} />
                                                                </TableCell>
                                                                <TableCell className="text-center font-medium">{availableStock}</TableCell>
                                                                <TableCell>
                                                                    <FormField control={form.control} name={`items.${index}.quantity_requested`} render={({ field: f }) => (
                                                                        <Input
                                                                            type="number"
                                                                            min={1}
                                                                            max={availableStock}
                                                                            {...f}
                                                                            onChange={(e) => f.onChange(Number(e.target.value))}
                                                                        />
                                                                    )} />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} disabled={fields.length === 1}>
                                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                            {form.formState.errors.items?.message && <p className="text-sm text-red-500 mt-2">{form.formState.errors.items.message}</p>}
                                        </div>

                                        <FormField control={form.control} name="notes" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Catatan</FormLabel>
                                                <FormControl><Textarea placeholder="Catatan tambahan (alasan request, dll)..." {...field} value={field.value ?? ''} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </>
                                )}

                                <div className="flex gap-4">
                                    <Button type="submit" disabled={form.formState.isSubmitting || !selectedFromBranchId}>
                                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Kirim Request
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => router.get('/transfers')}>Batal</Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

