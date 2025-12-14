import { Badge } from '@/components/ui/badge';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn, resolveUrl } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

interface NavMainProps {
    items: NavItem[];
    label?: string;
}

export function NavMain({ items = [], label = 'Platform' }: NavMainProps) {
    const page = usePage();

    if (items.length === 0) return null;

    const getBadgeVariant = (variant?: 'default' | 'destructive' | 'warning') => {
        if (variant === 'warning') return 'outline';
        return variant || 'destructive';
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={page.url.startsWith(resolveUrl(item.href))}
                            tooltip={{ children: item.title }}
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                                {item.badge !== undefined && item.badge > 0 && (
                                    <Badge
                                        variant={getBadgeVariant(item.badgeVariant)}
                                        className={cn(
                                            'ml-auto h-5 min-w-5 px-1.5 text-[10px] font-semibold',
                                            item.badgeVariant === 'warning' && 'bg-yellow-100 text-yellow-800 border-yellow-300',
                                            item.badgeVariant === 'destructive' && 'animate-pulse',
                                        )}
                                    >
                                        {item.badge > 99 ? '99+' : item.badge}
                                    </Badge>
                                )}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
