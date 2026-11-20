import { systemClock } from "@/server/clock/clock";
import { getSecurityEnvironment } from "@/server/config/env";
import { runInTransaction } from "@/server/db/transaction";
import {
  API_ERROR_CODES,
  ApiError,
  isRetryablePrismaConflict,
  mapPrismaError,
} from "@/server/errors";
import { getAppIdempotencyService } from "@/server/idempotency/default-idempotency";
import { createPublicId } from "@/server/identifiers/ulid";
import { startSpan } from "@/server/observability";
import {
  createMockPaymentProvider,
  type MockPaymentProvider,
} from "@/server/integrations/mock-payment-provider";
import { enqueuePaymentCallbackDeadLetter } from "@/server/modules/payments/payment-dead-letter";
import {
  mapActiveSubscription,
  mapPaymentDetail,
  mapPaymentSummary,
  mapPurchaseResult,
  mapSubscriptionHistoryItem,
  mapSubscriptionPlan,
} from "@/server/modules/subscriptions/subscriptions.mapper";
import {
  activateSubscriptionAndPayment,
  cancelPendingSubscription,
  createPendingPurchase,
  findActivePlanByCode,
  findActiveSubscriptionForProvider,
  findPaymentByAuthority,
  findPaymentByPublicIdForUser,
  findPaymentActivationPreview,
  findProviderProfileIdByUserId,
  findSubscriptionByPublicIdForProvider,
  getPlanDurationMonths,
  listActiveSubscriptionPlans,
  listProviderSubscriptions,
  listUserPayments,
  lockPaymentForActivation,
  lockProviderProfileForActivation,
  lockSubscriptionForActivation,
  markPaymentFailed,
  markPaymentPendingWithAuthority,
} from "@/server/modules/subscriptions/subscriptions.repository";
import { getSetting } from "@/server/modules/system/settings.service";

let paymentProviderSingleton: MockPaymentProvider | undefined;

function getPaymentProvider(): MockPaymentProvider {
  paymentProviderSingleton ??= createMockPaymentProvider(
    getSecurityEnvironment().TOKEN_HASH_SECRET,
  );
  return paymentProviderSingleton;
}

export function setPaymentProviderForTests(
  provider: MockPaymentProvider | undefined,
): void {
  paymentProviderSingleton = provider;
}

function gatewayCallbackUrl(gateway: string): string {
  const origin = getSecurityEnvironment().APP_ORIGIN.replace(/\/$/, "");
  return `${origin}/api/app/v1/payment-gateways/${gateway}/callback`;
}

async function requireProviderProfile(userId: bigint) {
  const profile = await findProviderProfileIdByUserId(userId);
  if (!profile) {
    throw new ApiError(
      404,
      API_ERROR_CODES.notFound,
      "پروفایل Provider یافت نشد.",
    );
  }
  return profile;
}

export async function listSubscriptionPlans() {
  const plans = await listActiveSubscriptionPlans();
  return plans.map(mapSubscriptionPlan);
}

export async function getCurrentProviderSubscription(userId: bigint) {
  const profile = await requireProviderProfile(userId);
  const now = systemClock.now();
  const subscription = await findActiveSubscriptionForProvider(profile.id, now);
  return {
    subscription: subscription
      ? mapActiveSubscription(subscription, now)
      : null,
  };
}

export async function listCurrentProviderSubscriptions(
  userId: bigint,
  input: { cursor?: string; limit: number },
) {
  const profile = await requireProviderProfile(userId);

  let cursorId: bigint | undefined;
  if (input.cursor) {
    const cursor = await findSubscriptionByPublicIdForProvider(
      profile.id,
      input.cursor,
    );
    if (!cursor) {
      throw new ApiError(
        400,
        API_ERROR_CODES.validationFailed,
        "cursor معتبر نیست.",
      );
    }
    cursorId = cursor.id;
  }

  const rows = await listProviderSubscriptions({
    cursorId,
    limit: input.limit,
    providerProfileId: profile.id,
  });
  const hasMore = rows.length > input.limit;
  const page = hasMore ? rows.slice(0, input.limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map(mapSubscriptionHistoryItem),
    meta: {
      hasMore,
      limit: input.limit,
      nextCursor: hasMore && last ? last.publicId : null,
    },
  };
}

export async function purchaseProviderSubscription(
  userId: bigint,
  input: { planCode: string },
  idempotencyKey: string,
) {
  const profile = await requireProviderProfile(userId);
  if (!(await getSetting("subscriptions.purchase_enabled"))) {
    throw new ApiError(
      409,
      API_ERROR_CODES.conflict,
      "خرید اشتراک موقتاً غیرفعال است؛ کمی بعد دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.",
    );
  }
  const idempotency = getAppIdempotencyService();

  return idempotency.execute(
    {
      actorId: userId.toString(),
      key: idempotencyKey,
      operationId: "provider.subscription.purchase",
      realm: "app",
    },
    input,
    async () => {
      const plan = await findActivePlanByCode(input.planCode);
      if (!plan) {
        throw new ApiError(404, API_ERROR_CODES.notFound, "پلن یافت نشد.");
      }

      const subscriptionPublicId = createPublicId();
      const paymentPublicId = createPublicId();

      let purchase: Awaited<ReturnType<typeof createPendingPurchase>>;
      try {
        purchase = await runInTransaction((transaction) =>
          createPendingPurchase(transaction, {
            amountToman: plan.priceToman,
            paymentPublicId,
            planId: plan.id,
            planName: plan.name,
            providerProfileId: profile.id,
            subscriptionPublicId,
            userId,
          }),
        );
      } catch (error) {
        throw (
          mapPrismaError(error) ??
          new ApiError(
            500,
            API_ERROR_CODES.internalServerError,
            "ایجاد خرید ناموفق بود.",
            { cause: error },
          )
        );
      }

      const provider = getPaymentProvider();
      let initiation: { authority: string; redirectUrl: string };
      try {
        initiation = await provider.initiate({
          amountToman: Number(plan.priceToman),
          callbackUrl: gatewayCallbackUrl("mock"),
          referenceId: purchase.payment.publicId,
        });
      } catch (error) {
        const now = systemClock.now();
        await markPaymentFailed(
          purchase.payment.id,
          now,
          "GATEWAY_INIT_FAILED",
          "شروع پرداخت در درگاه ناموفق بود.",
        );
        await cancelPendingSubscription(
          purchase.subscription.id,
          now,
          "gateway_init_failed",
        );
        throw new ApiError(
          502,
          API_ERROR_CODES.internalServerError,
          "درگاه پرداخت در دسترس نیست.",
          { cause: error },
        );
      }

      await markPaymentPendingWithAuthority(
        purchase.payment.id,
        initiation.authority,
      );

      return mapPurchaseResult({
        authority: initiation.authority,
        paymentPublicId: purchase.payment.publicId,
        redirectUrl: initiation.redirectUrl,
        subscriptionPublicId: purchase.subscription.publicId,
      });
    },
  );
}

export async function listCurrentUserPayments(
  userId: bigint,
  input: { cursor?: string; limit: number },
) {
  let cursorId: bigint | undefined;
  if (input.cursor) {
    const cursor = await findPaymentByPublicIdForUser(userId, input.cursor);
    if (!cursor) {
      throw new ApiError(
        400,
        API_ERROR_CODES.validationFailed,
        "cursor معتبر نیست.",
      );
    }
    cursorId = cursor.id;
  }

  const rows = await listUserPayments({
    cursorId,
    limit: input.limit,
    userId,
  });
  const hasMore = rows.length > input.limit;
  const page = hasMore ? rows.slice(0, input.limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map(mapPaymentSummary),
    meta: {
      hasMore,
      limit: input.limit,
      nextCursor: hasMore && last ? last.publicId : null,
    },
  };
}

export async function getCurrentUserPayment(
  userId: bigint,
  paymentId: string,
) {
  const payment = await findPaymentByPublicIdForUser(userId, paymentId);
  if (!payment) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پرداخت یافت نشد.");
  }
  return mapPaymentDetail(payment);
}

async function activatePaidPayment(input: {
  amountToman: bigint;
  authority: string;
  paymentId: bigint;
  providerReference: string;
}) {
  const now = systemClock.now();
  let lastError: unknown;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      return await runInTransaction(
        async (transaction) => {
          const paymentPreview = await findPaymentActivationPreview(
            transaction,
            input.paymentId,
          );
          const providerProfileId =
            paymentPreview?.providerProfileId ?? null;
          if (!providerProfileId) {
            throw new ApiError(
              409,
              API_ERROR_CODES.conflict,
              "پرداخت به اشتراک متصل نیست.",
            );
          }

          const lockedProfile = await lockProviderProfileForActivation(
            transaction,
            providerProfileId,
          );
          if (!lockedProfile) {
            throw new ApiError(
              404,
              API_ERROR_CODES.notFound,
              "پروفایل Provider یافت نشد.",
            );
          }

          const payment = await lockPaymentForActivation(
            transaction,
            input.paymentId,
          );
          if (!payment) {
            throw new ApiError(404, API_ERROR_CODES.notFound, "پرداخت یافت نشد.");
          }

          if (payment.status === "paid") {
            return { alreadyPaid: true as const };
          }

          if (
            payment.status !== "pending" &&
            payment.status !== "initiated"
          ) {
            throw new ApiError(
              409,
              API_ERROR_CODES.conflict,
              "وضعیت پرداخت برای فعال‌سازی معتبر نیست.",
            );
          }

          if (payment.amountToman !== input.amountToman) {
            throw new ApiError(
              400,
              API_ERROR_CODES.validationFailed,
              "مبلغ پرداخت با رکورد سیستم هم‌خوانی ندارد.",
            );
          }

          if (
            payment.authority &&
            payment.authority !== input.authority
          ) {
            throw new ApiError(
              400,
              API_ERROR_CODES.validationFailed,
              "authority پرداخت معتبر نیست.",
            );
          }

          if (!payment.providerSubscriptionId) {
            throw new ApiError(
              409,
              API_ERROR_CODES.conflict,
              "پرداخت به اشتراک متصل نیست.",
            );
          }

          const subscription = await lockSubscriptionForActivation(
            transaction,
            payment.providerSubscriptionId,
          );
          if (!subscription) {
            throw new ApiError(404, API_ERROR_CODES.notFound, "اشتراک یافت نشد.");
          }

          if (subscription.status === "active") {
            return { alreadyPaid: true as const };
          }

          if (subscription.status !== "pending") {
            throw new ApiError(
              409,
              API_ERROR_CODES.conflict,
              "وضعیت اشتراک برای فعال‌سازی معتبر نیست.",
            );
          }

          const durationMonths = await getPlanDurationMonths(
            subscription.subscriptionPlanId,
            transaction,
          );

          const window = await activateSubscriptionAndPayment(transaction, {
            durationMonths,
            now,
            paymentId: payment.id,
            providerProfileId: subscription.providerProfileId,
            providerReference: input.providerReference,
            subscriptionId: subscription.id,
          });

          return {
            alreadyPaid: false as const,
            endsAt: window.endsAt,
            startsAt: window.startsAt,
          };
        },
        { isolationLevel: "ReadCommitted" },
      );
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError) {
        throw error;
      }
      if (attempt < 5 && isRetryablePrismaConflict(error)) {
        continue;
      }
      throw (
        mapPrismaError(error) ??
        new ApiError(
          500,
          API_ERROR_CODES.internalServerError,
          "فعال‌سازی اشتراک ناموفق بود.",
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
      "فعال‌سازی اشتراک ناموفق بود.",
      { cause: lastError },
    )
  );
}

export async function verifyCurrentUserPayment(
  userId: bigint,
  paymentId: string,
) {
  const payment = await findPaymentByPublicIdForUser(userId, paymentId);
  if (!payment) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پرداخت یافت نشد.");
  }

  if (payment.status === "paid") {
    return mapPaymentDetail(payment);
  }

  if (!payment.authority) {
    throw new ApiError(
      409,
      API_ERROR_CODES.conflict,
      "پرداخت هنوز authority ندارد.",
    );
  }

  if (payment.status !== "pending" && payment.status !== "initiated") {
    throw new ApiError(
      409,
      API_ERROR_CODES.conflict,
      "وضعیت پرداخت برای verify معتبر نیست.",
    );
  }

  const provider = getPaymentProvider();
  let verification: { providerReference: string };
  try {
    verification = await provider.verify({
      amountToman: Number(payment.amountToman),
      authority: payment.authority,
    });
  } catch (error) {
    const now = systemClock.now();
    await markPaymentFailed(
      payment.id,
      now,
      "GATEWAY_VERIFY_FAILED",
      "تأیید پرداخت در درگاه ناموفق بود.",
    );
    if (payment.providerSubscriptionId) {
      await cancelPendingSubscription(
        payment.providerSubscriptionId,
        now,
        "gateway_verify_failed",
      );
    }
    throw new ApiError(
      502,
      API_ERROR_CODES.internalServerError,
      "تأیید درگاه پرداخت ناموفق بود.",
      { cause: error },
    );
  }

  await activatePaidPayment({
    amountToman: payment.amountToman,
    authority: payment.authority,
    paymentId: payment.id,
    providerReference: verification.providerReference,
  });

  const refreshed = await findPaymentByPublicIdForUser(userId, paymentId);
  if (!refreshed) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پرداخت یافت نشد.");
  }
  return mapPaymentDetail(refreshed);
}

export async function handlePaymentGatewayCallback(
  gateway: "mock",
  input: {
    amountToman: number;
    authority: string;
    signature: string;
  },
) {
  const span = startSpan({ name: "payment.callback" });

  try {
    const result = await handlePaymentGatewayCallbackCore(gateway, input);
    span.finish();
    return result;
  } catch (error) {
    span.error(error);
    throw error;
  }
}

async function handlePaymentGatewayCallbackCore(
  gateway: "mock",
  input: {
    amountToman: number;
    authority: string;
    signature: string;
  },
) {
  const provider = getPaymentProvider();
  if (
    !provider.verifyCallbackSignature({
      amountToman: input.amountToman,
      authority: input.authority,
      signature: input.signature,
    })
  ) {
    enqueuePaymentCallbackDeadLetter({
      error: "invalid_signature",
      payload: { gateway, ...input },
    });
    throw new ApiError(
      401,
      API_ERROR_CODES.forbidden,
      "امضای callback معتبر نیست.",
    );
  }

  const payment = await findPaymentByAuthority(gateway, input.authority);
  if (!payment) {
    enqueuePaymentCallbackDeadLetter({
      error: "payment_not_found",
      payload: { gateway, ...input },
    });
    throw new ApiError(404, API_ERROR_CODES.notFound, "پرداخت یافت نشد.");
  }

  if (payment.amountToman !== BigInt(input.amountToman)) {
    const now = systemClock.now();
    await markPaymentFailed(
      payment.id,
      now,
      "AMOUNT_mismatch",
      "مبلغ callback با رکورد سیستم هم‌خوانی نیست.",
    );
    if (payment.providerSubscriptionId) {
      await cancelPendingSubscription(
        payment.providerSubscriptionId,
        now,
        "amount_mismatch",
      );
    }
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "مبلغ callback معتبر نیست.",
    );
  }

  if (payment.status === "paid") {
    return {
      paymentId: payment.publicId,
      status: "paid" as const,
    };
  }

  let verification: { providerReference: string };
  try {
    verification = await provider.verify({
      amountToman: input.amountToman,
      authority: input.authority,
    });
  } catch (error) {
    enqueuePaymentCallbackDeadLetter({
      error:
        error instanceof Error ? error.message : "gateway_verify_failed",
      payload: { gateway, paymentId: payment.publicId, ...input },
    });
    throw new ApiError(
      502,
      API_ERROR_CODES.internalServerError,
      "تأیید درگاه پرداخت ناموفق بود.",
      { cause: error },
    );
  }

  try {
    await activatePaidPayment({
      amountToman: payment.amountToman,
      authority: input.authority,
      paymentId: payment.id,
      providerReference: verification.providerReference,
    });
  } catch (error) {
    enqueuePaymentCallbackDeadLetter({
      error: error instanceof Error ? error.message : "activation_failed",
      payload: { gateway, paymentId: payment.publicId, ...input },
    });
    throw error;
  }

  return {
    paymentId: payment.publicId,
    status: "paid" as const,
  };
}
