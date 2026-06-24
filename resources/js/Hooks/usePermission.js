import { usePage } from '@inertiajs/react';

export function usePermission() {
    const { auth } = usePage().props;
    const permissions = auth?.permissions ?? [];
    const isSuperAdmin = !!auth?.is_super_admin;

    return {
        can: (permission) => isSuperAdmin || permissions.includes(permission),
        cannot: (permission) => !isSuperAdmin && !permissions.includes(permission),
        isSuperAdmin,
    };
}
