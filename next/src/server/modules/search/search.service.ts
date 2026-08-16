import { systemClock } from "@/server/clock/clock";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { getAppIdempotencyService } from "@/server/idempotency/default-idempotency";
import { createPublicId } from "@/server/identifiers/ulid";
import {
  buildSearchCriteriaSignature,
  getServiceSearchContext,
  saveServiceSearchContext,
  verifySearchCriteriaSignature,
  type ServiceSearchContext,
} from "@/server/modules/search/search.context";
import {
  mapSearchContext,
  mapSearchProvider,
} from "@/server/modules/search/search.mapper";
import {
  findActiveCatalogServiceForSearch,
  findActiveOwnedLand,
  findEligibleProviderMatch,
  listProviderLinkStatusesForSearch,
  searchEligibleProviders,
  type SearchSort,
} from "@/server/modules/search/search.repository";
import { startSpan } from "@/server/observability";
import { getAppRateLimiter } from "@/server/rate-limit/default-rate-limiter";

function todayUtcDateString(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function assertDatesNotPast(dates: string[], now: Date): void {
  const today = todayUtcDateString(now);
  for (const date of dates) {
    if (date < today) {
      throw new ApiError(
        400,
        API_ERROR_CODES.validationFailed,
        "تاریخ‌های گذشته مجاز نیستند.",
        { fields: { dates: ["تاریخ نباید در گذشته باشد."] } },
      );
    }
  }
}

function decimalToNumber(value: { toString(): string } | string | number): number {
  if (typeof value === "number") {
    return value;
  }
  return Number(typeof value === "string" ? value : value.toString());
}

function encodeProviderCursor(input: {
  providerProfileId: bigint;
  sortValue: number;
}): string {
  return Buffer.from(
    JSON.stringify({
      id: input.providerProfileId.toString(),
      v: input.sortValue,
    }),
    "utf8",
  ).toString("base64url");
}

function decodeProviderCursor(cursor: string): {
  providerProfileId: bigint;
  sortValue: number;
} {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    ) as { id?: string; v?: number };
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.v !== "number" ||
      !Number.isFinite(parsed.v)
    ) {
      throw new Error("invalid");
    }
    return {
      providerProfileId: BigInt(parsed.id),
      sortValue: parsed.v,
    };
  } catch {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "cursor معتبر نیست.",
    );
  }
}

function sortValueForRow(
  sort: SearchSort,
  row: { distanceKm: number; priceToman: bigint },
): number {
  return sort.startsWith("price") ? Number(row.priceToman) : row.distanceKm;
}

function requireOwnedValidContext(
  searchId: string,
  userId: bigint,
  now: Date,
): ServiceSearchContext {
  const context = getServiceSearchContext(searchId, now);
  if (!context || context.userId !== userId) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "جستجو یافت نشد.");
  }
  if (!verifySearchCriteriaSignature(context)) {
    throw new ApiError(
      409,
      API_ERROR_CODES.conflict,
      "context جستجو معتبر نیست.",
    );
  }
  return context;
}

export async function createServiceSearch(
  userId: bigint,
  input: {
    categoryId?: string;
    consumerNote?: string | null;
    dates: string[];
    landId: string;
    serviceId: string;
  },
  idempotencyKey: string,
) {
  const span = startSpan({ name: "app.service-search.create" });

  try {
    await getAppRateLimiter().consume(`search:${userId.toString()}`, {
      limit: 30,
      windowMilliseconds: 60_000,
    });

  const now = systemClock.now();
  assertDatesNotPast(input.dates, now);

  const idempotency = getAppIdempotencyService();
  const result = await idempotency.execute(
    {
      actorId: userId.toString(),
      key: idempotencyKey,
      operationId: "app.service-search.create",
      realm: "app",
    },
    input,
    async () => {
      const land = await findActiveOwnedLand({
        landPublicId: input.landId,
        userId,
      });
      if (!land) {
        throw new ApiError(404, API_ERROR_CODES.notFound, "زمین یافت نشد.");
      }

      const service = await findActiveCatalogServiceForSearch(input.serviceId);
      if (!service) {
        throw new ApiError(404, API_ERROR_CODES.notFound, "خدمت یافت نشد.");
      }

      if (input.categoryId && input.categoryId !== service.category.slug) {
        throw new ApiError(
          400,
          API_ERROR_CODES.validationFailed,
          "دسته و خدمت هم‌خوانی ندارند.",
          { fields: { categoryId: ["با خدمت انتخاب‌شده هم‌خوان نیست."] } },
        );
      }

      const dates = [...new Set(input.dates)].sort();
      const consumerNote = input.consumerNote?.trim()
        ? input.consumerNote.trim()
        : null;
      const searchId = createPublicId();
      const criteriaSignature = buildSearchCriteriaSignature({
        categorySlug: service.category.slug,
        consumerNote,
        dates,
        landPublicId: land.publicId,
        serviceSlug: service.slug,
        userId: userId.toString(),
      });

      const context = saveServiceSearchContext(
        {
          categoryName: service.category.name,
          categorySlug: service.category.slug,
          consumerNote,
          criteriaSignature,
          dates,
          landId: land.id,
          landLatitude: land.latitude.toString(),
          landLongitude: land.longitude.toString(),
          landPublicId: land.publicId,
          landTitle: land.title,
          searchId,
          serviceId: service.id,
          serviceName: service.name,
          serviceSlug: service.slug,
          userId,
        },
        now,
      );

      return mapSearchContext(context);
    },
  );

  span.finish();
  return result;
  } catch (error) {
    span.error(error);
    throw error;
  }
}

export async function listSearchProviders(
  userId: bigint,
  searchId: string,
  query: {
    cursor?: string;
    limit: number;
    sort: SearchSort;
  },
) {
  const now = systemClock.now();
  const context = requireOwnedValidContext(searchId, userId, now);

  const cursor = query.cursor
    ? decodeProviderCursor(query.cursor)
    : undefined;

  const rows = await searchEligibleProviders({
    consumerUserId: userId,
    cursor,
    landLatitude: decimalToNumber(context.landLatitude),
    landLongitude: decimalToNumber(context.landLongitude),
    limit: query.limit,
    serviceId: context.serviceId,
    sort: query.sort,
  });

  const hasMore = rows.length > query.limit;
  const page = hasMore ? rows.slice(0, query.limit) : rows;
  const statuses = await listProviderLinkStatusesForSearch({
    consumerUserId: userId,
    landId: context.landId,
    providerProfileIds: page.map((row) => row.providerProfileId),
    serviceId: context.serviceId,
  });

  const last = page.at(-1);

  return {
    items: page.map((row) =>
      mapSearchProvider({
        distanceKm: row.distanceKm,
        previousStatus:
          statuses.get(row.providerProfileId.toString()) ?? null,
        priceToman: row.priceToman,
        pricingUnit: row.pricingUnit,
        providerName: row.providerName,
        providerPublicId: row.providerPublicId,
      }),
    ),
    meta: {
      hasMore,
      limit: query.limit,
      nextCursor:
        hasMore && last
          ? encodeProviderCursor({
              providerProfileId: last.providerProfileId,
              sortValue: sortValueForRow(query.sort, last),
            })
          : null,
      sort: query.sort,
    },
    search: mapSearchContext(context),
  };
}

/**
 * Live revalidation used when converting a search hit into a Request.
 * Never trust a previously listed result without calling this.
 */
export async function revalidateSearchProviderMatch(input: {
  providerPublicId: string;
  searchId: string;
  userId: bigint;
}) {
  const now = systemClock.now();
  const context = requireOwnedValidContext(
    input.searchId,
    input.userId,
    now,
  );

  const match = await findEligibleProviderMatch({
    consumerUserId: input.userId,
    landLatitude: decimalToNumber(context.landLatitude),
    landLongitude: decimalToNumber(context.landLongitude),
    providerPublicId: input.providerPublicId,
    serviceId: context.serviceId,
  });

  if (!match) {
    throw new ApiError(
      409,
      API_ERROR_CODES.conflict,
      "Provider دیگر واجد شرایط این جستجو نیست.",
    );
  }

  return {
    context,
    match: {
      distanceKm: Number(match.distanceKm.toFixed(2)),
      priceToman: match.priceToman,
      pricingUnit: match.pricingUnit,
      providerName: match.providerName,
      providerProfileId: match.providerProfileId,
      providerPublicId: match.providerPublicId,
      providerServiceId: match.providerServiceId,
    },
  };
}
