import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { usePermissions } from '@/hooks/use-permissions';
import { dashboard } from '@/routes';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeftRight,
    BarChart3,
    Building2,
    FileText,
    FolderTree,
    LayoutGrid,
    Package,
    ShoppingCart,
    Users,
    Warehouse,
} from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { isSuperAdmin } = usePermissions();
    const { notifications } = usePage<SharedData>().props;

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
    ];

    // Master Data - Super Admin only for branches & users
    const masterDataItems: NavItem[] = [
        ...(isSuperAdmin
            ? [
                  {
                      title: 'Cabang',
                      href: '/branches',
                      icon: Building2,
                  },
              ]
            : []),
        {
            title: 'Kategori',
            href: '/categories',
            icon: FolderTree,
        },
        {
            title: 'Produk',
            href: '/products',
            icon: Package,
        },
        {
            title: 'Request Produk',
            href: '/product-requests',
            icon: FileText,
            badge: notifications.productRequests,
            badgeVariant: 'destructive',
        },
        ...(isSuperAdmin
            ? [
                  {
                      title: 'Pengguna',
                      href: '/users',
                      icon: Users,
                  },
              ]
            : []),
    ];

    const inventoryItems: NavItem[] = [
        {
            title: 'Stok',
            href: '/stocks',
            icon: Warehouse,
            badge: notifications.lowStock,
            badgeVariant: 'warning',
        },
        {
            title: 'Transfer',
            href: '/transfers',
            icon: ArrowLeftRight,
            badge: notifications.transfers,
            badgeVariant: 'destructive',
        },
        {
            title: 'Penjualan',
            href: '/sales',
            icon: ShoppingCart,
        },
    ];

    const reportItems: NavItem[] = [
        {
            title: 'Laporan Penjualan',
            href: '/reports/sales',
            icon: BarChart3,
        },
        {
            title: 'Laporan Stok',
            href: '/reports/stock',
            icon: Warehouse,
        },
        {
            title: 'Laporan Transfer',
            href: '/reports/transfers',
            icon: ArrowLeftRight,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} label="Menu" />
                <NavMain items={masterDataItems} label="Master Data" />
                <NavMain items={inventoryItems} label="Inventory" />
                <NavMain items={reportItems} label="Laporan" />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
