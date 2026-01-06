import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Form,
    FormControl,
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { toast } from '@/lib/toast';
import type { Branch, BranchStock, BreadcrumbItem, Product } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { ArrowRight, Loader2, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

const transferSchema = z.object({
    type: z.enum(['request', 'send']),
    from_branch_id: z.string().optional(),
    to_branch_id: z.string().optional(),
    notes: z.string().max(500).optional().nullable(),
    items: z
        .array(
            z.object({
                product_id: z.string().min(1, 'Produk wajib dipilih'),
                quantity_requested: z.number().min(1, 'Minimal 1'),
            }),
        )
        .min(1, 'Minimal 1 item'),
});

type TransferFormValues = z.infer<typeof transferSchema>;

interface TransferTypeOption {
    value: string;
    label: string;
}

interface Props {
    branches: Branch[];
    products: Product[];
    allBranchStocks: Record<number, (BranchStock & { product: Product })[]>;
    userBranchStocks: (BranchStock & { product: Product })[];
    userBranch: Branch;
    transferTypes: TransferTypeOption[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Transfer', href: '/transfers' },
    { title: 'Buat Transfer', href: '/transfers/create' },
];

export default function TransferCreate({
    branches,
    products,
    allBranchStocks,
    userBranchStocks,
    userBranch,
    transferTypes,
}: Props) {
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
        new Set(),
    );

    const form = useForm<TransferFormValues>({
        resolver: zodResolver(transferSchema),
        defaultValues: {
            type: 'request',
            from_branch_id: '',
            to_branch_id: '',
            notes: '',
            items: [{ product_id: '', quantity_requested: 1 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'items',
    });

    // eslint-disable-next-line react-hooks/incompatible-library -- React Compiler auto-skips incompatible hooks
    const transferType = form.watch('type');
    const selectedFromBranchId = form.watch('from_branch_id');
    const selectedToBranchId = form.watch('to_branch_id');

    // Get stocks based on transfer type
    const branchStocks = useMemo(() => {
        if (transferType === 'send') {
            // User is sending - show their own stock
            return userBranchStocks || [];
        } else {
            // User is requesting - show selected branch's stock
            if (!selectedFromBranchId) return [];
            return allBranchStocks[Number(selectedFromBranchId)] || [];
        }
    }, [transferType, selectedFromBranchId, allBranchStocks, userBranchStocks]);

    const getAvailableStock = (productId: string) => {
        const stock = branchStocks.find(
            (s) => String(s.product_id) === productId,
        );
        return stock?.quantity ?? 0;
    };

    const handleTypeChange = (type: 'request' | 'send') => {
        form.setValue('type', type);
        form.setValue('from_branch_id', '');
        form.setValue('to_branch_id', '');
        setSelectedProducts(new Set());
        form.setValue('items', [{ product_id: '', quantity_requested: 1 }]);
    };

    const handleBranchChange = (branchId: string) => {
        if (transferType === 'request') {
            form.setValue('from_branch_id', branchId);
        } else {
            form.setValue('to_branch_id', branchId);
        }
        setSelectedProducts(new Set());
        form.setValue('items', [{ product_id: '', quantity_requested: 1 }]);
    };

    const handleProductChange = (index: number, productId: string) => {
        const oldProductId = form.getValues(`items.${index}.product_id`);
        if (oldProductId) {
            setSelectedProducts((prev) => {
                const next = new Set(prev);
                next.delete(oldProductId);
                return next;
            });
        }
        setSelectedProducts((prev) => new Set(prev).add(productId));
        form.setValue(`items.${index}.product_id`, productId);
    };

    const handleRemoveItem = (index: number) => {
        const productId = form.getValues(`items.${index}.product_id`);
        if (productId) {
            setSelectedProducts((prev) => {
                const next = new Set(prev);
                next.delete(productId);
                return next;
            });
        }
        remove(index);
    };

    const onSubmit = (data: TransferFormValues) => {
        router.post('/transfers', data, {
            onSuccess: () => {
                const action =
                    data.type === 'send' ? 'pengiriman' : 'permintaan';
                toast.success(
                    'Transfer Berhasil Dibuat!',
                    `Transfer ${action} telah dibuat`,
                );
            },
            onError: (errors) => {
                toast.error(
                    'Gagal Membuat Transfer',
                    Object.values(errors)[0] as string,
                );
            },
        });
    };

    // Get products that have stock
    const productsWithStock = useMemo(() => {
        const stockProductIds = branchStocks.map((s) => String(s.product_id));
        return products.filter((p) => stockProductIds.includes(String(p.id)));
    }, [products, branchStocks]);

    const getAvailableProductsForRow = (currentProductId: string) => {
        return productsWithStock.filter(
            (p) =>
                !selectedProducts.has(String(p.id)) ||
                String(p.id) === currentProductId,
        );
    };

    const getProductLabel = (productId: string) => {
        const product = products.find((p) => String(p.id) === productId);
        return product ? `${product.sku} - ${product.name}` : '';
    };

    const selectedBranch =
        transferType === 'request'
            ? branches.find((b) => String(b.id) === selectedFromBranchId)
            : branches.find((b) => String(b.id) === selectedToBranchId);

    const showItemsTable = transferType === 'send' || selectedFromBranchId;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Transfer" />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader
                    title="Buat Transfer Stok"
                    description={`Transfer stok untuk ${userBranch?.name || 'Cabang Anda'}`}
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Form Transfer</CardTitle>
                        <CardDescription>
                            Pilih tipe transfer: minta stok dari cabang lain
                            atau kirim stok ke cabang lain
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-6"
                            >
                                {/* Transfer Type Selection */}
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Tipe Transfer *
                                            </FormLabel>
                                            <div className="flex gap-4">
                                                {transferTypes.map((t) => (
                                                    <Button
                                                        key={t.value}
                                                        type="button"
                                                        variant={
                                                            field.value ===
                                                            t.value
                                                                ? 'default'
                                                                : 'outline'
                                                        }
                                                        onClick={() =>
                                                            handleTypeChange(
                                                                t.value as
                                                                    | 'request'
                                                                    | 'send',
                                                            )
                                                        }
                                                        className="flex-1"
                                                    >
                                                        {t.label}
                                                    </Button>
                                                ))}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Branch Selection based on type */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {transferType === 'request' ? (
                                        <>
                                            <FormField
                                                control={form.control}
                                                name="from_branch_id"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Dari Cabang
                                                            (Pengirim) *
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={
                                                                handleBranchChange
                                                            }
                                                            value={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Pilih cabang pengirim" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {branches.map(
                                                                    (b) => (
                                                                        <SelectItem
                                                                            key={
                                                                                b.id
                                                                            }
                                                                            value={String(
                                                                                b.id,
                                                                            )}
                                                                        >
                                                                            {
                                                                                b.name
                                                                            }{' '}
                                                                            (
                                                                            {
                                                                                b.code
                                                                            }
                                                                            )
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div>
                                                <FormLabel>
                                                    Ke Cabang (Penerima)
                                                </FormLabel>
                                                <Input
                                                    value={`${userBranch?.name || 'Cabang Anda'} (${userBranch?.code || '-'})`}
                                                    disabled
                                                    className="mt-2"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <FormLabel>
                                                    Dari Cabang (Pengirim)
                                                </FormLabel>
                                                <Input
                                                    value={`${userBranch?.name || 'Cabang Anda'} (${userBranch?.code || '-'})`}
                                                    disabled
                                                    className="mt-2"
                                                />
                                            </div>
                                            <FormField
                                                control={form.control}
                                                name="to_branch_id"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Ke Cabang (Penerima)
                                                            *
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={
                                                                handleBranchChange
                                                            }
                                                            value={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Pilih cabang penerima" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {branches.map(
                                                                    (b) => (
                                                                        <SelectItem
                                                                            key={
                                                                                b.id
                                                                            }
                                                                            value={String(
                                                                                b.id,
                                                                            )}
                                                                        >
                                                                            {
                                                                                b.name
                                                                            }{' '}
                                                                            (
                                                                            {
                                                                                b.code
                                                                            }
                                                                            )
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </>
                                    )}
                                </div>

                                {/* Info Box */}
                                {(selectedFromBranchId ||
                                    selectedToBranchId) && (
                                    <div
                                        className={`rounded-lg p-4 ${transferType === 'send' ? 'bg-green-50 dark:bg-green-950' : 'bg-blue-50 dark:bg-blue-950'}`}
                                    >
                                        <p
                                            className={`flex items-center gap-2 text-sm ${transferType === 'send' ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'}`}
                                        >
                                            <strong>
                                                {userBranch?.name ||
                                                    'Cabang Anda'}
                                            </strong>
                                            <ArrowRight className="h-4 w-4" />
                                            <strong>
                                                {selectedBranch?.name}
                                            </strong>
                                        </p>
                                        <p
                                            className={`mt-1 text-xs ${transferType === 'send' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}
                                        >
                                            {transferType === 'send'
                                                ? `Anda akan mengirim stok ke ${selectedBranch?.name}. Stok akan dikurangi dari cabang Anda setelah pengiriman.`
                                                : `Anda meminta stok dari ${selectedBranch?.name}. Setelah disetujui, mereka akan mengirim stok ke Anda.`}
                                        </p>
                                    </div>
                                )}

                                {/* Items Table */}
                                {showItemsTable && (
                                    <>
                                        <div>
                                            <div className="mb-4 flex items-center justify-between">
                                                <FormLabel>
                                                    Item Transfer *
                                                </FormLabel>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        append({
                                                            product_id: '',
                                                            quantity_requested: 1,
                                                        })
                                                    }
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Tambah Item
                                                </Button>
                                            </div>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>
                                                            Produk
                                                        </TableHead>
                                                        <TableHead className="w-32">
                                                            Stok{' '}
                                                            {transferType ===
                                                            'send'
                                                                ? `di ${userBranch?.name || 'Cabang Anda'}`
                                                                : `di ${selectedBranch?.name || 'Cabang'}`}
                                                        </TableHead>
                                                        <TableHead className="w-32">
                                                            Jumlah
                                                        </TableHead>
                                                        <TableHead className="w-16"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {fields.map(
                                                        (field, index) => {
                                                            const productId =
                                                                form.getValues(
                                                                    `items.${index}.product_id`,
                                                                );
                                                            const availableStock =
                                                                getAvailableStock(
                                                                    productId,
                                                                );
                                                            const rowProducts =
                                                                getAvailableProductsForRow(
                                                                    productId,
                                                                );
                                                            return (
                                                                <TableRow
                                                                    key={
                                                                        field.id
                                                                    }
                                                                >
                                                                    <TableCell className="min-w-[200px]">
                                                                        <FormField
                                                                            control={
                                                                                form.control
                                                                            }
                                                                            name={`items.${index}.product_id`}
                                                                            render={({
                                                                                field: f,
                                                                            }) => (
                                                                                <Select
                                                                                    onValueChange={(
                                                                                        v,
                                                                                    ) =>
                                                                                        handleProductChange(
                                                                                            index,
                                                                                            v,
                                                                                        )
                                                                                    }
                                                                                    value={
                                                                                        f.value
                                                                                    }
                                                                                >
                                                                                    <SelectTrigger className="w-full">
                                                                                        <SelectValue
                                                                                            placeholder="Pilih produk"
                                                                                            className="truncate"
                                                                                        >
                                                                                            <span className="block truncate">
                                                                                                {f.value
                                                                                                    ? getProductLabel(
                                                                                                          f.value,
                                                                                                      )
                                                                                                    : 'Pilih produk'}
                                                                                            </span>
                                                                                        </SelectValue>
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        {rowProducts.map(
                                                                                            (
                                                                                                p,
                                                                                            ) => (
                                                                                                <SelectItem
                                                                                                    key={
                                                                                                        p.id
                                                                                                    }
                                                                                                    value={String(
                                                                                                        p.id,
                                                                                                    )}
                                                                                                >
                                                                                                    {
                                                                                                        p.sku
                                                                                                    }{' '}
                                                                                                    -{' '}
                                                                                                    {
                                                                                                        p.name
                                                                                                    }
                                                                                                </SelectItem>
                                                                                            ),
                                                                                        )}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            )}
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell className="text-center font-medium">
                                                                        {
                                                                            availableStock
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <FormField
                                                                            control={
                                                                                form.control
                                                                            }
                                                                            name={`items.${index}.quantity_requested`}
                                                                            render={({
                                                                                field: f,
                                                                            }) => (
                                                                                <Input
                                                                                    type="number"
                                                                                    min={
                                                                                        1
                                                                                    }
                                                                                    max={
                                                                                        availableStock
                                                                                    }
                                                                                    {...f}
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        f.onChange(
                                                                                            Number(
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                            ),
                                                                                        )
                                                                                    }
                                                                                />
                                                                            )}
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() =>
                                                                                handleRemoveItem(
                                                                                    index,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                fields.length ===
                                                                                1
                                                                            }
                                                                        >
                                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        },
                                                    )}
                                                </TableBody>
                                            </Table>
                                            {form.formState.errors.items
                                                ?.message && (
                                                <p className="mt-2 text-sm text-red-500">
                                                    {
                                                        form.formState.errors
                                                            .items.message
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="notes"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Catatan
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Catatan tambahan..."
                                                            {...field}
                                                            value={
                                                                field.value ??
                                                                ''
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                )}

                                <div className="flex gap-4">
                                    <Button
                                        type="submit"
                                        disabled={
                                            form.formState.isSubmitting ||
                                            (!selectedFromBranchId &&
                                                !selectedToBranchId)
                                        }
                                    >
                                        {form.formState.isSubmitting && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        {transferType === 'send'
                                            ? 'Buat Pengiriman'
                                            : 'Kirim Permintaan'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.get('/transfers')}
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
