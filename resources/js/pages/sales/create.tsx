import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { toast } from '@/lib/toast';
import { formatCurrency } from '@/lib/utils';
import type { Branch, BranchStock, BreadcrumbItem, Product } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

const saleSchema = z.object({
    customer_name: z.string().max(100).optional().nullable(),
    customer_phone: z.string().max(20).optional().nullable(),
    payment_method: z.string().min(1, 'Metode pembayaran wajib dipilih'),
    discount: z.number().min(0),
    notes: z.string().max(500).optional().nullable(),
    items: z.array(z.object({
        product_id: z.string().min(1, 'Produk wajib dipilih'),
        quantity: z.number().min(1, 'Minimal 1'),
        unit_price: z.number().min(0),
    })).min(1, 'Minimal 1 item'),
});

type SaleFormValues = z.infer<typeof saleSchema>;

interface Props {
    branchStocks: (BranchStock & { product: Product })[];
    branch: Branch;
    paymentMethods: { value: string; label: string }[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Penjualan', href: '/sales' },
    { title: 'Buat Penjualan', href: '/sales/create' },
];

export default function SaleCreate({ branchStocks, branch, paymentMethods }: Props) {
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

    const form = useForm<SaleFormValues>({
        resolver: zodResolver(saleSchema),
        defaultValues: { customer_name: '', customer_phone: '', payment_method: 'cash', discount: 0, notes: '', items: [{ product_id: '', quantity: 1, unit_price: 0 }] },
    });

    const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });

    // Use useWatch for reactive updates
    const watchItems = useWatch({ control: form.control, name: 'items' });
    const watchDiscount = useWatch({ control: form.control, name: 'discount' });

    const subtotal = useMemo(() => {
        if (!watchItems) return 0;
        return watchItems.reduce((sum, item) => sum + ((item?.quantity || 0) * (item?.unit_price || 0)), 0);
    }, [watchItems]);
    const grandTotal = useMemo(() => subtotal - (watchDiscount || 0), [subtotal, watchDiscount]);

    const getStock = (productId: string) => branchStocks.find((s) => String(s.product_id) === productId);

    const handleProductChange = (index: number, productId: string) => {
        const oldProductId = form.getValues(`items.${index}.product_id`);
        if (oldProductId) setSelectedProducts((prev) => { const next = new Set(prev); next.delete(oldProductId); return next; });
        setSelectedProducts((prev) => new Set(prev).add(productId));
        form.setValue(`items.${index}.product_id`, productId);
        const stock = getStock(productId);
        if (stock) form.setValue(`items.${index}.unit_price`, Number(stock.product.price));
    };

    const handleRemoveItem = (index: number) => {
        const productId = form.getValues(`items.${index}.product_id`);
        if (productId) setSelectedProducts((prev) => { const next = new Set(prev); next.delete(productId); return next; });
        remove(index);
    };

    const onSubmit = (data: SaleFormValues) => {
        const totalItems = data.items.length;
        const totalQty = data.items.reduce((sum, item) => sum + item.quantity, 0);
        router.post('/sales', data, {
            onSuccess: () => {
                toast.success('Penjualan Berhasil Dibuat!', `${totalItems} produk (${totalQty} item) telah terjual`);
            },
            onError: (errors) => {
                toast.error('Gagal Membuat Penjualan', Object.values(errors)[0] as string);
            },
        });
    };

    // Get available products for a specific row (exclude already selected, but include current row's product)
    const getAvailableProductsForRow = (currentProductId: string) => {
        return branchStocks.filter((s) =>
            !selectedProducts.has(String(s.product_id)) || String(s.product_id) === currentProductId
        );
    };

    // Get product label for display
    const getProductLabel = (productId: string) => {
        const stock = branchStocks.find(s => String(s.product_id) === productId);
        return stock ? `${stock.product.sku} - ${stock.product.name}` : '';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Penjualan" />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader title="Buat Penjualan" description={`Cabang: ${branch.name}`} />

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid gap-6 lg:grid-cols-3">
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div><CardTitle>Item Penjualan</CardTitle><CardDescription>Pilih produk yang dibeli</CardDescription></div>
                                        <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: '', quantity: 1, unit_price: 0 })}><Plus className="mr-2 h-4 w-4" />Tambah</Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Produk</TableHead>
                                                <TableHead className="w-24">Stok</TableHead>
                                                <TableHead className="w-24">Qty</TableHead>
                                                <TableHead className="w-32">Harga</TableHead>
                                                <TableHead className="w-32 text-right">Subtotal</TableHead>
                                                <TableHead className="w-12"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {fields.map((field, index) => {
                                                const productId = form.getValues(`items.${index}.product_id`);
                                                const stock = getStock(productId);
                                                const rowProducts = getAvailableProductsForRow(productId);
                                                // eslint-disable-next-line react-hooks/incompatible-library -- React Compiler auto-skips incompatible hooks
                                                const quantity = form.watch(`items.${index}.quantity`) || 0;
                                                const unitPrice = form.watch(`items.${index}.unit_price`) || 0;
                                                const itemSubtotal = quantity * unitPrice;
                                                return (
                                                    <TableRow key={field.id}>
                                                        <TableCell className="min-w-[200px]">
                                                            <FormField control={form.control} name={`items.${index}.product_id`} render={({ field: f }) => (
                                                                <Select onValueChange={(v) => handleProductChange(index, v)} value={f.value}>
                                                                    <SelectTrigger className="w-full">
                                                                        <SelectValue placeholder="Pilih produk" className="truncate">
                                                                            <span className="truncate block">{f.value ? getProductLabel(f.value) : 'Pilih produk'}</span>
                                                                        </SelectValue>
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {rowProducts.map((s) => (<SelectItem key={s.product_id} value={String(s.product_id)}>{s.product.sku} - {s.product.name}</SelectItem>))}
                                                                    </SelectContent>
                                                                </Select>
                                                            )} />
                                                        </TableCell>
                                                        <TableCell className="text-center">{stock?.quantity ?? 0}</TableCell>
                                                        <TableCell className="min-w-[80px]">
                                                            <FormField control={form.control} name={`items.${index}.quantity`} render={({ field: f }) => (
                                                                <Input
                                                                    type="number"
                                                                    min={1}
                                                                    max={stock?.quantity ?? 1}
                                                                    value={f.value}
                                                                    onChange={(e) => f.onChange(e.target.value === '' ? 1 : Number(e.target.value))}
                                                                    onBlur={f.onBlur}
                                                                    name={f.name}
                                                                    ref={f.ref}
                                                                    className="w-full"
                                                                />
                                                            )} />
                                                        </TableCell>
                                                        <TableCell className="min-w-[100px]">
                                                            <FormField control={form.control} name={`items.${index}.unit_price`} render={({ field: f }) => (
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    value={f.value}
                                                                    onChange={(e) => f.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                                                                    onBlur={f.onBlur}
                                                                    name={f.name}
                                                                    ref={f.ref}
                                                                    className="w-full"
                                                                />
                                                            )} />
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">{formatCurrency(itemSubtotal)}</TableCell>
                                                        <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} disabled={fields.length === 1}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                    {form.formState.errors.items?.message && <p className="text-sm text-red-500 mt-2">{form.formState.errors.items.message}</p>}
                                </CardContent>
                            </Card>

                            <div className="space-y-6">
                                <Card>
                                    <CardHeader><CardTitle>Info Pelanggan</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <FormField control={form.control} name="customer_name" render={({ field }) => (<FormItem><FormLabel>Nama</FormLabel><FormControl><Input placeholder="Nama pelanggan" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="customer_phone" render={({ field }) => (<FormItem><FormLabel>Telepon</FormLabel><FormControl><Input placeholder="08xxx" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader><CardTitle>Pembayaran</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <FormField control={form.control} name="payment_method" render={({ field }) => (<FormItem><FormLabel>Metode *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{paymentMethods.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="discount" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Diskon</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={field.value}
                                                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                                                        onBlur={field.onBlur}
                                                        name={field.name}
                                                        ref={field.ref}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Catatan</FormLabel><FormControl><Textarea placeholder="Catatan..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                                        <div className="border-t pt-4 space-y-2">
                                            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                                            <div className="flex justify-between"><span>Diskon</span><span>-{formatCurrency(watchDiscount || 0)}</span></div>
                                            <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(grandTotal)}</span></div>
                                        </div>
                                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan Penjualan</Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </form>
                </Form>
            </div>
        </AppLayout>
    );
}

