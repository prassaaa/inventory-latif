import { PageHeader } from '@/components/page-header';
import { ActiveBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime } from '@/lib/utils';
import type { Branch, BreadcrumbItem, Role, User } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Building2, Calendar, Mail, Pencil, Shield, User as UserIcon } from 'lucide-react';

interface UserWithRelations extends Omit<User, 'branch' | 'roles'> {
    branch: Branch | null;
    roles: Role[];
}

interface Props {
    user: UserWithRelations;
}

export default function UserShow({ user }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Pengguna', href: '/users' },
        { title: user.name, href: `/users/${user.id}` },
    ];

    const isSuperAdmin = user.roles[0]?.name === 'super_admin';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={user.name} />
            <div className="flex flex-col gap-6 p-4">
                <PageHeader title={user.name} description={user.email}>
                    <Button asChild>
                        <Link href={`/users/${user.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                </PageHeader>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* User Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserIcon className="h-5 w-5" />
                                Informasi Pengguna
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-center">
                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <ActiveBadge isActive={user.is_active} />
                            </div>

                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{user.email}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <Badge variant={isSuperAdmin ? 'default' : 'secondary'}>
                                    {isSuperAdmin ? 'Super Admin' : 'Admin Cabang'}
                                </Badge>
                            </div>

                            {user.branch && (
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <Link href={`/branches/${user.branch.id}`} className="hover:underline">
                                        {user.branch.name} ({user.branch.code})
                                    </Link>
                                </div>
                            )}

                            {user.created_at && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Bergabung {formatDateTime(user.created_at)}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Permissions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Hak Akses
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {isSuperAdmin ? (
                                    <>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Super Admin memiliki akses penuh ke semua fitur sistem.
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge>Kelola Cabang</Badge>
                                            <Badge>Kelola Kategori</Badge>
                                            <Badge>Kelola Produk</Badge>
                                            <Badge>Kelola Pengguna</Badge>
                                            <Badge>Kelola Stok</Badge>
                                            <Badge>Kelola Transfer</Badge>
                                            <Badge>Kelola Penjualan</Badge>
                                            <Badge>Lihat Laporan</Badge>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Admin Cabang memiliki akses terbatas pada cabang yang ditugaskan.
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary">Lihat Produk</Badge>
                                            <Badge variant="secondary">Kelola Stok Cabang</Badge>
                                            <Badge variant="secondary">Buat Transfer</Badge>
                                            <Badge variant="secondary">Terima Transfer</Badge>
                                            <Badge variant="secondary">Buat Penjualan</Badge>
                                            <Badge variant="secondary">Lihat Laporan Cabang</Badge>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

