import { Prisma, type ProviderServicePricingUnit } from "@/generated/prisma/client";

import { prisma } from "@/server/db/prisma";
import { getSetting } from "@/server/modules/system/settings.service";

/** Request statuses that can still be sent to more providers. */
export const OPEN_REQUEST_STATUSES = ["awaiting_send", "pending_provider"] as const;

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
      areaSquareMeters: true,
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

export interface EligibleProviderRow {
  distanceKm: number;
  priceToman: bigint;
  pricingUnit: string;
  providerImage: string | null;
  providerName: string | null;
  providerProfileId: bigint;
  providerPublicId: string;
  providerServiceId: bigint;
}

/**
 * Live eligibility: every active, available, subscribed provider offering the
 * service whose work radius covers the land. `v_searchable_provider_services`
 * applies the activity/subscription rules; distance is Haversine in km.
 */
export async function queryEligibleProviders(input: {
  consumerUserId: bigint;
  landLatitude: number;
  landLongitude: number;
  /** Restrict to these provider user public ids (send-time revalidation). */
  providerPublicIds?: string[];
  serviceId: bigint;
}): Promise<EligibleProviderRow[]> {
  if (input.providerPublicIds && input.providerPublicIds.length === 0) {
    return [];
  }

  const lat = input.landLatitude;
  const lng = input.landLongitude;
  // Upper bound on providers matched for one request (admin setting, default 300).
  // Each provider has one work center, so this only matters in very dense areas; the closest ones win.
  const candidateLimit = await getSetting("search.candidate_limit");
  const providerFilter = input.providerPublicIds
    ? Prisma.sql`AND v.provider_public_id IN (${Prisma.join(input.providerPublicIds)})`
    : Prisma.empty;

  const rows = await prisma.$queryRaw<
    Array<{
      distance_km: number | string;
      price_toman: bigint;
      pricing_unit: string;
      provider_image: string | null;
      provider_name: string | null;
      provider_profile_id: bigint;
      provider_public_id: string;
      provider_service_id: bigint;
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
        u.image AS provider_image,
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
      INNER JOIN users u ON u.id = v.provider_user_id
      WHERE v.service_id = ${input.serviceId}
        AND v.provider_user_id <> ${input.consumerUserId}
        ${providerFilter}
    ) matched
    WHERE matched.distance_km <= matched.work_radius_km
    ORDER BY matched.distance_km ASC, matched.provider_profile_id ASC
    LIMIT ${candidateLimit}
  `;

  return rows.map((row) => ({
    distanceKm: Number(Number(row.distance_km).toFixed(2)),
    priceToman: row.price_toman,
    pricingUnit: row.pricing_unit,
    providerImage: row.provider_image ?? null,
    providerName: row.provider_name,
    providerProfileId: row.provider_profile_id,
    providerPublicId: row.provider_public_id,
    providerServiceId: row.provider_service_id,
  }));
}

/** Latest still-open request of this consumer for the same land and service. */
export async function findOpenRequestForCriteria(input: {
  consumerUserId: bigint;
  landId: bigint;
  serviceId: bigint;
}) {
  return prisma.serviceRequest.findFirst({
    where: {
      consumerUserId: input.consumerUserId,
      landId: input.landId,
      serviceId: input.serviceId,
      status: { in: [...OPEN_REQUEST_STATUSES] },
    },
    orderBy: { id: "desc" },
    select: {
      createdAt: true,
      publicId: true,
      status: true,
    },
  });
}

export async function findRequestForCandidates(publicId: string) {
  return prisma.serviceRequest.findUnique({
    where: { publicId },
    select: {
      assignedProviderNameSnapshot: true,
      assignedProviderProfileId: true,
      consumerNote: true,
      consumerUserId: true,
      createdAt: true,
      id: true,
      land: { select: { publicId: true } },
      landAreaSquareMetersSnapshot: true,
      landId: true,
      landLatitudeSnapshot: true,
      landLongitudeSnapshot: true,
      landTitleSnapshot: true,
      publicId: true,
      service: { select: { image: true } },
      serviceCategoryNameSnapshot: true,
      serviceId: true,
      serviceNameSnapshot: true,
      status: true,
      version: true,
    },
  });
}

export async function listStoredCandidates(requestId: bigint) {
  return prisma.serviceRequestCandidate.findMany({
    where: { serviceRequestId: requestId },
    orderBy: { id: "asc" },
    select: {
      distanceKm: true,
      pricingUnitSnapshot: true,
      providerNameSnapshot: true,
      providerProfileId: true,
      servicePriceSnapshotToman: true,
      providerProfile: {
        select: {
          user: { select: { image: true, publicId: true } },
        },
      },
    },
  });
}

/** Idempotent: providers already stored for the request are skipped. */
export async function storeCandidates(
  requestId: bigint,
  providers: EligibleProviderRow[],
  client: Pick<Prisma.TransactionClient, "serviceRequestCandidate"> = prisma,
): Promise<void> {
  if (providers.length === 0) {
    return;
  }
  await client.serviceRequestCandidate.createMany({
    data: providers.map((provider) => ({
      distanceKm: provider.distanceKm.toFixed(2),
      pricingUnitSnapshot: provider.pricingUnit as ProviderServicePricingUnit,
      providerNameSnapshot: (provider.providerName ?? "خدمات‌دهنده").slice(0, 120),
      providerProfileId: provider.providerProfileId,
      providerServiceId: provider.providerServiceId,
      servicePriceSnapshotToman: provider.priceToman,
      serviceRequestId: requestId,
    })),
    skipDuplicates: true,
  });
}

/**
 * How these providers handled the consumer's *other* requests for the same
 * land and service: "rejected" (declined before) wins over "sent" (already
 * waiting on another open request).
 */
export async function listOtherRequestLinkStatuses(input: {
  consumerUserId: bigint;
  excludeRequestId: bigint;
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
      serviceRequestId: { not: input.excludeRequestId },
      OR: [
        { status: "rejected" },
        { status: "sent", request: { status: "pending_provider" } },
      ],
      request: {
        consumerUserId: input.consumerUserId,
        landId: input.landId,
        serviceId: input.serviceId,
      },
    },
    select: { providerProfileId: true, status: true },
  });

  const result = new Map<string, "rejected" | "sent">();
  for (const link of links) {
    const key = link.providerProfileId.toString();
    if (link.status === "rejected") {
      result.set(key, "rejected");
    } else if (link.status === "sent" && !result.has(key)) {
      result.set(key, "sent");
    }
  }
  return result;
}
