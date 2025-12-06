import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { Branch, BreadcrumbItem } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const branchSchema = z.object({
    name: z.string().min(1, 'Nama cabang wajib diisi').max(100),
    code: z.string().min(1, 'Kode cabang wajib diisi').max(10).toUpperCase(),
    address: z.string().max(255).optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    pic_name: z.string().max(100).optional().nullable(),
    is_active: z.boolean(),
});

type BranchFormValues = z.infer<typeof branchSchema>;

interface Props {
    branch: Branch;
}

export default function BranchEdit({ branch }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Cabang', href: '/branches' },
        { title: branch.name, href: `/branches/${branch.id}` },
        { title: 'Edit', href: `/branches/${branch.id}/edit` },
    ];

    const form = useForm<BranchFormValues>({
        resolver: zodResolver(branchSchema),
        defaultValues: {
            name: branch.name,
            code: branch.code,
            address: branch.address ?? '',
            phone: branch.phone ?? '',
            pic_name: branch.pic_name ?? '',
            is_active: branch.is_active,
        },
    });

    const onSubmit = (data: BranchFormValues) => {
        router.put(`/branches/${branch.id}`, data);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${branch.name}`} />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader title="Edit Cabang" description={`Edit informasi cabang ${branch.name}`} />

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Informasi Cabang</CardTitle>
                        <CardDescription>Perbarui detail cabang</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nama Cabang *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Cabang Jakarta" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Kode Cabang *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="JKT" {...field} className="uppercase" />
                                                </FormControl>
                                                <FormDescription>Kode unik untuk cabang (max 10 karakter)</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Alamat</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Alamat lengkap cabang" {...field} value={field.value ?? ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Telepon</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="021-1234567" {...field} value={field.value ?? ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="pic_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nama PIC</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nama penanggung jawab" {...field} value={field.value ?? ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="is_active"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-2">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <FormLabel className="!mt-0">Cabang Aktif</FormLabel>
                                        </FormItem>
                                    )}
                                />

                                <div className="flex gap-4">
                                    <Button type="submit" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Simpan Perubahan
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => router.get('/branches')}>
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

