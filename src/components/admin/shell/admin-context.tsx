"use client";

import { createContext, useContext } from "react";

import type { AdminAccess, AdminPermissionCode } from "@/lib/admin/permissions";
import { can } from "@/lib/admin/permissions";

export interface AdminViewerSummary {
  access: AdminAccess;
  id: string;
  image: string | null;
  isSuperAdmin: boolean;
  lastLoginAt: string | null;
  name: string;
  phone: string;
  roles: string[];
}

const AdminViewerContext = createContext<AdminViewerSummary | null>(null);

export function AdminViewerProvider({
  children,
  viewer,
}: {
  children: React.ReactNode;
  viewer: AdminViewerSummary;
}) {
  return <AdminViewerContext.Provider value={viewer}>{children}</AdminViewerContext.Provider>;
}

export function useAdminViewer(): AdminViewerSummary {
  const viewer = useContext(AdminViewerContext);
  if (!viewer) throw new Error("useAdminViewer must be used inside the admin panel layout.");
  return viewer;
}

export function useCan(permission: AdminPermissionCode): boolean {
  return can(useAdminViewer().access, permission);
}
