import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { toast } from '@/lib/toast';
import type {
    Branch,
    BranchStock,
    BreadcrumbItem,
    Category,
    Product,
    ProductImage,
} from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, Link, router } from '@inertiajs/react';
import { Loader2, Package, Plus, Star, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const productSchema = z.object({
    name: z.string().min(1, 'Nama produk wajib diisi').max(100),
    sku: z.string().min(1, 'SKU wajib diisi').max(50),
    category_id: z.string().min(1, 'Kategori wajib dipilih'),
    description: z.string().max(1000).optional().nullable(),
    location_description: z.string().max(500).optional().nullable(),
    color: z.string().max(50).optional().nullable(),
    size: z.string().max(50).optional().nullable(),
    price: z.number().min(0, 'Harga tidak boleh negatif'),
    is_active: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ImagePreview {
    file: File;
    preview: string;
}

interface Props {
    product: Product & {
        images?: ProductImage[];
        branch_stocks?: (BranchStock & { branch: Branch })[];
    };
    categories: Category[];
    branches: Branch[];
    isSuperAdmin: boolean;
    userBranchId: number | null;
    maxImages: number;
}

export default function ProductEdit({
    product,
    categories,
    maxImages = 5,
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Produk', href: '/products' },
        { title: product.name, href: `/products/${product.id}` },
        { title: 'Edit', href: `/products/${product.id}/edit` },
    ];

    const existingImages = product.images || [];
    const [newImages, setNewImages] = useState<ImagePreview[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: product.name,
            sku: product.sku,
            category_id: String(product.category_id),
            description: product.description ?? '',
            location_description: product.location_description ?? '',
            color: product.color ?? '',
            size: product.size ?? '',
            price: product.price,
            is_active: product.is_active,
        },
    });

    const totalImages = existingImages.length + newImages.length;
    const canAddMore = totalImages < maxImages;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const remainingSlots = maxImages - totalImages;
        const newImagesArray: ImagePreview[] = [];

        for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
            const file = files[i];
            newImagesArray.push({
                file,
                preview: URL.createObjectURL(file),
            });
        }

        setNewImages([...newImages, ...newImagesArray]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeNewImage = (index: number) => {
        const updated = [...newImages];
        URL.revokeObjectURL(updated[index].preview);
        updated.splice(index, 1);
        setNewImages(updated);
    };

    const deleteExistingImage = (imageId: number) => {
        router.delete(`/products/${product.id}/images/${imageId}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Gambar Dihapus', 'Gambar berhasil dihapus');
            },
        });
    };

    const setPrimaryImage = (imageId: number) => {
        router.post(
            `/products/${product.id}/images/${imageId}/primary`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        'Gambar Utama',
                        'Gambar utama berhasil diubah',
                    );
                },
            },
        );
    };

    const onSubmit = (data: ProductFormValues) => {
        const formData = new FormData();
        formData.append('_method', 'PUT');
        Object.entries(data).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                if (typeof value === 'boolean') {
                    formData.append(key, value ? '1' : '0');
                } else {
                    formData.append(key, String(value));
                }
            }
        });

        newImages.forEach((img) => {
            formData.append('images[]', img.file);
        });

        router.post(`/products/${product.id}`, formData, {
            forceFormData: true,
            onSuccess: () => {
                toast.success(
                    'Produk Berhasil Diperbarui!',
                    `Produk "${data.name}" telah diperbarui`,
                );
            },
            onError: (errors) => {
                toast.error(
                    'Gagal Memperbarui Produk',
                    Object.values(errors)[0] as string,
                );
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${product.name}`} />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title="Edit Produk"
                    description={`Edit produk ${product.name}`}
                />

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Informasi Produk</CardTitle>
                        <CardDescription>
                            Perbarui detail produk
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-6"
                            >
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Nama Produk *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Kursi Kantor"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="sku"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>SKU</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled
                                                        className="bg-muted uppercase"
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    SKU tidak dapat diubah
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="category_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Kategori *
                                                </FormLabel>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih kategori" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {categories.map(
                                                            (cat) => (
                                                                <SelectItem
                                                                    key={cat.id}
                                                                    value={String(
                                                                        cat.id,
                                                                    )}
                                                                >
                                                                    {cat.name}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Harga *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={field.value}
                                                        onChange={(e) =>
                                                            field.onChange(
                                                                e.target
                                                                    .value ===
                                                                    ''
                                                                    ? 0
                                                                    : Number(
                                                                          e
                                                                              .target
                                                                              .value,
                                                                      ),
                                                            )
                                                        }
                                                        onBlur={field.onBlur}
                                                        name={field.name}
                                                        ref={field.ref}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="color"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Warna</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Hitam"
                                                        {...field}
                                                        value={
                                                            field.value ?? ''
                                                        }
                                                    />
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
                                                    <Input
                                                        placeholder="50x50x100 cm"
                                                        {...field}
                                                        value={
                                                            field.value ?? ''
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Deskripsi</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Deskripsi produk"
                                                    {...field}
                                                    value={field.value ?? ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="location_description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Deskripsi Lokasi
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Lokasi penyimpanan produk (rak, gudang, dll)"
                                                    {...field}
                                                    value={field.value ?? ''}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Maks 500 karakter
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Multiple Image Upload */}
                                <div>
                                    <FormLabel>Gambar Produk</FormLabel>
                                    <div className="mt-2 flex flex-wrap gap-3">
                                        {/* Existing images */}
                                        {existingImages.map((img) => (
                                            <div
                                                key={img.id}
                                                className="group relative"
                                            >
                                                <img
                                                    src={img.thumbnail_url}
                                                    alt="Product"
                                                    className="h-24 w-24 rounded border object-cover"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center gap-1 rounded bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                                    {!img.is_primary && (
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={() =>
                                                                setPrimaryImage(
                                                                    img.id,
                                                                )
                                                            }
                                                            title="Set as primary"
                                                        >
                                                            <Star className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() =>
                                                            deleteExistingImage(
                                                                img.id,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                {img.is_primary && (
                                                    <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                                                        Utama
                                                    </span>
                                                )}
                                            </div>
                                        ))}

                                        {/* New images to upload */}
                                        {newImages.map((img, index) => (
                                            <div
                                                key={`new-${index}`}
                                                className="relative"
                                            >
                                                <img
                                                    src={img.preview}
                                                    alt={`New ${index + 1}`}
                                                    className="h-24 w-24 rounded border border-dashed border-primary object-cover"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute -top-2 -right-2 h-6 w-6"
                                                    onClick={() =>
                                                        removeNewImage(index)
                                                    }
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                                <span className="absolute bottom-1 left-1 rounded bg-blue-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                                    Baru
                                                </span>
                                            </div>
                                        ))}

                                        {/* Add button */}
                                        {canAddMore && (
                                            <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded border-2 border-dashed hover:bg-muted/50">
                                                <Plus className="h-6 w-6 text-muted-foreground" />
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={handleImageChange}
                                                />
                                            </label>
                                        )}
                                    </div>
                                    <FormDescription className="mt-2">
                                        {totalImages}/{maxImages} gambar.
                                        Format: JPG, PNG. Max 2MB per gambar
                                    </FormDescription>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="is_active"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-2">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={
                                                        field.onChange
                                                    }
                                                />
                                            </FormControl>
                                            <FormLabel className="!mt-0">
                                                Produk Aktif
                                            </FormLabel>
                                        </FormItem>
                                    )}
                                />

                                {/* Stock per Branch Section */}
                                <div className="border-t pt-4">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-lg font-semibold">
                                            Stok Per Cabang
                                        </h3>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <Link href="/stocks/adjust">
                                                <Plus className="mr-1 h-4 w-4" />
                                                Sesuaikan Stok
                                            </Link>
                                        </Button>
                                    </div>
                                    {product.branch_stocks &&
                                    product.branch_stocks.length > 0 ? (
                                        <div className="space-y-2">
                                            {product.branch_stocks.map(
                                                (stock) => (
                                                    <div
                                                        key={stock.id}
                                                        className="flex items-center justify-between rounded-lg border p-3"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Package className="h-5 w-5 text-muted-foreground" />
                                                            <div>
                                                                <p className="font-medium">
                                                                    {
                                                                        stock
                                                                            .branch
                                                                            ?.name
                                                                    }
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Min:{' '}
                                                                    {
                                                                        stock.min_stock
                                                                    }{' '}
                                                                    unit
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div
                                                            className={`text-lg font-bold ${
                                                                stock.quantity <=
                                                                stock.min_stock
                                                                    ? 'text-destructive'
                                                                    : ''
                                                            }`}
                                                        >
                                                            {stock.quantity}{' '}
                                                            unit
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            Belum ada stok di cabang manapun.
                                            Gunakan tombol "Sesuaikan Stok"
                                            untuk menambahkan.
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <Button
                                        type="submit"
                                        disabled={form.formState.isSubmitting}
                                    >
                                        {form.formState.isSubmitting && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Simpan Perubahan
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.get('/products')}
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
