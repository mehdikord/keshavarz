import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/server/db/prisma";

export async function findActiveOwnedLand(input: {
  landPublicId: string;
  userId: bigint;
}) {
  return prisma.land.findFirst({
    where: {
      deletedAt: null,
      isActive: 1,
      publicId: input.landPublicId,
      userId: input.userId,
    },
    select: {
      id: true,
      latitude: true,
      longitude: true,
      publicId: true,
      title: true,
    },
  });
}

export async function findActiveCatalogServiceForSearch(slug: string) {
  return prisma.service.findFirst({
    where: {
      deletedAt: null,
      isActive: 1,
      slug,
      category: {
        deletedAt: null,
        isActive: 1,
      },
    },
    select: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      id: true,
      name: true,
      slug: true,
    },
  });
}

export type SearchSort =
  | "distanceAsc"
  | "distanceDesc"
  | "priceAsc"
  | "priceDesc";

export interface SearchableProviderRow {
  distanceKm: number;
  priceToman: bigint;
  pricingUnit: string;
  providerName: string | null;
  providerProfileId: bigint;
  providerPublicId: string;
  providerServiceId: bigint;
  workRadiusKm: number;
}

function orderClause(sort: SearchSort): Prisma.Sql {
  switch (sort) {
    case "priceAsc":
      return Prisma.sql`price_toman ASC, provider_profile_id ASC`;
    case "priceDesc":
      return Prisma.sql`price_toman DESC, provider_profile_id ASC`;
    case "distanceDesc":
      return Prisma.sql`distance_km DESC, provider_profile_id ASC`;
    case "distanceAsc":
    default:
      return Prisma.sql`distance_km ASC, provider_profile_id ASC`;
  }
}

function cursorPredicate(
  sort: SearchSort,
  cursor: { providerProfileId: bigint; sortValue: number },
): Prisma.Sql {
  switch (sort) {
    case "priceAsc":
      return Prisma.sql`(
        price_toman > ${cursor.sortValue}
        OR (price_toman = ${cursor.sortValue} AND provider_profile_id > ${cursor.providerProfileId})
      )`;
    case "priceDesc":
      return Prisma.sql`(
        price_toman < ${cursor.sortValue}
        OR (price_toman = ${cursor.sortValue} AND provider_profile_id > ${cursor.providerProfileId})
      )`;
    case "distanceDesc":
      return Prisma.sql`(
        distance_km < ${cursor.sortValue}
        OR (distance_km = ${cursor.sortValue} AND provider_profile_id > ${cursor.providerProfileId})
      )`;
    case "distanceAsc":
    default:
      return Prisma.sql`(
        distance_km > ${cursor.sortValue}
        OR (distance_km = ${cursor.sortValue} AND provider_profile_id > ${cursor.providerProfileId})
      )`;
  }
}

export async function searchEligibleProviders(input: {
  consumerUserId: bigint;
  cursor?: { providerProfileId: bigint; sortValue: number };
  landLatitude: number;
  landLongitude: number;
  limit: number;
  serviceId: bigint;
  sort: SearchSort;
}): Promise<SearchableProviderRow[]> {
  const lat = input.landLatitude;
  const lng = input.landLongitude;
  const cursorFilter = input.cursor
    ? Prisma.sql`AND ${cursorPredicate(input.sort, input.cursor)}`
    : Prisma.empty;

  const rows = await prisma.$queryRaw<
    Array<{
      distance_km: number | string;
      price_toman: bigint;
      pricing_unit: string;
      provider_name: string | null;
      provider_profile_id: bigint;
      provider_public_id: string;
      provider_service_id: bigint;
      work_radius_km: number;
    }>
  >`
    SELECT *
    FROM (
      SELECT
        v.provider_service_id,
        v.provider_profile_id,
        v.provider_public_id,
        v.provider_name,
        v.price_toman,
        v.pricing_unit,
        v.work_radius_km,
        (
          6371 * ACOS(
            LEAST(
              1,
              GREATEST(
                -1,
                COS(RADIANS(${lat})) * COS(RADIANS(v.work_latitude))
                  * COS(RADIANS(v.work_longitude) - RADIANS(${lng}))
                  + SIN(RADIANS(${lat})) * SIN(RADIANS(v.work_latitude))
              )
            )
          )
        ) AS distance_km
      FROM v_searchable_provider_services v
      WHERE v.service_id = ${input.serviceId}
        AND v.provider_user_id <> ${input.consumerUserId}
    ) matched
    WHERE matched.distance_km <= matched.work_radius_km
      ${cursorFilter}
    ORDER BY ${orderClause(input.sort)}
    LIMIT ${input.limit + 1}
  `;

  return rows.map((row) => ({
    distanceKm: Number(row.distance_km),
    priceToman: row.price_toman,
    pricingUnit: row.pricing_unit,
    providerName: row.provider_name,
    providerProfileId: row.provider_profile_id,
    providerPublicId: row.provider_public_id,
    providerServiceId: row.provider_service_id,
    workRadiusKm: row.work_radius_km,
  }));
}

export async function findEligibleProviderMatch(input: {
  consumerUserId: bigint;
  landLatitude: number;
  landLongitude: number;
  providerPublicId: string;
  serviceId: bigint;
}): Promise<SearchableProviderRow | null> {
  const lat = input.landLatitude;
  const lng = input.landLongitude;

  const rows = await prisma.$queryRaw<
    Array<{
      distance_km: number | string;
      price_toman: bigint;
      pricing_unit: string;
      provider_name: string | null;
      provider_profile_id: bigint;
      provider_public_id: string;
      provider_service_id: bigint;
      work_radius_km: number;
    }>
  >`
    SELECT *
    FROM (
      SELECT
        v.provider_service_id,
        v.provider_profile_id,
        v.provider_public_id,
        v.provider_name,
        v.price_toman,
        v.pricing_unit,
        v.work_radius_km,
        (
          6371 * ACOS(
            LEAST(
              1,
              GREATEST(
                -1,
                COS(RADIANS(${lat})) * COS(RADIANS(v.work_latitude))
                  * COS(RADIANS(v.work_longitude) - RADIANS(${lng}))
                  + SIN(RADIANS(${lat})) * SIN(RADIANS(v.work_latitude))
              )
            )
          )
        ) AS distance_km
      FROM v_searchable_provider_services v
      WHERE v.service_id = ${input.serviceId}
        AND v.provider_user_id <> ${input.consumerUserId}
        AND v.provider_public_id = ${input.providerPublicId}
    ) matched
    WHERE matched.distance_km <= matched.work_radius_km
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    distanceKm: Number(row.distance_km),
    priceToman: row.price_toman,
    pricingUnit: row.pricing_unit,
    providerName: row.provider_name,
    providerProfileId: row.provider_profile_id,
    providerPublicId: row.provider_public_id,
    providerServiceId: row.provider_service_id,
    workRadiusKm: row.work_radius_km,
  };
}

export async function listProviderLinkStatusesForSearch(input: {
  consumerUserId: bigint;
  landId: bigint;
  providerProfileIds: bigint[];
  serviceId: bigint;
}): Promise<Map<string, "rejected" | "sent">> {
  if (input.providerProfileIds.length === 0) {
    return new Map();
  }

  const links = await prisma.serviceRequestProvider.findMany({
    where: {
      providerProfileId: { in: input.providerProfileIds },
      status: { in: ["sent", "rejected"] },
      request: {
        consumerUserId: input.consumerUserId,
        landId: input.landId,
        serviceId: input.serviceId,
        status: "pending_provider",
      },
    },
    orderBy: { id: "desc" },
    select: {
      providerProfileId: true,
      status: true,
    },
  });

  const result = new Map<string, "rejected" | "sent">();
  for (const link of links) {
    const key = link.providerProfileId.toString();
    if (!result.has(key) && (link.status === "sent" || link.status === "rejected")) {
      result.set(key, link.status);
    }
  }
  return result;
}
