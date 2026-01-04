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
import type { Branch, BreadcrumbItem, Category } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { Loader2, Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const productSchema = z.object({
    name: z.string().min(1, 'Nama produk wajib diisi').max(100),
    category_id: z.string().min(1, 'Kategori wajib dipilih'),
    description: z.string().max(1000).optional().nullable(),
    location_description: z.string().max(500).optional().nullable(),
    color: z.string().max(50).optional().nullable(),
    size: z.string().max(50).optional().nullable(),
    price: z.number().min(0, 'Harga tidak boleh negatif'),
    is_active: z.boolean(),
    // Initial stock fields
    branch_id: z.string().optional(),
    initial_stock: z.number().min(0).optional().nullable(),
    min_stock: z.number().min(0).optional().nullable(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ImagePreview {
    file: File;
    preview: string;
}

interface Props {
    categories: Category[];
    branches: Branch[];
    userBranchId: number | null;
    isSuperAdmin: boolean;
    maxImages: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Produk', href: '/products' },
    { title: 'Tambah Produk', href: '/products/create' },
];

export default function ProductCreate({
    categories,
    branches,
    userBranchId,
    isSuperAdmin,
    maxImages = 5,
}: Props) {
    const [images, setImages] = useState<ImagePreview[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: '',
            category_id: '',
            description: '',
            location_description: '',
            color: '',
            size: '',
            price: undefined,
            is_active: true,
            // Stock defaults
            branch_id: userBranchId ? String(userBranchId) : '',
            initial_stock: undefined,
            min_stock: 5,
        },
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newImages: ImagePreview[] = [];
        const remainingSlots = maxImages - images.length;

        for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
            const file = files[i];
            newImages.push({
                file,
                preview: URL.createObjectURL(file),
            });
        }

        setImages([...images, ...newImages]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        URL.revokeObjectURL(newImages[index].preview);
        newImages.splice(index, 1);
        setImages(newImages);
    };

    const onSubmit = (data: ProductFormValues) => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                if (typeof value === 'boolean') {
                    formData.append(key, value ? '1' : '0');
                } else {
                    formData.append(key, String(value));
                }
            }
        });

        images.forEach((img) => {
            formData.append('images[]', img.file);
        });

        router.post('/products', formData, {
            forceFormData: true,
            onSuccess: () => {
                toast.success(
                    'Produk Berhasil Ditambahkan!',
                    `Produk "${data.name}" telah ditambahkan ke katalog`,
                );
            },
            onError: (errors) => {
                toast.error(
                    'Gagal Menambahkan Produk',
                    Object.values(errors)[0] as string,
                );
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Produk" />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title="Tambah Produk"
                    description="Buat produk baru"
                />

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Informasi Produk</CardTitle>
                        <CardDescription>
                            Masukkan detail produk baru
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
                                    <FormItem>
                                        <FormLabel>SKU</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Otomatis"
                                                disabled
                                                className="bg-muted uppercase"
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            SKU akan di-generate otomatis
                                        </FormDescription>
                                    </FormItem>
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
                                        {images.map((img, index) => (
                                            <div
                                                key={index}
                                                className="relative"
                                            >
                                                <img
                                                    src={img.preview}
                                                    alt={`Preview ${index + 1}`}
                                                    className="h-24 w-24 rounded border object-cover"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute -top-2 -right-2 h-6 w-6"
                                                    onClick={() =>
                                                        removeImage(index)
                                                    }
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                                {index === 0 && (
                                                    <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                                                        Utama
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                        {images.length < maxImages && (
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
                                        Maks {maxImages} gambar. Format: JPG,
                                        PNG. Max 2MB per gambar
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

                                {/* Initial Stock Section */}
                                <div className="border-t pt-4">
                                    <h3 className="mb-4 text-lg font-semibold">
                                        Stok Awal
                                    </h3>
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        {isSuperAdmin && (
                                            <FormField
                                                control={form.control}
                                                name="branch_id"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Cabang
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={
                                                                field.onChange
                                                            }
                                                            defaultValue={
                                                                field.value
                                                            }
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Pilih cabang" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {branches.map(
                                                                    (
                                                                        branch,
                                                                    ) => (
                                                                        <SelectItem
                                                                            key={
                                                                                branch.id
                                                                            }
                                                                            value={String(
                                                                                branch.id,
                                                                            )}
                                                                        >
                                                                            {
                                                                                branch.name
                                                                            }
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                        {!isSuperAdmin && branches[0] && (
                                            <div>
                                                <FormLabel>Cabang</FormLabel>
                                                <p className="mt-2 text-sm text-muted-foreground">
                                                    {branches[0].name}
                                                </p>
                                            </div>
                                        )}
                                        <FormField
                                            control={form.control}
                                            name="initial_stock"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Stok Awal
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            placeholder="0"
                                                            {...field}
                                                            value={
                                                                field.value ??
                                                                ''
                                                            }
                                                            onChange={(e) =>
                                                                field.onChange(
                                                                    e.target
                                                                        .value
                                                                        ? Number(
                                                                              e
                                                                                  .target
                                                                                  .value,
                                                                          )
                                                                        : undefined,
                                                                )
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="min_stock"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Stok Minimal
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            placeholder="5"
                                                            {...field}
                                                            value={
                                                                field.value ??
                                                                ''
                                                            }
                                                            onChange={(e) =>
                                                                field.onChange(
                                                                    e.target
                                                                        .value
                                                                        ? Number(
                                                                              e
                                                                                  .target
                                                                                  .value,
                                                                          )
                                                                        : undefined,
                                                                )
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Peringatan jika stok di
                                                        bawah nilai ini
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Button
                                        type="submit"
                                        disabled={form.formState.isSubmitting}
                                    >
                                        {form.formState.isSubmitting && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Simpan
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
