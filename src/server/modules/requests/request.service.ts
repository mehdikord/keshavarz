import { systemClock } from "@/server/clock/clock";
import { runInTransaction, type TransactionClient } from "@/server/db/transaction";
import {
  API_ERROR_CODES,
  ApiError,
  isRetryablePrismaConflict,
  mapPrismaError,
} from "@/server/errors";
import { getAppIdempotencyService } from "@/server/idempotency/default-idempotency";
import { startSpan } from "@/server/observability";
import { enqueueDomainNotification } from "@/server/modules/notifications/notification.service";
import { buildRequestNotification } from "@/server/modules/notifications/notification.templates";
import {
  NOTIFICATION_TYPES,
  type NotificationType,
} from "@/server/modules/notifications/notification.types";
import {
  mapConsumerRequestDetail,
  mapConsumerRequestSummary,
  mapProviderRequestDetail,
  mapProviderRequestSummary,
} from "@/server/modules/requests/request.mapper";
import {
  acceptServiceRequest,
  addProvidersToRequest,
  cancelServiceRequest,
  completeServiceRequest,
  findExistingProviderLinks,
  findProviderLinkForRequest,
  findProviderProfileIdByUserId,
  findProviderUserIdByProfileId,
  findRequestByPublicId,
  findUserSnapshot,
  listConsumerRequests,
  listProviderInbox,
  listRequestDates,
  listRequestProviderLinks,
  listSentLinkProviderUserIds,
  lockProviderLink,
  lockServiceRequestByPublicId,
  markProviderLinkViewed,
  markRequestPendingProvider,
  rejectProviderLink,
  type ConsumerRequestStatus,
} from "@/server/modules/requests/request.repository";
import {
  OPEN_REQUEST_STATUSES,
  queryEligibleProviders,
  storeCandidates,
} from "@/server/modules/search/search.repository";

function assertExpectedVersion(
  current: number,
  expected: number | undefined,
): void {
  if (expected !== undefined && expected !== current) {
    throw new ApiError(
      409,
      API_ERROR_CODES.conflict,
      "نسخه درخواست قدیمی است.",
    );
  }
}

export async function notifyUser(input: {
  body: string;
  relatedServiceRequestId: bigint;
  requestPublicId: string;
  title: string;
  transaction: TransactionClient;
  type: NotificationType;
  userId: bigint;
  viewer: "consumer" | "provider";
}) {
  const template = buildRequestNotification({
    body: input.body,
    requestId: input.requestPublicId,
    title: input.title,
    type: input.type,
    viewer: input.viewer,
  });
  await enqueueDomainNotification({
    body: template.body,
    data: template.data,
    relatedServiceRequestId: input.relatedServiceRequestId,
    title: template.title,
    transaction: input.transaction,
    type: template.type,
    userId: input.userId,
  });
}

export type SendSkipReason = "already_sent" | "not_eligible";

/**
 * Sends an open request (awaiting_send / pending_provider) to more providers.
 * Every provider is revalidated live; ineligible or already-linked ones are
 * skipped and reported instead of failing the whole send. The first
 * successful send moves the request from awaiting_send to pending_provider.
 */
export async function sendRequestToProviders(
  userId: bigint,
  requestId: string,
  providerIds: string[],
  idempotencyKey: string,
) {
  const uniqueProviderIds = [...new Set(providerIds)];
  const span = startSpan({ name: "app.service-request.send" });

  try {
    const result = await getAppIdempotencyService().execute(
      {
        actorId: userId.toString(),
        key: idempotencyKey,
        operationId: "app.service-request.add-providers",
        realm: "app",
      },
      { providerIds: uniqueProviderIds, requestId },
      async () => {
        const request = await findRequestByPublicId(requestId);
        if (!request || request.consumerUserId !== userId) {
          throw new ApiError(404, API_ERROR_CODES.notFound, "درخواست یافت نشد.");
        }
        assertOpenForSending(request.status);

        const matches = await queryEligibleProviders({
          consumerUserId: userId,
          landLatitude: Number(request.landLatitudeSnapshot.toString()),
          landLongitude: Number(request.landLongitudeSnapshot.toString()),
          providerPublicIds: uniqueProviderIds,
          serviceId: request.serviceId,
        });
        const existing = await findExistingProviderLinks(
          request.id,
          matches.map((item) => item.providerProfileId),
        );
        const linked = new Set(existing.map((item) => item.providerProfileId.toString()));
        const matchByPublicId = new Map(matches.map((item) => [item.providerPublicId, item]));

        const skipped: Array<{
          name: string | null;
          providerId: string;
          reason: SendSkipReason;
        }> = [];
        const sendable: typeof matches = [];
        for (const providerPublicId of uniqueProviderIds) {
          const match = matchByPublicId.get(providerPublicId);
          if (!match) {
            skipped.push({ name: null, providerId: providerPublicId, reason: "not_eligible" });
          } else if (linked.has(match.providerProfileId.toString())) {
            skipped.push({
              name: match.providerName,
              providerId: providerPublicId,
              reason: "already_sent",
            });
          } else {
            sendable.push(match);
          }
        }

        if (sendable.length === 0) {
          return {
            requestId: request.publicId,
            sent: [] as Array<{ name: string | null; providerId: string }>,
            skipped,
            status: request.status,
            version: request.version,
          };
        }

        const now = systemClock.now();
        const outcome = await runInTransaction(async (transaction) => {
          const locked = await lockServiceRequestByPublicId(transaction, requestId);
          if (!locked || locked.consumerUserId !== userId) {
            throw new ApiError(404, API_ERROR_CODES.notFound, "درخواست یافت نشد.");
          }
          assertOpenForSending(locked.status);

          await addProvidersToRequest(transaction, {
            actorUserId: userId,
            providers: sendable.map((item) => ({
              distanceKm: item.distanceKm,
              providerName: item.providerName ?? "خدمات‌دهنده",
              providerProfileId: item.providerProfileId,
              providerServiceId: item.providerServiceId,
              priceToman: item.priceToman,
            })),
            requestId: locked.id,
          });
          await storeCandidates(locked.id, sendable, transaction);

          let status = locked.status;
          let version = locked.version;
          if (locked.status === "awaiting_send") {
            const moved = await markRequestPendingProvider(transaction, {
              actorUserId: userId,
              expectedVersion: locked.version,
              now,
              requestId: locked.id,
            });
            if (!moved) {
              throw new ApiError(409, API_ERROR_CODES.conflict, "نسخه درخواست قدیمی است.");
            }
            status = "pending_provider";
            version = locked.version + 1;
          }

          for (const item of sendable) {
            const providerUser = await findProviderUserIdByProfileId(item.providerProfileId);
            if (!providerUser) {
              continue;
            }
            await notifyUser({
              body: `درخواست جدید برای ${request.serviceNameSnapshot}`,
              relatedServiceRequestId: locked.id,
              requestPublicId: locked.publicId,
              title: "درخواست جدید",
              transaction,
              type: NOTIFICATION_TYPES.requestNew,
              userId: providerUser.userId,
              viewer: "provider",
            });
          }

          return { status, version };
        });

        return {
          requestId: request.publicId,
          sent: sendable.map((item) => ({
            name: item.providerName,
            providerId: item.providerPublicId,
          })),
          skipped,
          status: outcome.status,
          version: outcome.version,
        };
      },
    );

    span.finish();
    return result;
  } catch (error) {
    span.error(error);
    throw mapPrismaError(error) ?? error;
  }
}

function assertOpenForSending(status: string): void {
  if (!(OPEN_REQUEST_STATUSES as readonly string[]).includes(status)) {
    throw new ApiError(
      409,
      API_ERROR_CODES.conflict,
      "این درخواست دیگر قابل ارسال به خدمات‌دهنده جدید نیست.",
    );
  }
}

export async function listConsumerServiceRequests(
  userId: bigint,
  query: {
    cursor?: string;
    limit: number;
    status?: "open" | ConsumerRequestStatus;
  },
) {
  let cursorId: bigint | undefined;
  if (query.cursor) {
    const cursor = await findRequestByPublicId(query.cursor);
    if (!cursor || cursor.consumerUserId !== userId) {
      throw new ApiError(400, API_ERROR_CODES.validationFailed, "cursor معتبر نیست.");
    }
    cursorId = cursor.id;
  }

  const rows = await listConsumerRequests({
    cursorId,
    limit: query.limit,
    statuses:
      query.status === "open"
        ? [...OPEN_REQUEST_STATUSES]
        : query.status
          ? [query.status]
          : undefined,
    userId,
  });
  const hasMore = rows.length > query.limit;
  const page = hasMore ? rows.slice(0, query.limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map((row) =>
      mapConsumerRequestSummary({
        agreedPriceToman: row.agreedPriceToman,
        assignedProviderNameSnapshot: row.assignedProviderNameSnapshot,
        createdAt: row.createdAt,
        landTitleSnapshot: row.landTitleSnapshot,
        providersFound: row._count.serviceRequestCandidates,
        providersSent: row._count.serviceRequestProviders,
        publicId: row.publicId,
        serviceImage: row.service.image,
        serviceNameSnapshot: row.serviceNameSnapshot,
        status: row.status,
        version: row.version,
      }),
    ),
    meta: {
      hasMore,
      limit: query.limit,
      nextCursor: hasMore && last ? last.publicId : null,
    },
  };
}

export async function getConsumerServiceRequest(
  userId: bigint,
  requestId: string,
) {
  const request = await findRequestByPublicId(requestId);
  if (!request || request.consumerUserId !== userId) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "درخواست یافت نشد.");
  }

  const [dates, links] = await Promise.all([
    listRequestDates(request.id),
    listRequestProviderLinks(request.id),
  ]);

  let assignedProviderPublicId: string | null = null;
  if (request.assignedProviderProfileId) {
    const assigned = await findProviderUserIdByProfileId(
      request.assignedProviderProfileId,
    );
    assignedProviderPublicId = assigned?.user.publicId ?? null;
  }

  return mapConsumerRequestDetail({
    assignedProviderPublicId,
    dates,
    links: links.map((link) => ({
      distanceKm: link.distanceKm,
      phone: link.providerProfile.user.phone,
      providerNameSnapshot: link.providerNameSnapshot,
      providerPublicId: link.providerProfile.user.publicId,
      servicePriceSnapshotToman: link.servicePriceSnapshotToman,
      status: link.status,
    })),
    request,
  });
}

export async function listProviderServiceRequests(
  userId: bigint,
  query: {
    cursor?: string;
    limit: number;
    linkStatus?: "sent" | "accepted" | "rejected" | "removed";
  },
) {
  const profile = await findProviderProfileIdByUserId(userId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
  }

  let cursorId: bigint | undefined;
  if (query.cursor) {
    const cursorRequest = await findRequestByPublicId(query.cursor);
    if (!cursorRequest) {
      throw new ApiError(400, API_ERROR_CODES.validationFailed, "cursor معتبر نیست.");
    }
    const cursorLink = await findProviderLinkForRequest(
      cursorRequest.id,
      profile.id,
    );
    if (!cursorLink) {
      throw new ApiError(400, API_ERROR_CODES.validationFailed, "cursor معتبر نیست.");
    }
    cursorId = cursorLink.id;
  }

  const rows = await listProviderInbox({
    cursorId,
    limit: query.limit,
    linkStatus: query.linkStatus,
    providerProfileId: profile.id,
  });
  const hasMore = rows.length > query.limit;
  const page = hasMore ? rows.slice(0, query.limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map((row) =>
      mapProviderRequestSummary({
        distanceKm: row.distanceKm,
        landTitleSnapshot: row.request.landTitleSnapshot,
        linkStatus: row.status,
        priceToman: row.servicePriceSnapshotToman,
        publicId: row.request.publicId,
        sentAt: row.sentAt,
        serviceImage: row.request.service.image,
        serviceNameSnapshot: row.request.serviceNameSnapshot,
        status: row.request.status,
        version: row.request.version,
      }),
    ),
    meta: {
      hasMore,
      limit: query.limit,
      nextCursor: hasMore && last ? last.request.publicId : null,
    },
  };
}

export async function getProviderServiceRequest(
  userId: bigint,
  requestId: string,
) {
  const profile = await findProviderProfileIdByUserId(userId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
  }

  const request = await findRequestByPublicId(requestId);
  if (!request) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "درخواست یافت نشد.");
  }

  const link = await findProviderLinkForRequest(request.id, profile.id);
  if (!link) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "درخواست یافت نشد.");
  }

  const isAssigned =
    request.assignedProviderProfileId === profile.id &&
    (request.status === "in_progress" || request.status === "completed");

  if (
    link.status === "removed" &&
    request.assignedProviderProfileId !== profile.id
  ) {
    // Lost the race: say so explicitly (the UI shows a dedicated screen), but
    // still disclose nothing about the request, the farmer or the land.
    if (link.removedReason === "accepted_by_other") {
      throw new ApiError(
        409,
        API_ERROR_CODES.requestAlreadyAccepted,
        "این درخواست توسط خدمات‌دهنده دیگری قبول شد.",
      );
    }
    throw new ApiError(403, API_ERROR_CODES.forbidden, "دسترسی به این درخواست مجاز نیست.");
  }

  const [dates, consumer] = await Promise.all([
    listRequestDates(request.id),
    findUserSnapshot(request.consumerUserId),
  ]);

  return mapProviderRequestDetail({
    consumerName: consumer?.name ?? request.consumerNote ?? "خدمات‌گیرنده",
    consumerPhone: consumer?.phone ?? null,
    dates,
    distanceKm: link.distanceKm,
    isAssigned,
    linkStatus: link.status,
    priceToman: link.servicePriceSnapshotToman,
    request,
    viewedAt: link.viewedAt,
  });
}

export async function viewProviderServiceRequest(
  userId: bigint,
  requestId: string,
) {
  const profile = await findProviderProfileIdByUserId(userId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
  }
  const request = await findRequestByPublicId(requestId);
  if (!request) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "درخواست یافت نشد.");
  }
  const link = await findProviderLinkForRequest(request.id, profile.id);
  if (!link) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "درخواست یافت نشد.");
  }

  const updated = await markProviderLinkViewed(link.id, systemClock.now());
  return { requestId: request.publicId, viewed: true, newlyViewed: updated };
}

export async function acceptProviderServiceRequest(
  userId: bigint,
  requestId: string,
  input: { expectedVersion?: number },
) {
  const span = startSpan({ name: "app.service-request.accept" });

  try {
    const result = await acceptProviderServiceRequestCore(userId, requestId, input);
    span.finish();
    return result;
  } catch (error) {
    span.error(error);
    throw error;
  }
}

async function acceptProviderServiceRequestCore(
  userId: bigint,
  requestId: string,
  input: { expectedVersion?: number },
) {
  const profile = await findProviderProfileIdByUserId(userId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
  }

  const now = systemClock.now();
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const result = await runInTransaction(
        async (transaction) => {
          const locked = await lockServiceRequestByPublicId(
            transaction,
            requestId,
          );
          if (!locked) {
            throw new ApiError(404, API_ERROR_CODES.notFound, "درخواست یافت نشد.");
          }
          if (locked.status !== "pending_provider") {
            throw new ApiError(
              409,
              API_ERROR_CODES.requestAlreadyAccepted,
              "این درخواست قبلاً پذیرفته شده یا دیگر قابل قبول نیست.",
            );
          }
          assertExpectedVersion(locked.version, input.expectedVersion);

          const link = await lockProviderLink(
            transaction,
            locked.id,
            profile.id,
          );
          if (!link || link.status !== "sent") {
            throw new ApiError(
              409,
              API_ERROR_CODES.conflict,
              "لینک Provider برای قبول معتبر نیست.",
            );
          }

          const accepted = await acceptServiceRequest(transaction, {
            acceptedAt: now,
            expectedVersion: input.expectedVersion ?? locked.version,
            linkId: link.id,
            providerName: link.providerNameSnapshot,
            providerProfileId: profile.id,
            providerUserId: userId,
            requestId: locked.id,
            servicePriceToman: link.servicePriceSnapshotToman,
          });

          if (!accepted.ok) {
            throw new ApiError(
              409,
              API_ERROR_CODES.requestAlreadyAccepted,
              "این درخواست قبلاً پذیرفته شده است.",
            );
          }

          await notifyUser({
            body: `${link.providerNameSnapshot} درخواست را قبول کرد`,
            relatedServiceRequestId: locked.id,
            requestPublicId: locked.publicId,
            title: "درخواست قبول شد",
            transaction,
            type: NOTIFICATION_TYPES.requestAccepted,
            userId: locked.consumerUserId,
            viewer: "consumer",
          });

          return {
            requestId: locked.publicId,
            status: "in_progress" as const,
          };
        },
        { isolationLevel: "ReadCommitted" },
      );
      return result;
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError) {
        throw error;
      }
      if (attempt < 3 && isRetryablePrismaConflict(error)) {
        continue;
      }
      const mapped = mapPrismaError(error);
      if (mapped?.code === API_ERROR_CODES.conflict) {
        throw new ApiError(
          409,
          API_ERROR_CODES.requestAlreadyAccepted,
          "این درخواست قبلاً پذیرفته شده است.",
          { cause: error },
        );
      }
      throw (
        mapped ??
        new ApiError(
          500,
          API_ERROR_CODES.internalServerError,
          "قبول درخواست ناموفق بود.",
          { cause: error },
        )
      );
    }
  }

  throw (
    mapPrismaError(lastError) ??
    new ApiError(
      500,
      API_ERROR_CODES.internalServerError,
      "قبول درخواست ناموفق بود.",
      { cause: lastError },
    )
  );
}

export async function rejectProviderServiceRequest(
  userId: bigint,
  requestId: string,
  input: { expectedVersion?: number; reason?: string },
) {
  const profile = await findProviderProfileIdByUserId(userId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
  }

  const now = systemClock.now();
  return runInTransaction(async (transaction) => {
    const locked = await lockServiceRequestByPublicId(transaction, requestId);
    if (!locked) {
      throw new ApiError(404, API_ERROR_CODES.notFound, "درخواست یافت نشد.");
    }
    if (locked.status !== "pending_provider") {
      throw new ApiError(
        409,
        API_ERROR_CODES.conflict,
        "فقط درخواست در انتظار قابل رد است.",
      );
    }
    assertExpectedVersion(locked.version, input.expectedVersion);

    const link = await lockProviderLink(transaction, locked.id, profile.id);
    if (!link || link.status !== "sent") {
      throw new ApiError(
        409,
        API_ERROR_CODES.conflict,
        "لینک Provider برای رد معتبر نیست.",
      );
    }

    await rejectProviderLink(transaction, {
      linkId: link.id,
      now,
      providerUserId: userId,
      reason: input.reason ?? null,
    });

    await notifyUser({
      body: `${link.providerNameSnapshot} درخواست را رد کرد`,
      relatedServiceRequestId: locked.id,
      requestPublicId: locked.publicId,
      title: "درخواست رد شد",
      transaction,
      type: NOTIFICATION_TYPES.requestRejected,
      userId: locked.consumerUserId,
      viewer: "consumer",
    });

    return {
      linkStatus: "rejected" as const,
      requestId: locked.publicId,
      status: locked.status,
    };
  });
}

async function cancelRequestCore(input: {
  actorAdminId?: bigint | null;
  actorType: "consumer" | "provider" | "admin";
  actorUserId?: bigint | null;
  cancelledBy: "consumer" | "provider" | "admin";
  expectedVersion?: number;
  /** Overrides the default notification text sent to every party. */
  notificationBody?: string;
  /** Runs inside the cancel transaction, e.g. to write an admin audit row. */
  onCancelled?: (
    transaction: TransactionClient,
    locked: { fromStatus: string; id: bigint; publicId: string },
  ) => Promise<void>;
  reason: string | null;
  requestId: string;
  requireAssignedProviderId?: bigint;
  requireConsumerUserId?: bigint;
}) {
  const now = systemClock.now();

  return runInTransaction(async (transaction) => {
    const locked = await lockServiceRequestByPublicId(
      transaction,
      input.requestId,
    );
    if (!locked) {
      throw new ApiError(404, API_ERROR_CODES.notFound, "درخواست یافت نشد.");
    }

    if (
      input.requireConsumerUserId !== undefined &&
      locked.consumerUserId !== input.requireConsumerUserId
    ) {
      throw new ApiError(404, API_ERROR_CODES.notFound, "درخواست یافت نشد.");
    }

    if (
      input.requireAssignedProviderId !== undefined &&
      locked.assignedProviderProfileId !== input.requireAssignedProviderId
    ) {
      throw new ApiError(
        403,
        API_ERROR_CODES.forbidden,
        "فقط Provider تخصیص‌یافته می‌تواند لغو کند.",
      );
    }

    assertExpectedVersion(locked.version, input.expectedVersion);

    if (
      locked.status !== "awaiting_send" &&
      locked.status !== "pending_provider" &&
      locked.status !== "in_progress"
    ) {
      throw new ApiError(
        409,
        API_ERROR_CODES.conflict,
        "وضعیت درخواست برای لغو معتبر نیست.",
      );
    }

    if (locked.status === "in_progress" && !input.reason) {
      throw new ApiError(
        400,
        API_ERROR_CODES.validationFailed,
        "لغو در حال انجام نیاز به دلیل دارد.",
        { fields: { reason: ["دلیل لغو الزامی است."] } },
      );
    }

    if (
      (locked.status === "awaiting_send" || locked.status === "pending_provider") &&
      input.cancelledBy !== "consumer" &&
      input.cancelledBy !== "admin"
    ) {
      throw new ApiError(
        403,
        API_ERROR_CODES.forbidden,
        "لغو درخواست در انتظار فقط توسط Consumer یا Admin مجاز است.",
      );
    }

    const recipientIds = await listSentLinkProviderUserIds(locked.id);
    const cancelled = await cancelServiceRequest(transaction, {
      actorAdminId: input.actorAdminId ?? null,
      actorType: input.actorType,
      actorUserId: input.actorUserId ?? null,
      cancelledBy: input.cancelledBy,
      expectedVersion: input.expectedVersion ?? locked.version,
      fromStatus: locked.status as "awaiting_send" | "pending_provider" | "in_progress",
      now,
      reason: input.reason,
      requestId: locked.id,
    });

    if (!cancelled.ok) {
      throw new ApiError(
        409,
        API_ERROR_CODES.conflict,
        "لغو درخواست ممکن نبود.",
      );
    }

    const notifyTargets = new Set<string>();
    notifyTargets.add(locked.consumerUserId.toString());
    for (const providerUserId of recipientIds) {
      notifyTargets.add(providerUserId.toString());
    }

    for (const target of notifyTargets) {
      const targetId = BigInt(target);
      await notifyUser({
        body: input.notificationBody ?? "درخواست خدمت لغو شد",
        relatedServiceRequestId: locked.id,
        requestPublicId: locked.publicId,
        title: "درخواست لغو شد",
        transaction,
        type: NOTIFICATION_TYPES.requestCancelled,
        userId: targetId,
        viewer:
          targetId === locked.consumerUserId ? "consumer" : "provider",
      });
    }

    await input.onCancelled?.(transaction, {
      fromStatus: locked.status,
      id: locked.id,
      publicId: locked.publicId,
    });

    return {
      requestId: locked.publicId,
      status: "cancelled" as const,
    };
  });
}

/** Support cancels any open request; the reason is always required and shown to both sides. */
export async function cancelAdminServiceRequest(
  adminId: bigint,
  requestId: string,
  input: {
    expectedVersion?: number;
    onCancelled?: Parameters<typeof cancelRequestCore>[0]["onCancelled"];
    reason: string;
  },
) {
  return cancelRequestCore({
    actorAdminId: adminId,
    actorType: "admin",
    cancelledBy: "admin",
    expectedVersion: input.expectedVersion,
    notificationBody: `درخواست توسط پشتیبانی لغو شد: ${input.reason}`,
    onCancelled: input.onCancelled,
    reason: input.reason,
    requestId,
  });
}

export async function cancelConsumerServiceRequest(
  userId: bigint,
  requestId: string,
  input: { expectedVersion?: number; reason?: string },
) {
  return cancelRequestCore({
    actorType: "consumer",
    actorUserId: userId,
    cancelledBy: "consumer",
    expectedVersion: input.expectedVersion,
    reason: input.reason ?? null,
    requestId,
    requireConsumerUserId: userId,
  });
}

export async function cancelProviderServiceRequest(
  userId: bigint,
  requestId: string,
  input: { expectedVersion?: number; reason?: string },
) {
  const profile = await findProviderProfileIdByUserId(userId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
  }
  if (!input.reason) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "لغو توسط Provider نیاز به دلیل دارد.",
      { fields: { reason: ["دلیل لغو الزامی است."] } },
    );
  }

  return cancelRequestCore({
    actorType: "provider",
    actorUserId: userId,
    cancelledBy: "provider",
    expectedVersion: input.expectedVersion,
    reason: input.reason,
    requestId,
    requireAssignedProviderId: profile.id,
  });
}

export async function completeConsumerServiceRequest(
  userId: bigint,
  requestId: string,
  input: { expectedVersion?: number },
) {
  const now = systemClock.now();

  return runInTransaction(async (transaction) => {
    const locked = await lockServiceRequestByPublicId(transaction, requestId);
    if (!locked || locked.consumerUserId !== userId) {
      throw new ApiError(404, API_ERROR_CODES.notFound, "درخواست یافت نشد.");
    }
    if (locked.status !== "in_progress") {
      throw new ApiError(
        409,
        API_ERROR_CODES.conflict,
        "فقط درخواست در حال انجام قابل تکمیل است.",
      );
    }
    assertExpectedVersion(locked.version, input.expectedVersion);

    const completed = await completeServiceRequest(transaction, {
      consumerUserId: userId,
      expectedVersion: input.expectedVersion ?? locked.version,
      now,
      requestId: locked.id,
    });
    if (!completed.ok) {
      throw new ApiError(
        409,
        API_ERROR_CODES.conflict,
        "تکمیل درخواست ممکن نبود.",
      );
    }

    if (locked.assignedProviderProfileId) {
      const provider = await findProviderUserIdByProfileId(
        locked.assignedProviderProfileId,
      );
      if (provider) {
        await notifyUser({
          body: "کار توسط خدمات‌گیرنده تأیید شد",
          relatedServiceRequestId: locked.id,
          requestPublicId: locked.publicId,
          title: "کار به پایان رسید",
          transaction,
          type: NOTIFICATION_TYPES.requestCompleted,
          userId: provider.userId,
          viewer: "provider",
        });
      }
    }

    return {
      requestId: locked.publicId,
      status: "completed" as const,
    };
  });
}
