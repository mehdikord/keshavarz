"use client";

import { useAdminPermissions } from "@/hooks/admin/use-admin-permissions";

interface AdminCanProps {
  permission?: string;
  permissions?: string[];
  mode?: "all" | "any";
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminCan({
  permission,
  permissions,
  mode = "any",
  fallback = null,
  children,
}: AdminCanProps) {
  const { can, canAll, canAny } = useAdminPermissions();

  let allowed = true;
  if (permission) {
    allowed = can(permission);
  } else if (permissions && permissions.length > 0) {
    allowed = mode === "all" ? canAll(permissions) : canAny(permissions);
  }

  if (!allowed) {
    return fallback;
  }

  return children;
}
