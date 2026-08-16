import { systemClock } from "@/server/clock/clock";
import { runInTransaction } from "@/server/db/transaction";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import {
  mapAdminProviderDetail,
  mapAdminProviderListItem,
  mapAdminProviderService,
} from "@/server/modules/admin-providers/admin-providers.mapper";
import {
  approveAdminProviderProfile,
  createAdminPriceChangeHistory,
  findActiveSubscriptionSummary,
  findAdminProviderDetailByUserPublicId,
  findAdminProviderServiceById,
  findProviderCursorByUserPublicId,
  findProviderProfileIdByUserPublicId,
  listAdminProviderServices,
  listAdminProviders,
  updateAdminProviderAvailability,
  updateAdminProviderProfile,
  updateAdminProviderServiceInTransaction,
} from "@/server/modules/admin-providers/admin-providers.repository";

function decimalOrNull(
  value: { toString(): string } | string | null,
): string | null {
  if (value === null) {
    return null;
  }
  return typeof value === "string" ? value : value.toString();
}

async function requireProviderProfile(providerId: string) {
  const profile = await findProviderProfileIdByUserPublicId(providerId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "Provider یافت نشد.");
  }
  return profile;
}

export async function listProvidersForAdmin(input: {
  approved?: "yes" | "no";
  cursor?: string;
  isActive?: 0 | 1;
  isAvailable?: 0 | 1;
  limit: number;
  q?: string;
}) {
  let cursorId: bigint | undefined;
  if (input.cursor) {
    const cursor = await findProviderCursorByUserPublicId(input.cursor);
    if (!cursor) {
      throw new ApiError(
        400,
        API_ERROR_CODES.validationFailed,
        "cursor معتبر نیست.",
      );
    }
    cursorId = cursor.id;
  }

  const rows = await listAdminProviders({
    approved: input.approved,
    cursorId,
    isActive: input.isActive,
    isAvailable: input.isAvailable,
    limit: input.limit,
    q: input.q,
  });
  const hasMore = rows.length > input.limit;
  const page = hasMore ? rows.slice(0, input.limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map(mapAdminProviderListItem),
    meta: {
      hasMore,
      limit: input.limit,
      nextCursor: hasMore && last ? last.user.publicId : null,
    },
  };
}

export async function getProviderForAdmin(providerId: string) {
  const profile = await findAdminProviderDetailByUserPublicId(providerId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "Provider یافت نشد.");
  }

  const subscription = await findActiveSubscriptionSummary(
    profile.id,
    systemClock.now(),
  );
  return mapAdminProviderDetail(profile, subscription);
}

export async function updateProviderForAdmin(
  providerId: string,
  input: {
    bio?: string | null;
    workLatitude?: string | null;
    workLongitude?: string | null;
    workRadiusKm?: number;
  },
) {
  const existing = await findAdminProviderDetailByUserPublicId(providerId);
  if (!existing) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "Provider یافت نشد.");
  }

  const nextLatitude =
    input.workLatitude !== undefined
      ? input.workLatitude
      : decimalOrNull(existing.workLatitude);
  const nextLongitude =
    input.workLongitude !== undefined
      ? input.workLongitude
      : decimalOrNull(existing.workLongitude);

  if ((nextLatitude === null) !== (nextLongitude === null)) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "مرکز کار باید هر دو مختصات یا هر دو null باشد.",
    );
  }

  const updated = await updateAdminProviderProfile(existing.id, {
    ...(input.bio !== undefined ? { bio: input.bio } : {}),
    ...(input.workLatitude !== undefined
      ? { workLatitude: input.workLatitude }
      : {}),
    ...(input.workLongitude !== undefined
      ? { workLongitude: input.workLongitude }
      : {}),
    ...(input.workRadiusKm !== undefined
      ? { workRadiusKm: input.workRadiusKm }
      : {}),
  });

  const subscription = await findActiveSubscriptionSummary(
    updated.id,
    systemClock.now(),
  );

  return {
    newValues: mapAdminProviderDetail(updated, subscription),
    oldValues: mapAdminProviderDetail(
      existing,
      await findActiveSubscriptionSummary(existing.id, systemClock.now()),
    ),
    profileId: existing.id,
  };
}

export async function approveProviderForAdmin(input: {
  adminId: bigint;
  isActive: boolean;
  providerId: string;
}) {
  const existing = await findAdminProviderDetailByUserPublicId(input.providerId);
  if (!existing) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "Provider یافت نشد.");
  }

  const updated = await approveAdminProviderProfile({
    adminId: input.adminId,
    isActive: input.isActive,
    now: systemClock.now(),
    profileId: existing.id,
  });
  const subscription = await findActiveSubscriptionSummary(
    updated.id,
    systemClock.now(),
  );

  return {
    newValues: mapAdminProviderDetail(updated, subscription),
    oldValues: mapAdminProviderDetail(existing, subscription),
    profileId: existing.id,
  };
}

export async function updateProviderAvailabilityForAdmin(input: {
  isActive?: boolean;
  isAvailable?: boolean;
  providerId: string;
}) {
  const existing = await findAdminProviderDetailByUserPublicId(input.providerId);
  if (!existing) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "Provider یافت نشد.");
  }

  const updated = await updateAdminProviderAvailability(existing.id, {
    isActive: input.isActive,
    isAvailable: input.isAvailable,
  });
  const subscription = await findActiveSubscriptionSummary(
    updated.id,
    systemClock.now(),
  );

  return {
    newValues: mapAdminProviderDetail(updated, subscription),
    oldValues: mapAdminProviderDetail(
      existing,
      await findActiveSubscriptionSummary(existing.id, systemClock.now()),
    ),
    profileId: existing.id,
  };
}

export async function listProviderServicesForAdmin(input: {
  cursor?: string;
  limit: number;
  providerId: string;
}) {
  const profile = await requireProviderProfile(input.providerId);

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
    const cursor = await findAdminProviderServiceById(cursorId);
    if (!cursor || cursor.providerProfileId !== profile.id) {
      throw new ApiError(
        400,
        API_ERROR_CODES.validationFailed,
        "cursor معتبر نیست.",
      );
    }
  }

  const rows = await listAdminProviderServices({
    cursorId,
    limit: input.limit,
    providerProfileId: profile.id,
  });
  const hasMore = rows.length > input.limit;
  const page = hasMore ? rows.slice(0, input.limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map(mapAdminProviderService),
    meta: {
      hasMore,
      limit: input.limit,
      nextCursor: hasMore && last ? last.id.toString() : null,
    },
  };
}

export async function updateProviderServiceForAdmin(input: {
  adminId: bigint;
  description?: string | null;
  isActive?: boolean;
  priceToman?: number;
  pricingUnit?:
    | "fixed"
    | "per_hectare"
    | "per_square_meter"
    | "per_hour"
    | "per_day";
  providerServiceId: string;
}) {
  let providerServiceId: bigint;
  try {
    providerServiceId = BigInt(input.providerServiceId);
  } catch {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "شناسه خدمت Provider معتبر نیست.",
    );
  }

  const existing = await findAdminProviderServiceById(providerServiceId);
  if (!existing) {
    throw new ApiError(
      404,
      API_ERROR_CODES.notFound,
      "خدمت Provider یافت نشد.",
    );
  }

  const nextPrice =
    input.priceToman === undefined ? undefined : BigInt(input.priceToman);

  const updated = await runInTransaction(async (transaction) => {
    if (nextPrice !== undefined && nextPrice !== existing.priceToman) {
      await createAdminPriceChangeHistory(transaction, {
        changedByAdminId: input.adminId,
        newPriceToman: nextPrice,
        oldPriceToman: existing.priceToman,
        providerServiceId: existing.id,
      });
    }

    return updateAdminProviderServiceInTransaction(
      transaction,
      existing.id,
      {
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.isActive === undefined
          ? {}
          : { isActive: input.isActive ? 1 : 0 }),
        ...(nextPrice !== undefined ? { priceToman: nextPrice } : {}),
        ...(input.pricingUnit !== undefined
          ? { pricingUnit: input.pricingUnit }
          : {}),
      },
    );
  });

  return {
    newValues: mapAdminProviderService(updated),
    oldValues: mapAdminProviderService(existing),
    providerServiceId: existing.id,
  };
}
