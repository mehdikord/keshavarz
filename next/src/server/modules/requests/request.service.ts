import { systemClock } from "@/server/clock/clock";
import { runInTransaction, type TransactionClient } from "@/server/db/transaction";
import {
  API_ERROR_CODES,
  ApiError,
  isRetryablePrismaConflict,
  mapPrismaError,
} from "@/server/errors";
import { getAppIdempotencyService } from "@/server/idempotency/default-idempotency";
import { createPublicId } from "@/server/identifiers/ulid";
import { startSpan } from "@/server/observability";
import { enqueueDomainNotification } from "@/server/modules/notifications/notification.service";
import { buildRequestNotification } from "@/server/modules/notifications/notification.templates";
import {
  NOTIFICATION_TYPES,
  type NotificationType,
} from "@/server/modules/notifications/notification.types";
import {
  mapAdminRequestDetail,
  mapAdminRequestHistories,
  mapAdminRequestSummary,
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
  createServiceRequestWithProviders,
  findAdminRequestByPublicId,
  findExistingProviderLinks,
  findLandSnapshot,
  findProviderLinkById,
  findProviderLinkForRequest,
  findProviderProfileIdByUserId,
  findProviderUserIdByProfileId,
  findRequestByPublicId,
  findUserIdByPublicId,
  findUserSnapshot,
  listAdminRequestProviderLinks,
  listAdminServiceRequests,
  listConsumerRequests,
  listProviderInbox,
  listRequestDates,
  listRequestProviderHistories,
  listRequestProviderLinks,
  listRequestStatusHistories,
  listSentLinkProviderUserIds,
  lockProviderLink,
  lockProviderLinkById,
  lockServiceRequestByPublicId,
  markProviderLinkViewed,
  rejectProviderLink,
  removeProviderLinkByAdmin,
} from "@/server/modules/requests/request.repository";
import { findEligibleProviderMatch } from "@/server/modules/search/search.repository";
import { revalidateSearchProviderMatch } from "@/server/modules/search/search.service";

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

async function notifyUser(input: {
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

export async function createServiceRequestFromSearch(
  userId: bigint,
  input: { providerIds: string[]; searchId: string },
  idempotencyKey: string,
) {
  const span = startSpan({ name: "app.service-request.create" });

  try {
    const uniqueProviderIds = [...new Set(input.providerIds)];
    const idempotency = getAppIdempotencyService();

    const result = await idempotency.execute(
    {
      actorId: userId.toString(),
      key: idempotencyKey,
      operationId: "app.service-request.create",
      realm: "app",
    },
    { providerIds: uniqueProviderIds, searchId: input.searchId },
    async () => {
      const matches: Array<
        Awaited<ReturnType<typeof revalidateSearchProviderMatch>>
      > = [];
      for (const providerPublicId of uniqueProviderIds) {
        const validated = await revalidateSearchProviderMatch({
          providerPublicId,
          searchId: input.searchId,
          userId,
        });
        matches.push(validated);
      }

      const context = matches[0]!.context;
      const [user, land] = await Promise.all([
        findUserSnapshot(userId),
        findLandSnapshot(context.landId, userId),
      ]);
      if (!user || !land) {
        throw new ApiError(
          409,
          API_ERROR_CODES.conflict,
          "کاربر یا زمین برای ایجاد درخواست معتبر نیست.",
        );
      }

      const providerPayload = matches.map((item) => ({
        distanceKm: item.match.distanceKm,
        providerName: item.match.providerName ?? "خدمات‌دهنده",
        providerProfileId: item.match.providerProfileId,
        providerServiceId: item.match.providerServiceId,
        priceToman: item.match.priceToman,
      }));

      let lastError: unknown;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const created = await runInTransaction(async (transaction) => {
            const request = await createServiceRequestWithProviders(
              transaction,
              {
                consumerName: user.name,
                consumerNote: context.consumerNote,
                consumerUserId: userId,
                dates: context.dates,
                land,
                providers: providerPayload,
                publicId: createPublicId(),
                serviceCategoryName: context.categoryName,
                serviceId: context.serviceId,
                serviceName: context.serviceName,
              },
            );

            for (const item of matches) {
              const providerUser = await findProviderUserIdByProfileId(
                item.match.providerProfileId,
              );
              if (!providerUser) {
                continue;
              }
              await notifyUser({
                body: `درخواست جدید برای ${context.serviceName}`,
                relatedServiceRequestId: request.id,
                requestPublicId: request.publicId,
                title: "درخواست جدید",
                transaction,
                type: NOTIFICATION_TYPES.requestNew,
                userId: providerUser.userId,
                viewer: "provider",
              });
            }

            return request;
          });

          return {
            createdAt: created.createdAt.toISOString(),
            requestId: created.publicId,
            status: created.status,
            version: created.version,
          };
        } catch (error) {
          lastError = error;
          if (attempt < 3 && isRetryablePrismaConflict(error)) {
            continue;
          }
          throw (
            mapPrismaError(error) ??
            new ApiError(
              500,
              API_ERROR_CODES.internalServerError,
              "ایجاد درخواست ناموفق بود.",
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
          "ایجاد درخواست ناموفق بود.",
          { cause: lastError },
        )
      );
    },
  );

    span.finish();
    return result;
  } catch (error) {
    span.error(error);
    throw error;
  }
}

export async function addProvidersToExistingRequest(
  userId: bigint,
  requestId: string,
  providerIds: string[],
  idempotencyKey: string,
) {
  const uniqueProviderIds = [...new Set(providerIds)];
  const idempotency = getAppIdempotencyService();

  return idempotency.execute(
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
      if (request.status !== "pending_provider") {
        throw new ApiError(
          409,
          API_ERROR_CODES.conflict,
          "فقط درخواست در انتظار قابل ارسال به Provider جدید است.",
        );
      }

      const matches: Array<
        NonNullable<Awaited<ReturnType<typeof findEligibleProviderMatch>>>
      > = [];
      for (const providerPublicId of uniqueProviderIds) {
        const match = await findEligibleProviderMatch({
          consumerUserId: userId,
          landLatitude: Number(request.landLatitudeSnapshot.toString()),
          landLongitude: Number(request.landLongitudeSnapshot.toString()),
          providerPublicId,
          serviceId: request.serviceId,
        });
        if (!match) {
          throw new ApiError(
            409,
            API_ERROR_CODES.conflict,
            "یکی از Providerها واجد شرایط نیست.",
          );
        }
        matches.push(match);
      }

      const existing = await findExistingProviderLinks(
        request.id,
        matches.map((item) => item.providerProfileId),
      );
      if (existing.length > 0) {
        throw new ApiError(
          409,
          API_ERROR_CODES.conflict,
          "یکی از Providerها قبلاً به این درخواست اضافه شده است.",
        );
      }

      await runInTransaction(async (transaction) => {
        await addProvidersToRequest(transaction, {
          actorUserId: userId,
          providers: matches.map((item) => ({
            distanceKm: item.distanceKm,
            providerName: item.providerName ?? "خدمات‌دهنده",
            providerProfileId: item.providerProfileId,
            providerServiceId: item.providerServiceId,
            priceToman: item.priceToman,
          })),
          requestId: request.id,
        });

        for (const item of matches) {
          const providerUser = await findProviderUserIdByProfileId(
            item.providerProfileId,
          );
          if (!providerUser) {
            continue;
          }
          await notifyUser({
            body: `درخواست جدید برای ${request.serviceNameSnapshot}`,
            relatedServiceRequestId: request.id,
            requestPublicId: request.publicId,
            title: "درخواست جدید",
            transaction,
            type: NOTIFICATION_TYPES.requestNew,
            userId: providerUser.userId,
            viewer: "provider",
          });
        }
      });

      return { added: matches.length, requestId: request.publicId };
    },
  );
}

export async function listConsumerServiceRequests(
  userId: bigint,
  query: {
    cursor?: string;
    limit: number;
    status?: "pending_provider" | "in_progress" | "completed" | "cancelled";
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
    status: query.status,
    userId,
  });
  const hasMore = rows.length > query.limit;
  const page = hasMore ? rows.slice(0, query.limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map(mapConsumerRequestSummary),
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
      locked.status === "pending_provider" &&
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
      fromStatus: locked.status,
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
        body: "درخواست خدمت لغو شد",
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

    return {
      requestId: locked.publicId,
      status: "cancelled" as const,
    };
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

export async function cancelAdminServiceRequest(
  adminId: bigint,
  requestId: string,
  input: { expectedVersion?: number; reason: string },
) {
  return cancelRequestCore({
    actorAdminId: adminId,
    actorType: "admin",
    cancelledBy: "admin",
    expectedVersion: input.expectedVersion,
    reason: input.reason,
    requestId,
  });
}

export async function listAdminManagedServiceRequests(query: {
  consumerUserId?: string;
  cursor?: string;
  limit: number;
  q?: string;
  status?: "pending_provider" | "in_progress" | "completed" | "cancelled";
}) {
  let cursorId: bigint | undefined;
  if (query.cursor) {
    const cursor = await findRequestByPublicId(query.cursor);
    if (!cursor) {
      throw new ApiError(
        400,
        API_ERROR_CODES.validationFailed,
        "cursor معتبر نیست.",
      );
    }
    cursorId = cursor.id;
  }

  let consumerUserId: bigint | undefined;
  if (query.consumerUserId) {
    const consumer = await findUserIdByPublicId(query.consumerUserId);
    if (!consumer) {
      throw new ApiError(404, API_ERROR_CODES.notFound, "کاربر یافت نشد.");
    }
    consumerUserId = consumer.id;
  }

  const rows = await listAdminServiceRequests({
    consumerUserId,
    cursorId,
    limit: query.limit,
    publicId: query.q,
    status: query.status,
  });
  const hasMore = rows.length > query.limit;
  const page = hasMore ? rows.slice(0, query.limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map((row) =>
      mapAdminRequestSummary({
        agreedPriceToman: row.agreedPriceToman,
        assignedProviderNameSnapshot: row.assignedProviderNameSnapshot,
        consumerPublicId: row.consumer.publicId,
        createdAt: row.createdAt,
        landTitleSnapshot: row.landTitleSnapshot,
        publicId: row.publicId,
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

export async function getAdminManagedServiceRequest(requestId: string) {
  const request = await findAdminRequestByPublicId(requestId);
  if (!request) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "درخواست یافت نشد.");
  }

  const [dates, links] = await Promise.all([
    listRequestDates(request.id),
    listAdminRequestProviderLinks(request.id),
  ]);

  let assignedProviderPublicId: string | null = null;
  if (request.assignedProviderProfileId) {
    const assigned = await findProviderUserIdByProfileId(
      request.assignedProviderProfileId,
    );
    assignedProviderPublicId = assigned?.user.publicId ?? null;
  }

  return mapAdminRequestDetail({
    assignedProviderPublicId,
    consumerPublicId: request.consumer.publicId,
    dates,
    links: links.map((link) => ({
      distanceKm: link.distanceKm,
      id: link.id,
      phone: link.providerProfile.user.phone,
      providerNameSnapshot: link.providerNameSnapshot,
      providerPublicId: link.providerProfile.user.publicId,
      rejectionReason: link.rejectionReason,
      removedReason: link.removedReason,
      respondedAt: link.respondedAt,
      sentAt: link.sentAt,
      servicePriceSnapshotToman: link.servicePriceSnapshotToman,
      status: link.status,
      viewedAt: link.viewedAt,
    })),
    request,
  });
}

export async function getAdminManagedServiceRequestHistories(
  requestId: string,
) {
  const request = await findRequestByPublicId(requestId);
  if (!request) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "درخواست یافت نشد.");
  }

  const [statusHistories, providerLinkHistories] = await Promise.all([
    listRequestStatusHistories(request.id),
    listRequestProviderHistories(request.id),
  ]);

  return mapAdminRequestHistories({
    providerLinkHistories,
    statusHistories,
  });
}

export async function removeAdminServiceRequestProvider(
  adminId: bigint,
  linkId: string,
  input: { reason?: string },
) {
  const parsedLinkId = BigInt(linkId);
  const existing = await findProviderLinkById(parsedLinkId);
  if (!existing) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "لینک Provider یافت نشد.");
  }

  if (existing.status === "accepted" && existing.request.status === "in_progress") {
    throw new ApiError(
      409,
      API_ERROR_CODES.conflict,
      "برای Provider پذیرفته‌شده در درخواست در حال انجام باید از لغو درخواست استفاده شود.",
    );
  }

  if (existing.status !== "sent") {
    throw new ApiError(
      409,
      API_ERROR_CODES.conflict,
      "فقط لینک با وضعیت sent قابل حذف است.",
    );
  }

  const now = systemClock.now();

  return runInTransaction(async (transaction) => {
    const locked = await lockProviderLinkById(transaction, parsedLinkId);
    if (!locked) {
      throw new ApiError(
        404,
        API_ERROR_CODES.notFound,
        "لینک Provider یافت نشد.",
      );
    }

    if (locked.status === "accepted" && locked.requestStatus === "in_progress") {
      throw new ApiError(
        409,
        API_ERROR_CODES.conflict,
        "برای Provider پذیرفته‌شده در درخواست در حال انجام باید از لغو درخواست استفاده شود.",
      );
    }

    if (locked.status !== "sent") {
      throw new ApiError(
        409,
        API_ERROR_CODES.conflict,
        "فقط لینک با وضعیت sent قابل حذف است.",
      );
    }

    const removed = await removeProviderLinkByAdmin(transaction, {
      adminId,
      fromStatus: "sent",
      linkId: locked.id,
      now,
      reason: input.reason ?? null,
    });

    if (!removed.ok) {
      throw new ApiError(
        409,
        API_ERROR_CODES.conflict,
        "حذف لینک Provider ممکن نبود.",
      );
    }

    return {
      linkId: locked.id.toString(),
      removedReason: "admin_removed" as const,
      requestId: locked.requestPublicId,
      status: "removed" as const,
    };
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
