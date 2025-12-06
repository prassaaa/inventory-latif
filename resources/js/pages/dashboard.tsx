import { StatCard, StatCardGrid } from '@/components/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { Branch, BranchStock, BreadcrumbItem, DashboardStats } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertTriangle, ArrowLeftRight, DollarSign, Package, ShoppingCart, TrendingUp, Warehouse } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface SalesByBranch {
    branch_id: number;
    total: number;
    count: number;
    branch: Branch;
}

interface LowStockItem extends Omit<BranchStock, 'product'> {
    product: {
        id: number;
        name: string;
        sku: string;
    };
}

interface DashboardProps {
    stats: DashboardStats;
    salesByBranch?: SalesByBranch[];
    lowStockItems: LowStockItem[];
    branches?: Branch[];
    branch?: Branch;
    isSuperAdmin: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard({ stats, salesByBranch, lowStockItems, branch, isSuperAdmin }: DashboardProps) {
    const chartData =
        salesByBranch?.map((item) => ({
            name: item.branch?.code || `Branch ${item.branch_id}`,
            total: item.total,
            count: item.count,
        })) || [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        {isSuperAdmin ? 'Ringkasan data semua cabang' : `Ringkasan data cabang ${branch?.name || ''}`}
                    </p>
                </div>

                {/* Stats Cards */}
                <StatCardGrid columns={4}>
                    <StatCard
                        title="Total Stok"
                        value={formatNumber(stats.totalStock)}
                        description="Unit produk"
                        icon={Package}
                    />
                    <StatCard
                        title="Nilai Stok"
                        value={formatCurrency(stats.totalStockValue)}
                        description="Total nilai inventory"
                        icon={Warehouse}
                    />
                    <StatCard
                        title="Penjualan Hari Ini"
                        value={formatCurrency(stats.salesToday)}
                        description={`${stats.salesCountToday} transaksi`}
                        icon={ShoppingCart}
                    />
                    <StatCard
                        title="Penjualan Bulan Ini"
                        value={formatCurrency(stats.salesThisMonth)}
                        description={`${stats.salesCountThisMonth} transaksi`}
                        icon={TrendingUp}
                    />
                </StatCardGrid>

                {/* Transfer Stats for Admin Cabang */}
                {!isSuperAdmin && (
                    <StatCardGrid columns={3}>
                        <StatCard
                            title="Transfer Keluar"
                            value={formatNumber(stats.outgoingTransfers || 0)}
                            description="Menunggu proses"
                            icon={ArrowLeftRight}
                        />
                        <StatCard
                            title="Transfer Masuk"
                            value={formatNumber(stats.incomingTransfers || 0)}
                            description="Siap diterima"
                            icon={ArrowLeftRight}
                        />
                        <StatCard
                            title="Stok Rendah"
                            value={formatNumber(lowStockItems.length)}
                            description="Produk perlu restock"
                            icon={AlertTriangle}
                            valueClassName={lowStockItems.length > 0 ? 'text-red-600' : ''}
                        />
                    </StatCardGrid>
                )}

                {/* Pending Transfers for Super Admin */}
                {isSuperAdmin && stats.pendingTransfers !== undefined && (
                    <StatCardGrid columns={2}>
                        <StatCard
                            title="Transfer Pending"
                            value={formatNumber(stats.pendingTransfers)}
                            description="Menunggu approval"
                            icon={ArrowLeftRight}
                            valueClassName={stats.pendingTransfers > 0 ? 'text-yellow-600' : ''}
                        />
                        <StatCard
                            title="Stok Rendah"
                            value={formatNumber(lowStockItems.length)}
                            description="Produk perlu restock"
                            icon={AlertTriangle}
                            valueClassName={lowStockItems.length > 0 ? 'text-red-600' : ''}
                        />
                    </StatCardGrid>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Sales by Branch Chart - Super Admin Only */}
                    {isSuperAdmin && chartData.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Penjualan per Cabang
                                </CardTitle>
                                <CardDescription>Bulan ini</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chartData}>
                                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`}
                                        />
                                        <Tooltip
                                            formatter={(value: number) => [formatCurrency(value), 'Total']}
                                            labelFormatter={(label) => `Cabang: ${label}`}
                                        />
                                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}

                    {/* Low Stock Items */}
                    <Card className={isSuperAdmin && chartData.length > 0 ? '' : 'lg:col-span-2'}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                Stok Rendah
                            </CardTitle>
                            <CardDescription>Produk yang perlu segera di-restock</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {lowStockItems.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Produk</TableHead>
                                            <TableHead className="text-right">Stok</TableHead>
                                            <TableHead className="text-right">Min. Stok</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {lowStockItems.slice(0, 10).map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-mono text-sm">{item.product?.sku}</TableCell>
                                                <TableCell>{item.product?.name}</TableCell>
                                                <TableCell className="text-right">
                                                    <span className={item.quantity <= item.min_stock ? 'text-red-600 font-semibold' : ''}>
                                                        {item.quantity}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">{item.min_stock}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <Package className="h-12 w-12 text-muted-foreground/50" />
                                    <p className="mt-2 text-sm text-muted-foreground">Semua stok dalam kondisi baik</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
