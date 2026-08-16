import {
  API_ERROR_CODES,
  ApiError,
} from "@/server/errors";

export interface PermissionContext {
  allowedPermissions: ReadonlySet<string>;
  deniedPermissions: ReadonlySet<string>;
  isSuperAdmin: boolean;
}

export function requirePermission(
  context: PermissionContext,
  permission: string,
): void {
  if (context.deniedPermissions.has(permission)) {
    throw new ApiError(
      403,
      API_ERROR_CODES.forbidden,
      "دسترسی لازم برای این عملیات وجود ندارد.",
    );
  }

  if (
    !context.isSuperAdmin &&
    !context.allowedPermissions.has(permission)
  ) {
    throw new ApiError(
      403,
      API_ERROR_CODES.forbidden,
      "دسترسی لازم برای این عملیات وجود ندارد.",
    );
  }
}

export function requireOwnership(
  actorId: bigint,
  ownerId: bigint,
): void {
  if (actorId !== ownerId) {
    throw new ApiError(
      404,
      API_ERROR_CODES.notFound,
      "منبع موردنظر پیدا نشد.",
    );
  }
}
