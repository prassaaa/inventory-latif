import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SelectOption } from '@/types';
import { Search, X } from 'lucide-react';

interface FilterBarProps {
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    filters?: FilterConfig[];
    onClearFilters?: () => void;
    showClearButton?: boolean;
    children?: React.ReactNode;
}

interface FilterConfig {
    key?: string;
    label: string;
    value: string | number | undefined;
    options: SelectOption[];
    onChange: (value: string) => void;
}

export function FilterBar({
    searchPlaceholder = 'Cari...',
    searchValue,
    onSearchChange,
    filters = [],
    onClearFilters,
    showClearButton = true,
    children,
}: FilterBarProps) {
    const hasActiveFilters = searchValue || filters.some((f) => f.value);

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {onSearchChange && (
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={searchValue ?? ''}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10"
                    />
                </div>
            )}

            {filters.map((filter, index) => (
                <Select key={filter.key ?? filter.label ?? index} value={String(filter.value ?? '')} onValueChange={filter.onChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={filter.label} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua {filter.label}</SelectItem>
                        {filter.options.map((option) => (
                            <SelectItem key={option.value} value={String(option.value)}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ))}

            {children}

            {showClearButton && hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={onClearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Reset Filter
                </Button>
            )}
        </div>
    );
}

