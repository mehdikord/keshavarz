/**
 * Admin permission codes. Stored in `admin_permissions.code` and granted via
 * roles / per-admin overrides. Safe to import from client components.
 */
export const ADMIN_PERMISSIONS = {
  dashboardView: "dashboard.view",
  usersView: "users.view",
  usersUpdate: "users.update",
  usersChangeStatus: "users.change_status",
  providersView: "providers.view",
  providersUpdate: "providers.update",
  providersChangeStatus: "providers.change_status",
  catalogView: "catalog.view",
  catalogManage: "catalog.manage",
  requestsView: "requests.view",
  requestsManage: "requests.manage",
  requestsCancel: "requests.cancel",
  subscriptionsView: "subscriptions.view",
  subscriptionsManage: "subscriptions.manage",
  subscriptionsGrant: "subscriptions.grant",
  paymentsView: "payments.view",
  paymentsRefund: "payments.refund",
  paymentsExport: "payments.export",
  notificationsView: "notifications.view",
  notificationsSend: "notifications.send",
  reportsView: "reports.view",
  reportsExport: "reports.export",
  adminsView: "admins.view",
  adminsManage: "admins.manage",
  rolesView: "roles.view",
  rolesManage: "roles.manage",
  auditLogsView: "audit_logs.view",
  settingsView: "settings.view",
  settingsManage: "settings.manage",
} as const;

export type AdminPermissionCode =
  (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];

/** What the signed-in admin may do; resolved on the server for every request. */
export interface AdminAccess {
  isSuperAdmin: boolean;
  permissions: readonly string[];
}

export function can(access: AdminAccess, permission: AdminPermissionCode): boolean {
  return access.isSuperAdmin || access.permissions.includes(permission);
}
