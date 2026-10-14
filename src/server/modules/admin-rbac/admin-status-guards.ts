import { API_ERROR_CODES, ApiError } from "@/server/errors";
import {
  countActiveSuperAdmins,
  findAdminStatusTarget,
} from "@/server/modules/admin-auth/admin-auth.repository";

export function assertNotSelfDeactivation(
  actorAdminId: bigint,
  targetAdminId: bigint,
  nextIsActive: boolean,
): void {
  if (actorAdminId === targetAdminId && !nextIsActive) {
    throw new ApiError(
      403,
      API_ERROR_CODES.forbidden,
      "مدیر نمی‌تواند حساب خودش را غیرفعال کند.",
    );
  }
}

export async function assertNotLastSuperAdminRemoval(
  targetAdminId: bigint,
  nextIsSuperAdmin: boolean,
  nextIsActive: boolean,
  nextDeleted: boolean,
): Promise<void> {
  const target = await findAdminStatusTarget(targetAdminId);
  if (!target || target.isSuperAdmin !== 1) {
    return;
  }

  const removingSuperAdminPower =
    !nextIsSuperAdmin || !nextIsActive || nextDeleted;

  if (!removingSuperAdminPower) {
    return;
  }

  const remaining = await countActiveSuperAdmins(targetAdminId);
  if (remaining === 0) {
    throw new ApiError(
      403,
      API_ERROR_CODES.forbidden,
      "حذف یا غیرفعال‌سازی آخرین super-admin مجاز نیست.",
    );
  }
}
