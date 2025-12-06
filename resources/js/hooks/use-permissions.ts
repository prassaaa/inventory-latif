import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import type { SharedData, User } from '@/types';

interface UsePermissionsReturn {
    user: User;
    permissions: string[];
    roles: string[];
    isSuperAdmin: boolean;
    isAdminCabang: boolean;
    branchId: number | null;
    can: (permission: string) => boolean;
    hasRole: (role: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    hasAllPermissions: (permissions: string[]) => boolean;
}

export function usePermissions(): UsePermissionsReturn {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    const permissions = useMemo(() => {
        return user.permissions ?? [];
    }, [user.permissions]);

    const roles = useMemo(() => {
        return user.roles?.map((role) => role.name) ?? [];
    }, [user.roles]);

    const isSuperAdmin = useMemo(() => {
        return roles.includes('super_admin');
    }, [roles]);

    const isAdminCabang = useMemo(() => {
        return roles.includes('admin_cabang');
    }, [roles]);

    const can = (permission: string): boolean => {
        if (isSuperAdmin) return true;
        return permissions.includes(permission);
    };

    const hasRole = (role: string): boolean => {
        return roles.includes(role);
    };

    const hasAnyRole = (roleList: string[]): boolean => {
        return roleList.some((role) => roles.includes(role));
    };

    const hasAnyPermission = (permissionList: string[]): boolean => {
        if (isSuperAdmin) return true;
        return permissionList.some((permission) => permissions.includes(permission));
    };

    const hasAllPermissions = (permissionList: string[]): boolean => {
        if (isSuperAdmin) return true;
        return permissionList.every((permission) => permissions.includes(permission));
    };

    return {
        user,
        permissions,
        roles,
        isSuperAdmin,
        isAdminCabang,
        branchId: user.branch_id,
        can,
        hasRole,
        hasAnyRole,
        hasAnyPermission,
        hasAllPermissions,
    };
}

