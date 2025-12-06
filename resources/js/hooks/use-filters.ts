import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import type { FilterParams } from '@/types';

interface UseFiltersOptions {
    route: string;
    initialFilters?: FilterParams;
    debounceMs?: number;
}

interface UseFiltersReturn {
    filters: FilterParams;
    setFilter: (key: string, value: string | number | undefined) => void;
    setFilters: (newFilters: FilterParams) => void;
    clearFilters: () => void;
    applyFilters: () => void;
    isFiltering: boolean;
}

export function useFilters({ route, initialFilters = {}, debounceMs = 300 }: UseFiltersOptions): UseFiltersReturn {
    const [filters, setFiltersState] = useState<FilterParams>(initialFilters);
    const [isFiltering, setIsFiltering] = useState(false);
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

    const applyFilters = useCallback(
        (newFilters?: FilterParams) => {
            const filtersToApply = newFilters ?? filters;

            // Remove empty values
            const cleanFilters = Object.fromEntries(
                Object.entries(filtersToApply).filter(([, value]) => value !== '' && value !== undefined),
            );

            setIsFiltering(true);
            router.get(
                route,
                cleanFilters,
                {
                    preserveState: true,
                    preserveScroll: true,
                    onFinish: () => setIsFiltering(false),
                },
            );
        },
        [filters, route],
    );

    const setFilter = useCallback(
        (key: string, value: string | number | undefined) => {
            const newFilters = { ...filters, [key]: value };
            setFiltersState(newFilters);

            // Debounce the filter application
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }

            const timer = setTimeout(() => {
                applyFilters(newFilters);
            }, debounceMs);

            setDebounceTimer(timer);
        },
        [filters, debounceTimer, debounceMs, applyFilters],
    );

    const setFilters = useCallback(
        (newFilters: FilterParams) => {
            setFiltersState(newFilters);
            applyFilters(newFilters);
        },
        [applyFilters],
    );

    const clearFilters = useCallback(() => {
        setFiltersState({});
        applyFilters({});
    }, [applyFilters]);

    return {
        filters,
        setFilter,
        setFilters,
        clearFilters,
        applyFilters,
        isFiltering,
    };
}

