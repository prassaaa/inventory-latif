import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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

const productRequestSchema = z.object({
    name: z.string().min(1, 'Nama produk wajib diisi').max(100),
    sku: z.string().min(1, 'SKU wajib diisi').max(50),
    category_id: z.string().min(1, 'Kategori wajib dipilih'),
    description: z.string().max(1000).optional().nullable(),
    color: z.string().max(50).optional().nullable(),
    size: z.string().max(50).optional().nullable(),
    price: z.number().min(0, 'Harga tidak boleh negatif'),
    request_notes: z.string().max(500).optional().nullable(),
});

type ProductRequestFormValues = z.infer<typeof productRequestSchema>;

interface Props {
    categories: Category[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Request Produk', href: '/product-requests' },
    { title: 'Request Produk Baru', href: '/product-requests/create' },
];

export default function ProductRequestCreate({ categories }: Props) {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<ProductRequestFormValues>({
        resolver: zodResolver(productRequestSchema),
        defaultValues: {
            name: '',
            sku: '',
            category_id: '',
            description: '',
            color: '',
            size: '',
            price: 0,
            request_notes: '',
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

    const onSubmit = (data: ProductRequestFormValues) => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                formData.append(key, String(value));
            }
        });
        if (imageFile) formData.append('image', imageFile);

        router.post('/product-requests', formData, {
            forceFormData: true,
            onSuccess: () => {
                toast.success('Request Produk Berhasil Dibuat!', 'Request Anda akan segera di-review oleh Super Admin');
            },
            onError: (errors) => {
                toast.error('Gagal Membuat Request', Object.values(errors)[0] as string);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Request Produk Baru" />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title="Request Produk Baru"
                    description="Ajukan produk baru untuk ditambahkan ke katalog"
                />

                <Card className="max-w-4xl">
                    <CardHeader>
                        <CardTitle>Informasi Produk</CardTitle>
                        <CardDescription>Request ini akan dikirim ke Super Admin untuk di-review dan disetujui</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="sku"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SKU *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="FRN-SOFA-001" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nama Produk *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Sofa Minimalis 3 Seater" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="category_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Kategori *</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih kategori" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {categories.map((category) => (
                                                        <SelectItem key={category.id} value={String(category.id)}>
                                                            {category.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="color"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Warna</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Coklat" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="size"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Ukuran</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="200x80x75 cm" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Harga *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="3500000"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Deskripsi</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Deskripsi produk..."
                                                    {...field}
                                                    value={field.value || ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="request_notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Catatan Request</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Alasan request produk ini..."
                                                    {...field}
                                                    value={field.value || ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div>
                                    <FormLabel>Foto Produk</FormLabel>
                                    <div className="mt-2">
                                        {imagePreview ? (
                                            <div className="relative inline-block">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="h-40 w-40 rounded-lg object-cover"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute -right-2 -top-2"
                                                    onClick={removeImage}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-4">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    Upload Foto
                                                </Button>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleImageChange}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Button type="submit" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Submit Request
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.visit('/product-requests')}
                                    >
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

