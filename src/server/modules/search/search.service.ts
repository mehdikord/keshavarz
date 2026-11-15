import { systemClock } from "@/server/clock/clock";
import { runInTransaction } from "@/server/db/transaction";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { getAppIdempotencyService } from "@/server/idempotency/default-idempotency";
import { createPublicId } from "@/server/identifiers/ulid";
import { startSpan } from "@/server/observability";
import { getAppRateLimiter } from "@/server/rate-limit/default-rate-limiter";
import {
  createSearchRequest,
  findUserSnapshot,
  listRequestDates,
  listRequestProviderLinks,
} from "@/server/modules/requests/request.repository";
import {
  mapCandidate,
  mapCandidateRequestContext,
  type CandidateState,
} from "@/server/modules/search/search.mapper";
import {
  OPEN_REQUEST_STATUSES,
  findActiveCatalogServiceForSearch,
  findActiveOwnedLand,
  findOpenRequestForCriteria,
  findRequestForCandidates,
  listOtherRequestLinkStatuses,
  listStoredCandidates,
  queryEligibleProviders,
  storeCandidates,
  type EligibleProviderRow,
} from "@/server/modules/search/search.repository";

const LOCAL_DATE = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Tehran",
  year: "numeric",
});

/** "Today" for the farmer, not for UTC — Iran is UTC+03:30. */
function todayInIran(now: Date): string {
  return LOCAL_DATE.format(now);
}

function assertDatesNotPast(dates: string[], now: Date): void {
  const today = todayInIran(now);
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

function isOpenStatus(status: string): boolean {
  return (OPEN_REQUEST_STATUSES as readonly string[]).includes(status);
}

export type ServiceSearchResult =
  | {
      outcome: "created";
      providersFound: number;
      requestId: string;
      status: string;
      version: number;
    }
  | {
      duplicate: { createdAt: string; requestId: string; status: string };
      outcome: "duplicate";
      providersFound: number;
    }
  | { outcome: "no_providers"; providersFound: 0 };

/**
 * Runs the search. When at least one provider matches, the search itself is
 * persisted as a request in `awaiting_send` together with every matched
 * provider; with no match nothing is stored.
 */
export async function createServiceSearch(
  userId: bigint,
  input: {
    allowDuplicate?: boolean;
    categoryId?: string;
    consumerNote?: string | null;
    dates: string[];
    landId: string;
    serviceId: string;
  },
  idempotencyKey: string,
): Promise<ServiceSearchResult> {
  const span = startSpan({ name: "app.service-search.create" });

  try {
    await getAppRateLimiter().consume(`search:${userId.toString()}`, {
      limit: 30,
      windowMilliseconds: 60_000,
    });

    const now = systemClock.now();
    assertDatesNotPast(input.dates, now);

    const result = await getAppIdempotencyService().execute(
      {
        actorId: userId.toString(),
        key: idempotencyKey,
        operationId: "app.service-search.create",
        realm: "app",
      },
      input,
      async (): Promise<ServiceSearchResult> => {
        const [land, service, user] = await Promise.all([
          findActiveOwnedLand({ landPublicId: input.landId, userId }),
          findActiveCatalogServiceForSearch(input.serviceId),
          findUserSnapshot(userId),
        ]);
        if (!land) {
          throw new ApiError(404, API_ERROR_CODES.notFound, "زمین یافت نشد.");
        }
        if (!service) {
          throw new ApiError(404, API_ERROR_CODES.notFound, "خدمت یافت نشد.");
        }
        if (!user) {
          throw new ApiError(404, API_ERROR_CODES.notFound, "کاربر یافت نشد.");
        }
        if (input.categoryId && input.categoryId !== service.category.slug) {
          throw new ApiError(
            400,
            API_ERROR_CODES.validationFailed,
            "دسته و خدمت هم‌خوانی ندارند.",
            { fields: { categoryId: ["با خدمت انتخاب‌شده هم‌خوان نیست."] } },
          );
        }

        const providers = await queryEligibleProviders({
          consumerUserId: userId,
          landLatitude: Number(land.latitude.toString()),
          landLongitude: Number(land.longitude.toString()),
          serviceId: service.id,
        });

        if (providers.length === 0) {
          return { outcome: "no_providers", providersFound: 0 };
        }

        if (!input.allowDuplicate) {
          const open = await findOpenRequestForCriteria({
            consumerUserId: userId,
            landId: land.id,
            serviceId: service.id,
          });
          if (open) {
            return {
              duplicate: {
                createdAt: open.createdAt.toISOString(),
                requestId: open.publicId,
                status: open.status,
              },
              outcome: "duplicate",
              providersFound: providers.length,
            };
          }
        }

        const dates = [...new Set(input.dates)].sort();
        const consumerNote = input.consumerNote?.trim()
          ? input.consumerNote.trim()
          : null;

        const created = await runInTransaction(async (transaction) => {
          const request = await createSearchRequest(transaction, {
            consumerName: user.name,
            consumerNote,
            consumerUserId: userId,
            dates,
            land,
            publicId: createPublicId(),
            serviceCategoryName: service.category.name,
            serviceId: service.id,
            serviceName: service.name,
          });
          await storeCandidates(request.id, providers, transaction);
          return request;
        });

        return {
          outcome: "created",
          providersFound: providers.length,
          requestId: created.publicId,
          status: created.status,
          version: created.version,
        };
      },
    );

    span.finish();
    return result;
  } catch (error) {
    span.error(error);
    throw error;
  }
}

/**
 * Every provider ever found for the request (stored at search time), merged
 * with a live re-run of the search while the request is still open: newly
 * eligible providers are stored and shown, and stored ones that no longer
 * qualify come back as `unavailable`.
 */
export async function listRequestCandidates(userId: bigint, requestId: string) {
  const request = await findRequestForCandidates(requestId);
  if (!request || request.consumerUserId !== userId) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "درخواست یافت نشد.");
  }

  const open = isOpenStatus(request.status);
  const [stored, links, dates, live] = await Promise.all([
    listStoredCandidates(request.id),
    listRequestProviderLinks(request.id),
    listRequestDates(request.id),
    open
      ? queryEligibleProviders({
          consumerUserId: userId,
          landLatitude: Number(request.landLatitudeSnapshot.toString()),
          landLongitude: Number(request.landLongitudeSnapshot.toString()),
          serviceId: request.serviceId,
        })
      : Promise.resolve([] as EligibleProviderRow[]),
  ]);

  const storedIds = new Set(stored.map((item) => item.providerProfileId.toString()));
  const newlyFound = live.filter((row) => !storedIds.has(row.providerProfileId.toString()));
  if (newlyFound.length > 0) {
    await storeCandidates(request.id, newlyFound);
  }

  const liveById = new Map(live.map((row) => [row.providerProfileId.toString(), row]));
  const linkById = new Map(links.map((link) => [link.providerProfileId.toString(), link]));

  type Entry = {
    distanceKm: number;
    image: string | null;
    name: string;
    priceToman: bigint;
    pricingUnit: string;
    providerProfileId: bigint;
    providerPublicId: string;
  };
  const entries = new Map<string, Entry>();
  for (const item of stored) {
    entries.set(item.providerProfileId.toString(), {
      distanceKm: Number(item.distanceKm.toString()),
      image: item.providerProfile.user.image ?? null,
      name: item.providerNameSnapshot,
      priceToman: item.servicePriceSnapshotToman,
      pricingUnit: item.pricingUnitSnapshot,
      providerProfileId: item.providerProfileId,
      providerPublicId: item.providerProfile.user.publicId,
    });
  }
  for (const row of live) {
    // Live values are what a send would snapshot, so they win.
    entries.set(row.providerProfileId.toString(), {
      distanceKm: row.distanceKm,
      image: row.providerImage,
      name: row.providerName ?? "خدمات‌دهنده",
      priceToman: row.priceToman,
      pricingUnit: row.pricingUnit,
      providerProfileId: row.providerProfileId,
      providerPublicId: row.providerPublicId,
    });
  }
  // Once sent, the provider is bound to the price/distance snapshotted on the
  // link (that is what acceptance uses); links also cover providers sent
  // before candidates were stored.
  for (const link of links) {
    const key = link.providerProfileId.toString();
    const existing = entries.get(key);
    entries.set(key, {
      distanceKm: Number(link.distanceKm.toString()),
      image: existing?.image ?? null,
      name: link.providerNameSnapshot,
      priceToman: link.servicePriceSnapshotToman,
      pricingUnit: existing?.pricingUnit ?? "fixed",
      providerProfileId: link.providerProfileId,
      providerPublicId: link.providerProfile.user.publicId,
    });
  }

  const other = open
    ? await listOtherRequestLinkStatuses({
        consumerUserId: userId,
        excludeRequestId: request.id,
        landId: request.landId,
        providerProfileIds: [...entries.values()].map((entry) => entry.providerProfileId),
        serviceId: request.serviceId,
      })
    : new Map<string, "rejected" | "sent">();

  const revealPhone = request.status === "in_progress" || request.status === "completed";

  const candidates = [...entries.entries()].map(([key, entry]) => {
    const link = linkById.get(key);
    const state: CandidateState = link
      ? (link.status as CandidateState)
      : open && liveById.has(key)
        ? "available"
        : "unavailable";
    const isAssigned = request.assignedProviderProfileId === entry.providerProfileId;
    return mapCandidate({
      ...entry,
      otherRequestStatus: other.get(key) ?? null,
      phone:
        revealPhone && isAssigned && link?.status === "accepted"
          ? (link.providerProfile.user.phone ?? null)
          : null,
      state,
    });
  });

  candidates.sort((a, b) => a.priceToman - b.priceToman || a.distanceKm - b.distanceKm);

  return {
    candidates,
    request: mapCandidateRequestContext({ ...request, dates }),
  };
}
