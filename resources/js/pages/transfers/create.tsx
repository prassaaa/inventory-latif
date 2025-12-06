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
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

const transferSchema = z.object({
    to_branch_id: z.string().min(1, 'Cabang tujuan wajib dipilih'),
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
    branchStocks: (BranchStock & { product: Product })[];
    fromBranch: Branch;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Transfer', href: '/transfers' },
    { title: 'Buat Transfer', href: '/transfers/create' },
];

export default function TransferCreate({ branches, products, branchStocks, fromBranch }: Props) {
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

    const form = useForm<TransferFormValues>({
        resolver: zodResolver(transferSchema),
        defaultValues: { to_branch_id: '', notes: '', items: [{ product_id: '', quantity_requested: 1 }] },
    });

    const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });

    const getAvailableStock = (productId: string) => {
        const stock = branchStocks.find((s) => String(s.product_id) === productId);
        return stock?.quantity ?? 0;
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

    const availableProducts = products.filter((p) => !selectedProducts.has(String(p.id)) || fields.some((f) => f.product_id === String(p.id)));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Transfer" />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader title="Buat Transfer" description={`Transfer dari ${fromBranch.name}`} />

                <Card>
                    <CardHeader>
                        <CardTitle>Form Transfer</CardTitle>
                        <CardDescription>Buat permintaan transfer stok ke cabang lain</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <FormLabel>Dari Cabang</FormLabel>
                                        <Input value={`${fromBranch.name} (${fromBranch.code})`} disabled className="mt-2" />
                                    </div>
                                    <FormField control={form.control} name="to_branch_id" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ke Cabang *</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Pilih cabang tujuan" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {branches.map((b) => (<SelectItem key={b.id} value={String(b.id)}>{b.name} ({b.code})</SelectItem>))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
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
                                                <TableHead className="w-32">Stok Tersedia</TableHead>
                                                <TableHead className="w-32">Jumlah</TableHead>
                                                <TableHead className="w-16"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {fields.map((field, index) => (
                                                <TableRow key={field.id}>
                                                    <TableCell>
                                                        <FormField control={form.control} name={`items.${index}.product_id`} render={({ field: f }) => (
                                                            <Select onValueChange={(v) => handleProductChange(index, v)} value={f.value}>
                                                                <SelectTrigger><SelectValue placeholder="Pilih produk" /></SelectTrigger>
                                                                <SelectContent>
                                                                    {availableProducts.map((p) => (<SelectItem key={p.id} value={String(p.id)}>{p.sku} - {p.name}</SelectItem>))}
                                                                </SelectContent>
                                                            </Select>
                                                        )} />
                                                    </TableCell>
                                                    <TableCell className="text-center">{getAvailableStock(form.watch(`items.${index}.product_id`))}</TableCell>
                                                    <TableCell>
                                                        <FormField control={form.control} name={`items.${index}.quantity_requested`} render={({ field: f }) => (
                                                            // eslint-disable-next-line react-hooks/incompatible-library -- React Compiler auto-skips incompatible hooks
                                                            <Input type="number" min={1} max={getAvailableStock(form.watch(`items.${index}.product_id`))} {...f} />
                                                        )} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} disabled={fields.length === 1}>
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {form.formState.errors.items?.message && <p className="text-sm text-red-500 mt-2">{form.formState.errors.items.message}</p>}
                                </div>

                                <FormField control={form.control} name="notes" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Catatan</FormLabel>
                                        <FormControl><Textarea placeholder="Catatan tambahan..." {...field} value={field.value ?? ''} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <div className="flex gap-4">
                                    <Button type="submit" disabled={form.formState.isSubmitting}>
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

