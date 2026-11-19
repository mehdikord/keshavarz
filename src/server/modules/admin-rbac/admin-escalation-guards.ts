import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { resolveAdminPermissionContext } from "@/server/modules/admin-rbac/require-admin-permission";

/**
 * Guards that stop an admin from using `admins.manage` / `roles.manage` to
 * gain more power than they already hold. Super admins are exempt: they can
 * already do everything.
 */
export interface AdminActor {
  internalAdminId: bigint;
  isSuperAdmin: boolean;
}

function forbidden(message: string): never {
  throw new ApiError(403, API_ERROR_CODES.forbidden, message);
}

/** Only a super admin may create, reset, (de)activate or re-permission one. */
export function assertCanManageAdminTarget(
  actor: AdminActor,
  target: { id: bigint; isSuperAdmin: boolean | number },
): void {
  if (actor.isSuperAdmin) return;
  if (target.isSuperAdmin === true || target.isSuperAdmin === 1) {
    forbidden("فقط super-admin می‌تواند حساب super-admin را مدیریت کند.");
  }
}

export function assertCanGrantSuperAdmin(actor: AdminActor): void {
  if (!actor.isSuperAdmin) {
    forbidden("فقط super-admin می‌تواند مدیر super-admin بسازد.");
  }
}

/** Admins cannot widen or reset their own access through the management API. */
export function assertNotSelfAccessChange(
  actor: AdminActor,
  targetId: bigint,
  message = "تغییر نقش‌ها یا مجوزهای حساب خودتان مجاز نیست.",
): void {
  if (actor.isSuperAdmin) return;
  if (actor.internalAdminId === targetId) forbidden(message);
}

/** A non-super admin can only hand out permissions they currently hold. */
export async function assertCanGrantPermissions(
  actor: AdminActor,
  permissionCodes: Iterable<string>,
): Promise<void> {
  if (actor.isSuperAdmin) return;
  const codes = [...new Set(permissionCodes)];
  if (codes.length === 0) return;

  const context = await resolveAdminPermissionContext(actor.internalAdminId);
  const missing = codes.filter(
    (code) =>
      !context.allowedPermissions.has(code) || context.deniedPermissions.has(code),
  );
  if (missing.length > 0) {
    forbidden(
      `نمی‌توانید مجوزی را واگذار کنید که خودتان ندارید: ${missing.join("، ")}`,
    );
  }
}
