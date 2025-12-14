import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { toast } from '@/lib/toast';
import type { Branch, BreadcrumbItem, Role } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

const userSchema = z.object({
    name: z.string().min(1, 'Nama wajib diisi').max(100),
    email: z.string().email('Email tidak valid'),
    password: z.string().min(8, 'Password minimal 8 karakter'),
    password_confirmation: z.string(),
    role: z.string().min(1, 'Role wajib dipilih'),
    branch_id: z.string().optional().nullable(),
    is_active: z.boolean(),
}).refine((data) => data.password === data.password_confirmation, {
    message: 'Konfirmasi password tidak cocok',
    path: ['password_confirmation'],
});

type UserFormValues = z.infer<typeof userSchema>;

interface Props {
    branches: Branch[];
    roles: Role[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Pengguna', href: '/users' },
    { title: 'Tambah Pengguna', href: '/users/create' },
];

export default function UserCreate({ branches, roles }: Props) {
    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
            role: '',
            branch_id: '',
            is_active: true,
        },
    });

    const selectedRole = useWatch({ control: form.control, name: 'role' });
    const isAdminCabang = selectedRole === 'admin_cabang';

    const onSubmit = (data: UserFormValues) => {
        router.post('/users', data, {
            onSuccess: () => {
                toast.success('Pengguna Berhasil Ditambahkan!', `Pengguna "${data.name}" telah ditambahkan`);
            },
            onError: (errors) => {
                toast.error('Gagal Menambahkan Pengguna', Object.values(errors)[0] as string);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Pengguna" />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader title="Tambah Pengguna" description="Buat pengguna baru" />

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Informasi Pengguna</CardTitle>
                        <CardDescription>Masukkan detail pengguna baru</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nama *</FormLabel>
                                        <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <FormField control={form.control} name="email" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email *</FormLabel>
                                        <FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField control={form.control} name="password" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password *</FormLabel>
                                            <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="password_confirmation" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Konfirmasi Password *</FormLabel>
                                            <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FormField control={form.control} name="role" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Role *</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Pilih role" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {roles.map((role) => (
                                                        <SelectItem key={role.id} value={role.name}>
                                                            {role.name === 'super_admin' ? 'Super Admin' : 'Admin Cabang'}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="branch_id" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cabang {isAdminCabang && '*'}</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={!isAdminCabang}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Pilih cabang" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {branches.map((branch) => (
                                                        <SelectItem key={branch.id} value={String(branch.id)}>
                                                            {branch.name} ({branch.code})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>Wajib untuk Admin Cabang</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                                <FormField control={form.control} name="is_active" render={({ field }) => (
                                    <FormItem className="flex items-center gap-2">
                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        <FormLabel className="!mt-0">Pengguna Aktif</FormLabel>
                                    </FormItem>
                                )} />

                                <div className="flex gap-4">
                                    <Button type="submit" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Simpan
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => router.get('/users')}>Batal</Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

