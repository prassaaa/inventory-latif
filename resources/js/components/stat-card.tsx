import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon?: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
    valueClassName?: string;
    variant?: 'default' | 'destructive';
}

export function StatCard({ title, value, description, icon: Icon, trend, className, valueClassName, variant = 'default' }: StatCardProps) {
    const variantStyles = {
        default: '',
        destructive: 'border-red-200 bg-red-50',
    };
    const iconStyles = {
        default: 'text-muted-foreground',
        destructive: 'text-red-500',
    };
    const valueStyles = {
        default: '',
        destructive: 'text-red-600',
    };

    return (
        <Card className={cn(variantStyles[variant], className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                {Icon && <Icon className={cn('h-4 w-4', iconStyles[variant])} />}
            </CardHeader>
            <CardContent>
                <div className={cn('text-2xl font-bold', valueStyles[variant], valueClassName)}>{value}</div>
                {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
                {trend && (
                    <p className={cn('text-xs mt-1', trend.isPositive ? 'text-green-600' : 'text-red-600')}>
                        {trend.isPositive ? '+' : ''}
                        {trend.value}% dari bulan lalu
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

interface StatCardGridProps {
    children: React.ReactNode;
    columns?: 2 | 3 | 4;
}

export function StatCardGrid({ children, columns = 4 }: StatCardGridProps) {
    const gridCols = {
        2: 'md:grid-cols-2',
        3: 'md:grid-cols-3',
        4: 'md:grid-cols-2 lg:grid-cols-4',
    };

    return <div className={cn('grid gap-4', gridCols[columns])}>{children}</div>;
}

