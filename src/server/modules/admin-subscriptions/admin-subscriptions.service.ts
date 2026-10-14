import { systemClock } from "@/server/clock/clock";
import {
  API_ERROR_CODES,
  ApiError,
  mapPrismaError,
} from "@/server/errors";
import {
  mapAdminPaymentDetail,
  mapAdminPaymentSummary,
  mapAdminProviderSubscription,
  mapAdminRefund,
  mapAdminSubscriptionPlan,
} from "@/server/modules/admin-subscriptions/admin-subscriptions.mapper";
import {
  countActiveSubscriptionsForPlan,
  createSubscriptionPlan,
  findAdminPaymentByPublicId,
  findPaymentCursorByPublicId,
  findPlanByCode,
  findProviderProfileIdByUserPublicId,
  findRefundCursorById,
  findSubscriptionCursorByPublicId,
  findUserIdByPublicId,
  listAdminPayments,
  listAdminProviderSubscriptions,
  listAdminRefunds,
  listAdminSubscriptionPlans,
  softDeleteSubscriptionPlan,
  updateSubscriptionPlan,
} from "@/server/modules/admin-subscriptions/admin-subscriptions.repository";

export async function listSubscriptionPlansForAdmin(input: {
  includeDeleted: boolean;
  isActive?: 0 | 1;
}) {
  const plans = await listAdminSubscriptionPlans(input);
  return plans.map(mapAdminSubscriptionPlan);
}

export async function createSubscriptionPlanForAdmin(
  adminId: bigint,
  input: {
    code: string;
    description?: string | null;
    durationMonths: number;
    features?: unknown;
    isActive: boolean;
    isRecommended: boolean;
    name: string;
    priceToman: number;
    sortOrder: number;
  },
) {
  const existing = await findPlanByCode(input.code);
  if (existing) {
    throw new ApiError(
      409,
      API_ERROR_CODES.conflict,
      "پلن با این کد از قبل وجود دارد.",
    );
  }

  try {
    const plan = await createSubscriptionPlan({
      adminId,
      code: input.code,
      description: input.description,
      durationMonths: input.durationMonths,
      features: input.features,
      isActive: input.isActive,
      isRecommended: input.isRecommended,
      name: input.name,
      now: systemClock.now(),
      priceToman: BigInt(input.priceToman),
      sortOrder: input.sortOrder,
    });
    return mapAdminSubscriptionPlan(plan);
  } catch (error) {
    throw (
      mapPrismaError(error) ??
      new ApiError(
        500,
        API_ERROR_CODES.internalServerError,
        "ایجاد پلن ناموفق بود.",
        { cause: error },
      )
    );
  }
}

export async function updateSubscriptionPlanForAdmin(
  adminId: bigint,
  planCode: string,
  input: {
    description?: string | null;
    durationMonths?: number;
    features?: unknown;
    isActive?: boolean;
    isRecommended?: boolean;
    name?: string;
    priceToman?: number;
    sortOrder?: number;
  },
) {
  const plan = await findPlanByCode(planCode);
  if (!plan || plan.deletedAt) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پلن یافت نشد.");
  }

  try {
    const updated = await updateSubscriptionPlan(plan.id, {
      adminId,
      description: input.description,
      durationMonths: input.durationMonths,
      features: input.features,
      isActive: input.isActive,
      isRecommended: input.isRecommended,
      name: input.name,
      now: systemClock.now(),
      priceToman:
        input.priceToman === undefined ? undefined : BigInt(input.priceToman),
      sortOrder: input.sortOrder,
    });
    return mapAdminSubscriptionPlan(updated);
  } catch (error) {
    throw (
      mapPrismaError(error) ??
      new ApiError(
        500,
        API_ERROR_CODES.internalServerError,
        "به‌روزرسانی پلن ناموفق بود.",
        { cause: error },
      )
    );
  }
}

export async function deleteSubscriptionPlanForAdmin(
  adminId: bigint,
  planCode: string,
) {
  const plan = await findPlanByCode(planCode);
  if (!plan || plan.deletedAt) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پلن یافت نشد.");
  }

  const activeCount = await countActiveSubscriptionsForPlan(plan.id);
  if (activeCount > 0) {
    throw new ApiError(
      409,
      API_ERROR_CODES.conflict,
      "پلن دارای اشتراک فعال است و قابل حذف نیست.",
    );
  }

  const deleted = await softDeleteSubscriptionPlan(plan.id, {
    adminId,
    now: systemClock.now(),
  });
  return mapAdminSubscriptionPlan(deleted);
}

export async function listProviderSubscriptionsForAdmin(input: {
  cursor?: string;
  limit: number;
  providerId?: string;
  status?: "pending" | "active" | "expired" | "cancelled";
}) {
  let cursorId: bigint | undefined;
  if (input.cursor) {
    const cursor = await findSubscriptionCursorByPublicId(input.cursor);
    if (!cursor) {
      throw new ApiError(
        400,
        API_ERROR_CODES.validationFailed,
        "cursor معتبر نیست.",
      );
    }
    cursorId = cursor.id;
  }

  let providerProfileId: bigint | undefined;
  if (input.providerId) {
    const profile = await findProviderProfileIdByUserPublicId(input.providerId);
    if (!profile) {
      throw new ApiError(404, API_ERROR_CODES.notFound, "Provider یافت نشد.");
    }
    providerProfileId = profile.id;
  }

  const rows = await listAdminProviderSubscriptions({
    cursorId,
    limit: input.limit,
    providerProfileId,
    status: input.status,
  });
  const hasMore = rows.length > input.limit;
  const page = hasMore ? rows.slice(0, input.limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map((row) =>
      mapAdminProviderSubscription({
        amountToman: row.amountToman,
        cancelledAt: row.cancelledAt,
        createdAt: row.createdAt,
        endsAt: row.endsAt,
        plan: row.plan,
        planNameSnapshot: row.planNameSnapshot,
        providerPublicId: row.providerProfile.user.publicId,
        publicId: row.publicId,
        source: row.source,
        startsAt: row.startsAt,
        status: row.status,
      }),
    ),
    meta: {
      hasMore,
      limit: input.limit,
      nextCursor: hasMore && last ? last.publicId : null,
    },
  };
}

export async function listPaymentsForAdmin(input: {
  cursor?: string;
  limit: number;
  status?:
    | "initiated"
    | "pending"
    | "paid"
    | "failed"
    | "cancelled"
    | "partially_refunded"
    | "refunded";
  userId?: string;
}) {
  let cursorId: bigint | undefined;
  if (input.cursor) {
    const cursor = await findPaymentCursorByPublicId(input.cursor);
    if (!cursor) {
      throw new ApiError(
        400,
        API_ERROR_CODES.validationFailed,
        "cursor معتبر نیست.",
      );
    }
    cursorId = cursor.id;
  }

  let userId: bigint | undefined;
  if (input.userId) {
    const user = await findUserIdByPublicId(input.userId);
    if (!user) {
      throw new ApiError(404, API_ERROR_CODES.notFound, "کاربر یافت نشد.");
    }
    userId = user.id;
  }

  const rows = await listAdminPayments({
    cursorId,
    limit: input.limit,
    status: input.status,
    userId,
  });
  const hasMore = rows.length > input.limit;
  const page = hasMore ? rows.slice(0, input.limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map((row) =>
      mapAdminPaymentSummary({
        amountToman: row.amountToman,
        createdAt: row.createdAt,
        gateway: row.gateway,
        paidAt: row.paidAt,
        publicId: row.publicId,
        status: row.status,
        subscriptionPublicId: row.subscription?.publicId ?? null,
        userPublicId: row.user.publicId,
      }),
    ),
    meta: {
      hasMore,
      limit: input.limit,
      nextCursor: hasMore && last ? last.publicId : null,
    },
  };
}

export async function getPaymentForAdmin(paymentId: string) {
  const payment = await findAdminPaymentByPublicId(paymentId);
  if (!payment) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پرداخت یافت نشد.");
  }

  return mapAdminPaymentDetail({
    amountToman: payment.amountToman,
    authority: payment.authority,
    createdAt: payment.createdAt,
    failedAt: payment.failedAt,
    failureCode: payment.failureCode,
    failureMessage: payment.failureMessage,
    gateway: payment.gateway,
    paidAt: payment.paidAt,
    publicId: payment.publicId,
    refunds: payment.paymentRefunds,
    status: payment.status,
    subscriptionPublicId: payment.subscription?.publicId ?? null,
    subscriptionStatus: payment.subscription?.status ?? null,
    transactionReference: payment.transactionReference,
    userPublicId: payment.user.publicId,
  });
}

export async function listRefundsForAdmin(input: {
  cursor?: string;
  limit: number;
  status?:
    | "requested"
    | "processing"
    | "succeeded"
    | "failed"
    | "cancelled";
}) {
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
    const cursor = await findRefundCursorById(cursorId);
    if (!cursor) {
      throw new ApiError(
        400,
        API_ERROR_CODES.validationFailed,
        "cursor معتبر نیست.",
      );
    }
  }

  const rows = await listAdminRefunds({
    cursorId,
    limit: input.limit,
    status: input.status,
  });
  const hasMore = rows.length > input.limit;
  const page = hasMore ? rows.slice(0, input.limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map((row) =>
      mapAdminRefund({
        amountToman: row.amountToman,
        createdAt: row.createdAt,
        id: row.id,
        paymentPublicId: row.payment.publicId,
        processedAt: row.processedAt,
        reason: row.reason,
        requestedByAdminPublicId: row.requestedByAdmin?.publicId ?? null,
        status: row.status,
      }),
    ),
    meta: {
      hasMore,
      limit: input.limit,
      nextCursor: hasMore && last ? last.id.toString() : null,
    },
  };
}
