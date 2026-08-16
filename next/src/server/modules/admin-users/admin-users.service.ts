import { systemClock } from "@/server/clock/clock";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import {
  mapAdminModerationAction,
  mapAdminUserDetail,
  mapAdminUserListItem,
} from "@/server/modules/admin-users/admin-users.mapper";
import {
  applyUserModerationAction,
  findAdminUserDetailByPublicId,
  findModerationActionById,
  findUserByPublicId,
  listAdminUsers,
  listUserModerationActions,
  updateAdminUser,
} from "@/server/modules/admin-users/admin-users.repository";

type ModerationAction =
  | "activate"
  | "deactivate"
  | "suspend"
  | "ban"
  | "unban"
  | "warning";

function resolveModerationEffects(action: ModerationAction): {
  isActive?: 0 | 1;
  revokeSessions: boolean;
} {
  switch (action) {
    case "activate":
    case "unban":
      return { isActive: 1, revokeSessions: false };
    case "deactivate":
    case "suspend":
    case "ban":
      return { isActive: 0, revokeSessions: true };
    case "warning":
      return { revokeSessions: false };
  }
}

export async function listUsersForAdmin(input: {
  cursor?: string;
  isActive?: 0 | 1;
  limit: number;
  q?: string;
}) {
  let cursorId: bigint | undefined;
  if (input.cursor) {
    const cursor = await findUserByPublicId(input.cursor);
    if (!cursor) {
      throw new ApiError(
        400,
        API_ERROR_CODES.validationFailed,
        "cursor معتبر نیست.",
      );
    }
    cursorId = cursor.id;
  }

  const rows = await listAdminUsers({
    cursorId,
    isActive: input.isActive,
    limit: input.limit,
    q: input.q,
  });
  const hasMore = rows.length > input.limit;
  const page = hasMore ? rows.slice(0, input.limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map(mapAdminUserListItem),
    meta: {
      hasMore,
      limit: input.limit,
      nextCursor: hasMore && last ? last.publicId : null,
    },
  };
}

export async function getUserForAdmin(userId: string) {
  const user = await findAdminUserDetailByPublicId(userId);
  if (!user) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "کاربر یافت نشد.");
  }
  return mapAdminUserDetail(user);
}

export async function updateUserForAdmin(
  userId: string,
  input: {
    locale?: string;
    name?: string;
    timezone?: string;
  },
) {
  const user = await findUserByPublicId(userId);
  if (!user) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "کاربر یافت نشد.");
  }

  const existing = await findAdminUserDetailByPublicId(userId);
  const updated = await updateAdminUser(user.id, input);
  return {
    newValues: mapAdminUserDetail(updated),
    oldValues: existing ? mapAdminUserDetail(existing) : null,
    userId: user.id,
  };
}

export async function createUserModerationActionForAdmin(input: {
  action: ModerationAction;
  adminId: bigint;
  endsAt?: string;
  reason: string;
  userId: string;
}) {
  const user = await findUserByPublicId(input.userId);
  if (!user) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "کاربر یافت نشد.");
  }

  const effects = resolveModerationEffects(input.action);
  const now = systemClock.now();
  const moderation = await applyUserModerationAction({
    action: input.action,
    adminId: input.adminId,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    isActive: effects.isActive,
    now,
    reason: input.reason,
    revokeSessions: effects.revokeSessions,
    userId: user.id,
  });

  return {
    moderation: mapAdminModerationAction(moderation),
    userId: user.id,
  };
}

export async function listUserModerationActionsForAdmin(input: {
  cursor?: string;
  limit: number;
  userId: string;
}) {
  const user = await findUserByPublicId(input.userId);
  if (!user) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "کاربر یافت نشد.");
  }

  let cursorId: bigint | undefined;
  if (input.cursor) {
    try {
      cursorId = BigInt(input.cursor);
    } catch {
      throw new ApiError(
        400,
        API_ERROR_CODES.validationFailed,
        "cursor معتبر نیست.",
      );
    }
    const cursor = await findModerationActionById(cursorId);
    if (!cursor) {
      throw new ApiError(
        400,
        API_ERROR_CODES.validationFailed,
        "cursor معتبر نیست.",
      );
    }
  }

  const rows = await listUserModerationActions({
    cursorId,
    limit: input.limit,
    userId: user.id,
  });
  const hasMore = rows.length > input.limit;
  const page = hasMore ? rows.slice(0, input.limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map(mapAdminModerationAction),
    meta: {
      hasMore,
      limit: input.limit,
      nextCursor: hasMore && last ? last.id.toString() : null,
    },
  };
}
