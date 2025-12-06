import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { LucideIcon, Plus } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
        icon?: LucideIcon;
    };
    children?: React.ReactNode;
    className?: string;
}

export function PageHeader({ title, description, action, children, className }: PageHeaderProps) {
    const ActionIcon = action?.icon ?? Plus;

    return (
        <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {description && <p className="text-muted-foreground">{description}</p>}
            </div>
            <div className="flex items-center gap-2">
                {children}
                {action && (
                    action.href ? (
                        <Button asChild>
                            <Link href={action.href}>
                                <ActionIcon className="mr-2 h-4 w-4" />
                                {action.label}
                            </Link>
                        </Button>
                    ) : (
                        <Button onClick={action.onClick}>
                            <ActionIcon className="mr-2 h-4 w-4" />
                            {action.label}
                        </Button>
                    )
                )}
            </div>
        </div>
    );
}

