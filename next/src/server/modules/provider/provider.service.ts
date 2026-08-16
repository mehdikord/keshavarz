import { systemClock } from "@/server/clock/clock";
import { runInTransaction } from "@/server/db/transaction";
import { API_ERROR_CODES, ApiError, mapPrismaError } from "@/server/errors";
import {
  mapProviderProfile,
  mapProviderService,
} from "@/server/modules/provider/provider.mapper";
import {
  countActiveProviderServices,
  countProviderInboxByStatus,
  countUnreadUserNotifications,
  createInitialPriceHistory,
  createPriceChangeHistory,
  createProviderService,
  findActiveCatalogServiceBySlug,
  findActiveSubscription,
  findProviderProfileByUserId,
  findProviderServiceByServiceSlug,
  listProviderServices,
  sumCompletedRevenueThisMonth,
  updateProviderServiceInTransaction,
  updateProviderWorkArea,
  upsertProviderProfile,
} from "@/server/modules/provider/provider.repository";

async function buildEligibility(profile: {
  id: bigint;
  isActive: number;
  isAvailable: number;
  workLatitude: unknown;
  workLongitude: unknown;
}) {
  const now = systemClock.now();
  const [subscription, activeServices] = await Promise.all([
    findActiveSubscription(profile.id, now),
    countActiveProviderServices(profile.id),
  ]);

  const missing: string[] = [];
  if (profile.isActive !== 1) missing.push("active");
  if (profile.isAvailable !== 1) missing.push("availability");
  if (profile.workLatitude === null || profile.workLongitude === null) {
    missing.push("workArea");
  }
  if (!subscription) missing.push("subscription");
  if (activeServices === 0) missing.push("services");

  return {
    missing,
    searchable: missing.length === 0,
  };
}

export async function getCurrentProviderProfile(userId: bigint) {
  const profile = await findProviderProfileByUserId(userId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
  }
  return mapProviderProfile(profile, await buildEligibility(profile));
}

export async function upsertCurrentProviderProfile(
  userId: bigint,
  input: { bio?: string | null },
) {
  const profile = await upsertProviderProfile(userId, input.bio);
  return mapProviderProfile(profile, await buildEligibility(profile));
}

export async function patchCurrentProviderWorkArea(
  userId: bigint,
  input: {
    isAvailable?: boolean;
    workLatitude?: string | null;
    workLongitude?: string | null;
    workRadiusKm?: number;
  },
) {
  const existing = await findProviderProfileByUserId(userId);
  if (!existing) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
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

  if (
    input.workRadiusKm !== undefined &&
    (input.workRadiusKm < 20 || input.workRadiusKm > 100)
  ) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "شعاع کاری باید بین ۲۰ تا ۱۰۰ کیلومتر باشد.",
    );
  }

  const profile = await updateProviderWorkArea(existing.id, {
    ...(input.isAvailable === undefined
      ? {}
      : { isAvailable: input.isAvailable ? 1 : 0 }),
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

  return mapProviderProfile(profile, await buildEligibility(profile));
}

function decimalOrNull(
  value: { toString(): string } | string | null,
): string | null {
  if (value === null) {
    return null;
  }
  return typeof value === "string" ? value : value.toString();
}

export async function listCurrentProviderServices(
  userId: bigint,
  input: { cursor?: string; limit: number },
) {
  const profile = await findProviderProfileByUserId(userId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
  }

  let cursorId: bigint | undefined;
  if (input.cursor) {
    const cursor = await findProviderServiceByServiceSlug(
      profile.id,
      input.cursor,
    );
    if (!cursor) {
      throw new ApiError(400, API_ERROR_CODES.validationFailed, "cursor معتبر نیست.");
    }
    cursorId = cursor.id;
  }

  const rows = await listProviderServices({
    cursorId,
    limit: input.limit,
    providerProfileId: profile.id,
  });
  const hasMore = rows.length > input.limit;
  const page = hasMore ? rows.slice(0, input.limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map(mapProviderService),
    meta: {
      hasMore,
      limit: input.limit,
      nextCursor: hasMore && last ? last.service.slug : null,
    },
  };
}

export async function addCurrentProviderService(
  userId: bigint,
  input: {
    description?: string | null;
    priceToman: number;
    pricingUnit: "fixed" | "per_hectare" | "per_square_meter" | "per_hour" | "per_day";
    serviceId: string;
  },
) {
  const profile = await findProviderProfileByUserId(userId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
  }

  const catalogService = await findActiveCatalogServiceBySlug(input.serviceId);
  if (!catalogService) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "خدمت باید از کاتالوگ فعال انتخاب شود.",
    );
  }

  const priceToman = BigInt(input.priceToman);

  try {
    return await runInTransaction(async (transaction) => {
      const created = await createProviderService(transaction, {
        description: input.description,
        priceToman,
        pricingUnit: input.pricingUnit,
        providerProfileId: profile.id,
        serviceId: catalogService.id,
      });
      await createInitialPriceHistory(transaction, {
        changedByUserId: userId,
        newPriceToman: priceToman,
        providerServiceId: created.id,
      });
      return mapProviderService(created);
    });
  } catch (error) {
    const mapped = mapPrismaError(error);
    if (mapped?.code === API_ERROR_CODES.conflict) {
      throw new ApiError(
        409,
        API_ERROR_CODES.conflict,
        "این خدمت قبلاً برای Provider ثبت شده است.",
        { cause: error },
      );
    }
    throw error;
  }
}

export async function updateCurrentProviderService(
  userId: bigint,
  serviceSlug: string,
  input: {
    description?: string | null;
    priceToman?: number;
    pricingUnit?: "fixed" | "per_hectare" | "per_square_meter" | "per_hour" | "per_day";
  },
) {
  const profile = await findProviderProfileByUserId(userId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
  }

  const existing = await findProviderServiceByServiceSlug(profile.id, serviceSlug);
  if (!existing || existing.isActive !== 1) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "خدمت Provider یافت نشد.");
  }

  return runInTransaction(async (transaction) => {
    const nextPrice =
      input.priceToman === undefined
        ? undefined
        : BigInt(input.priceToman);

    if (nextPrice !== undefined && nextPrice !== existing.priceToman) {
      await createPriceChangeHistory(transaction, {
        changedByUserId: userId,
        newPriceToman: nextPrice,
        oldPriceToman: existing.priceToman,
        providerServiceId: existing.id,
      });
    }

    const updated = await updateProviderServiceInTransaction(
      transaction,
      existing.id,
      {
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(nextPrice !== undefined ? { priceToman: nextPrice } : {}),
        ...(input.pricingUnit !== undefined
          ? { pricingUnit: input.pricingUnit }
          : {}),
      },
    );
    return mapProviderService(updated);
  });
}

export async function deactivateCurrentProviderService(
  userId: bigint,
  serviceSlug: string,
) {
  const profile = await findProviderProfileByUserId(userId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
  }

  const existing = await findProviderServiceByServiceSlug(profile.id, serviceSlug);
  if (!existing || existing.isActive !== 1) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "خدمت Provider یافت نشد.");
  }

  await runInTransaction(async (transaction) => {
    await updateProviderServiceInTransaction(transaction, existing.id, {
      isActive: 0,
    });
  });

  return { deactivated: true };
}

export async function getCurrentProviderDashboard(userId: bigint) {
  const profile = await findProviderProfileByUserId(userId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
  }

  const now = systemClock.now();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const monthEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );

  const [
    newRequests,
    inProgressRequests,
    monthlyRevenue,
    unreadNotifications,
    eligibility,
  ] = await Promise.all([
    countProviderInboxByStatus(profile.id, "sent"),
    countProviderInboxByStatus(profile.id, "accepted"),
    sumCompletedRevenueThisMonth(profile.id, monthStart, monthEnd),
    countUnreadUserNotifications(userId),
    buildEligibility(profile),
  ]);

  return {
    counts: {
      inProgressRequests,
      newRequests,
      unreadNotifications,
    },
    monthlyRevenueToman: Number(monthlyRevenue),
    warnings: eligibility.missing,
  };
}
