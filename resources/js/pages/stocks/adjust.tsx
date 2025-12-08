import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { Branch, BreadcrumbItem, Product } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const adjustSchema = z.object({
    branch_id: z.string().min(1, 'Cabang wajib dipilih'),
    product_id: z.string().min(1, 'Produk wajib dipilih'),
    quantity: z.number().refine((val) => val !== 0, 'Jumlah tidak boleh 0'),
    notes: z.string().max(500).optional().nullable(),
});

type AdjustFormValues = z.infer<typeof adjustSchema>;

interface Props {
    branches: Branch[];
    products: Product[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Stok', href: '/stocks' },
    { title: 'Adjust Stok', href: '/stocks/adjust' },
];

export default function StockAdjust({ branches, products }: Props) {
    const form = useForm<AdjustFormValues>({
        resolver: zodResolver(adjustSchema),
        defaultValues: {
            branch_id: branches.length === 1 ? String(branches[0].id) : '',
            product_id: '',
            quantity: 0,
            notes: '',
        },
    });

    const onSubmit = (data: AdjustFormValues) => {
        console.log('Submitting data:', data);
        router.post('/stocks/adjust', data, {
            onSuccess: () => {
                form.reset();
            },
            onError: (errors) => {
                console.log('Errors:', errors);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Adjust Stok" />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader title="Adjust Stok" description="Sesuaikan stok produk secara manual" />

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Form Penyesuaian Stok</CardTitle>
                        <CardDescription>
                            Gunakan nilai positif untuk menambah stok, nilai negatif untuk mengurangi stok
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="branch_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cabang *</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                disabled={branches.length === 1}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih cabang" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {branches.map((branch) => (
                                                        <SelectItem key={branch.id} value={String(branch.id)}>
                                                            {branch.name} ({branch.code})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="product_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Produk *</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih produk" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {products.map((product) => (
                                                        <SelectItem key={product.id} value={String(product.id)}>
                                                            {product.sku} - {product.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="quantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Jumlah *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    value={field.value}
                                                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                                                    onBlur={field.onBlur}
                                                    name={field.name}
                                                    ref={field.ref}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Positif (+) untuk menambah, negatif (-) untuk mengurangi
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Catatan</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Alasan penyesuaian stok..."
                                                    {...field}
                                                    value={field.value ?? ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex gap-4">
                                    <Button type="submit" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Simpan
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => router.get('/stocks')}>
                                        Batal
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

