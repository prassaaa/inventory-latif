import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { toast } from '@/lib/toast';
import type { BreadcrumbItem, Category } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { Loader2, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const productSchema = z.object({
    name: z.string().min(1, 'Nama produk wajib diisi').max(100),
    sku: z.string().min(1, 'SKU wajib diisi').max(50),
    category_id: z.string().min(1, 'Kategori wajib dipilih'),
    description: z.string().max(1000).optional().nullable(),
    color: z.string().max(50).optional().nullable(),
    size: z.string().max(50).optional().nullable(),
    price: z.number().min(0, 'Harga tidak boleh negatif'),
    is_active: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface Props {
    categories: Category[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Produk', href: '/products' },
    { title: 'Tambah Produk', href: '/products/create' },
];

export default function ProductCreate({ categories }: Props) {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: '',
            sku: '',
            category_id: '',
            description: '',
            color: '',
            size: '',
            price: 0,
            is_active: true,
        },
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const onSubmit = (data: ProductFormValues) => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                // Convert boolean to "1"/"0" for Laravel
                if (typeof value === 'boolean') {
                    formData.append(key, value ? '1' : '0');
                } else {
                    formData.append(key, String(value));
                }
            }
        });
        if (imageFile) formData.append('image', imageFile);

        router.post('/products', formData, {
            forceFormData: true,
            onSuccess: () => {
                toast.success('Produk Berhasil Ditambahkan!', `Produk "${data.name}" telah ditambahkan ke katalog`);
            },
            onError: (errors) => {
                toast.error('Gagal Menambahkan Produk', Object.values(errors)[0] as string);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Produk" />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader title="Tambah Produk" description="Buat produk baru" />

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Informasi Produk</CardTitle>
                        <CardDescription>Masukkan detail produk baru</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nama Produk *</FormLabel>
                                            <FormControl><Input placeholder="Kursi Kantor" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="sku" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SKU *</FormLabel>
                                            <FormControl><Input placeholder="KRS-001" {...field} className="uppercase" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField control={form.control} name="category_id" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Kategori *</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {categories.map((cat) => (
                                                        <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="price" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Harga *</FormLabel>
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
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField control={form.control} name="color" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Warna</FormLabel>
                                            <FormControl><Input placeholder="Hitam" {...field} value={field.value ?? ''} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="size" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ukuran</FormLabel>
                                            <FormControl><Input placeholder="50x50x100 cm" {...field} value={field.value ?? ''} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                                <FormField control={form.control} name="description" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Deskripsi</FormLabel>
                                        <FormControl><Textarea placeholder="Deskripsi produk" {...field} value={field.value ?? ''} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                {/* Image Upload - will continue in next part */}
                                <div>
                                    <FormLabel>Gambar Produk</FormLabel>
                                    <div className="mt-2">
                                        {imagePreview ? (
                                            <div className="relative inline-block">
                                                <img src={imagePreview} alt="Preview" className="h-32 w-32 rounded object-cover" />
                                                <Button type="button" variant="destructive" size="icon" className="absolute -right-2 -top-2 h-6 w-6" onClick={removeImage}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <label className="flex h-32 w-32 cursor-pointer items-center justify-center rounded border-2 border-dashed hover:bg-muted/50">
                                                <Upload className="h-8 w-8 text-muted-foreground" />
                                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                            </label>
                                        )}
                                    </div>
                                    <FormDescription>Format: JPG, PNG. Max 2MB</FormDescription>
                                </div>

                                <FormField control={form.control} name="is_active" render={({ field }) => (
                                    <FormItem className="flex items-center gap-2">
                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        <FormLabel className="!mt-0">Produk Aktif</FormLabel>
                                    </FormItem>
                                )} />

                                <div className="flex gap-4">
                                    <Button type="submit" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Simpan
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => router.get('/products')}>Batal</Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

