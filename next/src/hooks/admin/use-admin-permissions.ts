"use client";

import { useCallback, useMemo } from "react";

import { useAdminSession } from "@/hooks/admin/use-admin-session";

export function useAdminPermissions() {
  const { admin } = useAdminSession();

  const permissionSet = useMemo(
    () => new Set(admin?.permissions ?? []),
    [admin?.permissions],
  );

  const can = useCallback(
    (permission?: string) => {
      if (!permission) return true;
      if (!admin) return false;
      if (admin.isSuperAdmin) return true;
      return permissionSet.has(permission);
    },
    [admin, permissionSet],
  );

  const canAny = useCallback(
    (permissions: string[]) => permissions.some((permission) => can(permission)),
    [can],
  );

  const canAll = useCallback(
    (permissions: string[]) => permissions.every((permission) => can(permission)),
    [can],
  );

  return {
    can,
    canAll,
    canAny,
    isSuperAdmin: Boolean(admin?.isSuperAdmin),
    permissions: admin?.permissions ?? [],
  };
}
