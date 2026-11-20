import type { NextRequest } from "next/server";

import { systemClock } from "@/server/clock/clock";
import { runInTransaction, type TransactionClient } from "@/server/db/transaction";
import { API_ERROR_CODES, ApiError, mapPrismaError } from "@/server/errors";
import { createPublicId } from "@/server/identifiers/ulid";
import { recordAdminAudit } from "@/server/modules/admin/audit/admin-audit.service";
import {
  cancelOpenPaymentsOfSubscription,
  cancelSubscriptionRow,
  countOpenSubscriptionsForPlan,
  countPaymentsPerStatus,
  countSubscriptionsPerPlan,
  countSubscriptionsPerStatus,
  expireSubscription,
  findActiveSubscriptionRow,
  findPaymentDetail,
  findPaymentForRefund,
  findPlanById,
  findPlanIdByCode,
  findProviderByUserPublicId,
  findSubscriptionByPublicId,
  insertGrantedSubscription,
  insertManualRefund,
  insertPlan,
  listLivePlanIds,
  listPaymentRows,
  listPlanOptions,
  listPlanRows,
  listSubscriptionRows,
  nextPlanSortOrder,
  searchProviders,
  setPaymentStatus,
  setPlanSortOrder,
  setSubscriptionEnd,
  sumRefundsInPeriod,
  sumRevenuePerPlan,
  sumSucceededRefunds,
  updatePlanRow,
} from "@/server/modules/admin/billing/billing.repository";
import type {
  BillingDuration,
  PaymentRefundInput,
  PaymentsListQuery,
  PlanCreateInput,
  PlanUpdateInput,
  SubscriptionExtendInput,
  SubscriptionGrantInput,
  SubscriptionsListQuery,
} from "@/server/modules/admin/billing/billing.schemas";
import { enqueueDomainNotification } from "@/server/modules/notifications/notification.service";
import { buildSubscriptionNotification } from "@/server/modules/notifications/notification.templates";
import { NOTIFICATION_TYPES } from "@/server/modules/notifications/notification.types";
import {
  lockPaymentForActivation,
  lockProviderProfileForActivation,
} from "@/server/modules/subscriptions/subscriptions.repository";

interface Actor {
  adminId: bigint;
  request?: NextRequest;
}

const iso = (value: Date | null | undefined) => value?.toISOString() ?? null;

/**
 * Locking transactions read committed data after taking the row lock; under
 * MySQL's default REPEATABLE READ the reads after the lock would still see the
 * snapshot from before it (e.g. a refund sum missing a concurrent refund).
 */
const LOCKED = { isolationLevel: "ReadCommitted" } as const;
const DAY_MS = 86_400_000;

function rethrow(error: unknown): never {
  if (error instanceof ApiError) throw error;
  throw mapPrismaError(error) ?? error;
}

/** Calendar months like the purchase flow (`setUTCMonth`), or whole days. */
export function addDuration(from: Date, duration: BillingDuration): Date {
  const result = new Date(from);
  if (duration.unit === "months") result.setUTCMonth(result.getUTCMonth() + duration.amount);
  else result.setTime(result.getTime() + duration.amount * DAY_MS);
  return result;
}

const durationLabel = (duration: BillingDuration) =>
  `${new Intl.NumberFormat("fa-IR").format(duration.amount)} ${duration.unit === "months" ? "ماه" : "روز"}`;

async function notifyProvider(
  transaction: TransactionClient,
  input: { body: string; eventKey: string; title: string; type: "granted" | "ended"; userId: bigint },
) {
  const template = buildSubscriptionNotification({
    body: input.body,
    eventKey: input.eventKey,
    title: input.title,
    type: input.type === "granted" ? NOTIFICATION_TYPES.subscriptionGranted : NOTIFICATION_TYPES.subscriptionExpired,
  });
  await enqueueDomainNotification({ ...template, transaction, userId: input.userId });
}

// ==================================================================== subscriptions

export interface AdminSubscriptionItem {
  amountToman: number;
  cancellationReason: string | null;
  cancelledAt: string | null;
  createdAt: string;
  daysLeft: number | null;
  endsAt: string | null;
  grantedBy: string | null;
  id: string;
  latestPayment: { id: string; status: string } | null;
  plan: { id: string; name: string };
  planName: string;
  provider: { id: string; image: string | null; name: string; phone: string };
  source: string;
  startsAt: string | null;
  status: string;
}

export interface AdminSubscriptionList {
  counts: Record<"all" | "pending" | "active" | "expired" | "cancelled", number>;
  items: AdminSubscriptionItem[];
  page: number;
  pageCount: number;
  perPage: number;
  plans: Array<{ durationMonths: number; id: string; isActive: boolean; name: string; priceToman: number }>;
  total: number;
}

export async function getPlanOptions() {
  const rows = await listPlanOptions();
  return rows.map((row) => ({
    durationMonths: row.durationMonths,
    id: row.id.toString(),
    isActive: row.isActive === 1,
    name: row.name,
    priceToman: Number(row.priceToman),
  }));
}

export async function listAdminSubscriptions(query: SubscriptionsListQuery): Promise<AdminSubscriptionList> {
  const now = systemClock.now();
  const [{ rows, total }, perStatus, plans] = await Promise.all([
    listSubscriptionRows(query),
    countSubscriptionsPerStatus(query),
    getPlanOptions(),
  ]);

  const counts = {
    active: perStatus.active ?? 0,
    all: Object.values(perStatus).reduce((sum, value) => sum + value, 0),
    cancelled: perStatus.cancelled ?? 0,
    expired: perStatus.expired ?? 0,
    pending: perStatus.pending ?? 0,
  };

  return {
    counts,
    items: rows.map((row) => ({
      amountToman: Number(row.amountToman),
      cancellationReason: row.cancellationReason,
      cancelledAt: iso(row.cancelledAt),
      createdAt: row.createdAt.toISOString(),
      daysLeft:
        row.status === "active" && row.endsAt ? Math.max(0, Math.ceil((row.endsAt.getTime() - now.getTime()) / DAY_MS)) : null,
      endsAt: iso(row.endsAt),
      grantedBy: row.grantedByAdmin?.name ?? null,
      id: row.publicId,
      latestPayment: row.subscriptionPayments[0]
        ? { id: row.subscriptionPayments[0].publicId, status: row.subscriptionPayments[0].status }
        : null,
      plan: { id: row.plan.id.toString(), name: row.plan.name },
      planName: row.planNameSnapshot,
      provider: {
        id: row.providerProfile.user.publicId,
        image: row.providerProfile.user.image,
        name: row.providerProfile.user.name,
        phone: row.providerProfile.user.phone,
      },
      source: row.source,
      startsAt: iso(row.startsAt),
      status: row.status,
    })),
    page: query.page,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    perPage: query.perPage,
    plans,
    total,
  };
}

export interface ProviderLookupItem {
  activeUntil: string | null;
  activePlan: string | null;
  id: string;
  image: string | null;
  name: string;
  phone: string;
}

export async function lookupProviders(q?: string): Promise<ProviderLookupItem[]> {
  const rows = await searchProviders(q, systemClock.now());
  return rows.map((row) => {
    const active = row.providerProfile?.providerSubscriptions[0];
    return {
      activePlan: active?.planNameSnapshot ?? null,
      activeUntil: iso(active?.endsAt),
      id: row.publicId,
      image: row.image,
      name: row.name,
      phone: row.phone,
    };
  });
}

/**
 * Grants work like a purchase activation: the new subscription starts now and
 * any remaining time of the running one is carried over (that one is marked
 * expired, keeping the single-active-subscription guard).
 */
export async function grantAdminSubscription(actor: Actor, input: SubscriptionGrantInput) {
  const now = systemClock.now();
  try {
    return await runInTransaction(async (transaction) => {
      const user = await findProviderByUserPublicId(transaction, input.providerUserId);
      if (!user || user.deletedAt || !user.providerProfile) {
        throw new ApiError(404, API_ERROR_CODES.notFound, "خدمات‌دهنده پیدا نشد.", {
          fields: { providerUserId: ["خدمات‌دهنده پیدا نشد."] },
        });
      }
      const plan = await findPlanById(transaction, BigInt(input.planId));
      if (!plan) {
        throw new ApiError(400, API_ERROR_CODES.validationFailed, "پلن انتخاب‌شده معتبر نیست.", {
          fields: { planId: ["پلن انتخاب‌شده معتبر نیست."] },
        });
      }
      const profileId = user.providerProfile.id;
      await lockProviderProfileForActivation(transaction, profileId);

      const duration: BillingDuration = input.duration ?? { amount: plan.durationMonths, unit: "months" };
      const running = await findActiveSubscriptionRow(transaction, profileId);
      const base = running?.endsAt && running.endsAt > now ? running.endsAt : now;
      const endsAt = addDuration(base, duration);
      if (running) await expireSubscription(transaction, running.id, now);

      const created = await insertGrantedSubscription(transaction, {
        adminId: actor.adminId,
        endsAt,
        now,
        planId: plan.id,
        planName: plan.name,
        providerProfileId: profileId,
        publicId: createPublicId(),
      });

      await recordAdminAudit(
        {
          action: "billing.subscriptions.grant",
          adminId: actor.adminId,
          metadata: {
            carriedOverFrom: running?.publicId ?? null,
            duration,
            providerUserId: input.providerUserId,
            reason: input.reason,
          },
          module: "billing",
          newValues: { endsAt, planId: plan.id, planName: plan.name, startsAt: now, status: "active" },
          request: actor.request,
          subject: { id: created.id, type: "provider_subscription" },
        },
        transaction,
      );
      await notifyProvider(transaction, {
        body: `اشتراک «${plan.name}» به مدت ${durationLabel(duration)} برای شما فعال شد.`,
        eventKey: `subscription_granted:${created.publicId}`,
        title: "اشتراک هدیه فعال شد",
        type: "granted",
        userId: user.id,
      });
      return { endsAt: endsAt.toISOString(), id: created.publicId };
    }, LOCKED);
  } catch (error) {
    rethrow(error);
  }
}

async function requireSubscription(transaction: TransactionClient, publicId: string) {
  const subscription = await findSubscriptionByPublicId(transaction, publicId);
  if (!subscription) throw new ApiError(404, API_ERROR_CODES.notFound, "اشتراک پیدا نشد.");
  return subscription;
}

export async function extendAdminSubscription(actor: Actor, publicId: string, input: SubscriptionExtendInput) {
  const now = systemClock.now();
  try {
    return await runInTransaction(async (transaction) => {
      const found = await requireSubscription(transaction, publicId);
      await lockProviderProfileForActivation(transaction, found.providerProfileId);
      const current = await requireSubscription(transaction, publicId);
      if (current.status !== "active" || !current.endsAt) {
        throw new ApiError(409, API_ERROR_CODES.conflict, "فقط اشتراک فعال قابل تمدید است.");
      }
      // An overdue row the expiry job has not reached yet is extended from now.
      const base = current.endsAt > now ? current.endsAt : now;
      const endsAt = addDuration(base, input.duration);
      await setSubscriptionEnd(transaction, current.id, endsAt, now);

      await recordAdminAudit(
        {
          action: "billing.subscriptions.extend",
          adminId: actor.adminId,
          metadata: { duration: input.duration, reason: input.reason },
          module: "billing",
          newValues: { endsAt },
          oldValues: { endsAt: current.endsAt },
          request: actor.request,
          subject: { id: current.id, type: "provider_subscription" },
        },
        transaction,
      );
      await notifyProvider(transaction, {
        body: `اشتراک «${current.planNameSnapshot}» شما ${durationLabel(input.duration)} تمدید شد.`,
        eventKey: `subscription_extended:${current.publicId}:${endsAt.getTime()}`,
        title: "اشتراک شما تمدید شد",
        type: "granted",
        userId: current.providerProfile.userId,
      });
      return { endsAt: endsAt.toISOString() };
    }, LOCKED);
  } catch (error) {
    rethrow(error);
  }
}

export async function cancelAdminSubscription(actor: Actor, publicId: string, reason: string) {
  const now = systemClock.now();
  try {
    await runInTransaction(async (transaction) => {
      const found = await requireSubscription(transaction, publicId);
      await lockProviderProfileForActivation(transaction, found.providerProfileId);
      const current = await requireSubscription(transaction, publicId);
      if (current.status !== "active" && current.status !== "pending") {
        throw new ApiError(409, API_ERROR_CODES.conflict, "فقط اشتراک فعال یا در انتظار پرداخت قابل لغو است.");
      }
      await cancelSubscriptionRow(transaction, current.id, { now, reason });
      const cancelledPayments = await cancelOpenPaymentsOfSubscription(transaction, current.id, now);

      await recordAdminAudit(
        {
          action: "billing.subscriptions.cancel",
          adminId: actor.adminId,
          metadata: { cancelledOpenPayments: cancelledPayments, reason },
          module: "billing",
          newValues: { status: "cancelled" },
          oldValues: { endsAt: current.endsAt, status: current.status },
          request: actor.request,
          subject: { id: current.id, type: "provider_subscription" },
        },
        transaction,
      );
      if (current.status === "active") {
        await notifyProvider(transaction, {
          body: `اشتراک «${current.planNameSnapshot}» شما توسط پشتیبانی لغو شد. دلیل: ${reason}`,
          eventKey: `subscription_cancelled:${current.publicId}`,
          title: "اشتراک شما لغو شد",
          type: "ended",
          userId: current.providerProfile.userId,
        });
      }
    }, LOCKED);
  } catch (error) {
    rethrow(error);
  }
}

// ============================================================================ plans

export interface AdminPlanItem {
  activeCount: number;
  code: string;
  description: string | null;
  durationMonths: number;
  features: string[];
  id: string;
  isActive: boolean;
  isRecommended: boolean;
  name: string;
  netRevenueToman: number;
  priceToman: number;
  sortOrder: number;
  totalCount: number;
}

function featureList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export async function listAdminPlans(): Promise<AdminPlanItem[]> {
  const rows = await listPlanRows();
  const ids = rows.map((row) => row.id);
  const [counts, revenue] = await Promise.all([countSubscriptionsPerPlan(ids), sumRevenuePerPlan(ids)]);
  return rows.map((row) => {
    const own = counts.filter((entry) => entry.subscriptionPlanId === row.id);
    return {
      activeCount: own.find((entry) => entry.status === "active")?._count._all ?? 0,
      code: row.code,
      description: row.description,
      durationMonths: row.durationMonths,
      features: featureList(row.features),
      id: row.id.toString(),
      isActive: row.isActive === 1,
      isRecommended: row.isRecommended === 1,
      name: row.name,
      netRevenueToman: Number(revenue.get(row.id.toString()) ?? BigInt(0)),
      priceToman: Number(row.priceToman),
      sortOrder: row.sortOrder,
      totalCount: own.reduce((sum, entry) => sum + entry._count._all, 0),
    };
  });
}

async function requirePlan(transaction: TransactionClient, id: string) {
  const plan = await findPlanById(transaction, BigInt(id));
  if (!plan) throw new ApiError(404, API_ERROR_CODES.notFound, "پلن پیدا نشد.");
  return plan;
}

export async function createAdminPlan(actor: Actor, input: PlanCreateInput) {
  try {
    return await runInTransaction(async (transaction) => {
      const owner = await findPlanIdByCode(transaction, input.code);
      if (owner) {
        const message = owner.deletedAt ? "این کد متعلق به پلنی حذف‌شده است؛ کد دیگری انتخاب کنید." : "پلنی با این کد وجود دارد.";
        throw new ApiError(409, API_ERROR_CODES.conflict, message, { fields: { code: [message] } });
      }
      const sortOrder = input.sortOrder ?? (await nextPlanSortOrder(transaction));
      const plan = await insertPlan(transaction, {
        code: input.code,
        createdByAdminId: actor.adminId,
        description: input.description,
        durationMonths: input.durationMonths,
        features: input.features,
        isActive: input.isActive ? 1 : 0,
        isRecommended: input.isRecommended ? 1 : 0,
        name: input.name,
        priceToman: BigInt(input.priceToman),
        sortOrder,
        updatedByAdminId: actor.adminId,
      });
      await recordAdminAudit(
        {
          action: "billing.plans.create",
          adminId: actor.adminId,
          module: "billing",
          newValues: { ...input, sortOrder },
          request: actor.request,
          subject: { id: plan.id, type: "subscription_plan" },
        },
        transaction,
      );
      return { id: plan.id.toString() };
    });
  } catch (error) {
    rethrow(error);
  }
}

/** Price and duration changes apply to future purchases; existing subscriptions keep their snapshot. */
export async function updateAdminPlan(actor: Actor, id: string, input: PlanUpdateInput) {
  try {
    await runInTransaction(async (transaction) => {
      const current = await requirePlan(transaction, id);
      const data = {
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.durationMonths !== undefined ? { durationMonths: input.durationMonths } : {}),
        ...(input.features !== undefined ? { features: input.features } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive ? 1 : 0 } : {}),
        ...(input.isRecommended !== undefined ? { isRecommended: input.isRecommended ? 1 : 0 } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.priceToman !== undefined ? { priceToman: BigInt(input.priceToman) } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      };
      const updated = await updatePlanRow(transaction, current.id, { ...data, updatedByAdminId: actor.adminId });
      const keys = Object.keys(data);
      const onlyStatus = keys.length === 1 && input.isActive !== undefined;
      await recordAdminAudit(
        {
          action: onlyStatus ? (input.isActive ? "billing.plans.activate" : "billing.plans.deactivate") : "billing.plans.update",
          adminId: actor.adminId,
          module: "billing",
          newValues: Object.fromEntries(keys.map((key) => [key, (updated as Record<string, unknown>)[key]])),
          oldValues: Object.fromEntries(keys.map((key) => [key, (current as Record<string, unknown>)[key]])),
          request: actor.request,
          subject: { id: current.id, type: "subscription_plan" },
        },
        transaction,
      );
    });
  } catch (error) {
    rethrow(error);
  }
}

/**
 * Plans are soft-deleted (history keeps pointing at them) and their code is
 * released for reuse. A plan with a running or awaiting-payment subscription
 * can only be deactivated.
 */
export async function deleteAdminPlan(actor: Actor, id: string) {
  const now = systemClock.now();
  try {
    await runInTransaction(async (transaction) => {
      const current = await requirePlan(transaction, id);
      const open = await countOpenSubscriptionsForPlan(transaction, current.id);
      if (open > 0) {
        throw new ApiError(
          409,
          API_ERROR_CODES.conflict,
          "این پلن اشتراک فعال یا در انتظار پرداخت دارد و قابل حذف نیست؛ به جای حذف، آن را غیرفعال کنید.",
        );
      }
      await updatePlanRow(transaction, current.id, {
        code: `${current.code.slice(0, 70)}-deleted-${current.id.toString()}`.slice(0, 100),
        deletedAt: now,
        isActive: 0,
        isRecommended: 0,
        updatedByAdminId: actor.adminId,
      });
      await recordAdminAudit(
        {
          action: "billing.plans.delete",
          adminId: actor.adminId,
          module: "billing",
          oldValues: { code: current.code, name: current.name, priceToman: current.priceToman },
          request: actor.request,
          subject: { id: current.id, type: "subscription_plan" },
        },
        transaction,
      );
    });
  } catch (error) {
    rethrow(error);
  }
}

export async function reorderAdminPlans(actor: Actor, ids: string[]) {
  await runInTransaction(async (transaction) => {
    const live = new Set((await listLivePlanIds(transaction)).map(String));
    if (ids.length !== live.size || ids.some((id) => !live.has(id))) {
      throw new ApiError(409, API_ERROR_CODES.conflict, "فهرست پلن‌ها تغییر کرده است؛ صفحه را تازه کنید.");
    }
    for (const [index, id] of ids.entries()) await setPlanSortOrder(transaction, BigInt(id), index + 1);
    await recordAdminAudit(
      { action: "billing.plans.reorder", adminId: actor.adminId, metadata: { order: ids }, module: "billing", request: actor.request },
      transaction,
    );
  });
}

// ========================================================================= payments

export interface AdminPaymentItem {
  amountToman: number;
  failureMessage: string | null;
  gateway: string;
  id: string;
  initiatedAt: string;
  paidAt: string | null;
  planName: string | null;
  refundedToman: number;
  status: string;
  subscriptionId: string | null;
  user: { id: string; image: string | null; name: string; phone: string };
}

export interface AdminPaymentList {
  collectedToman: number;
  counts: Record<"all" | "paid" | "open" | "failed" | "refunds", number>;
  items: AdminPaymentItem[];
  page: number;
  pageCount: number;
  perPage: number;
  refundedToman: number;
  total: number;
}

export async function listAdminPayments(query: PaymentsListQuery): Promise<AdminPaymentList> {
  const now = systemClock.now();
  const [{ collected, rows, total }, perStatus, refunded] = await Promise.all([
    listPaymentRows(query, now),
    countPaymentsPerStatus(query, now),
    sumRefundsInPeriod(query, now),
  ]);
  const get = (key: string) => perStatus[key] ?? 0;
  return {
    collectedToman: Number(collected),
    counts: {
      all: Object.values(perStatus).reduce((sum, value) => sum + value, 0),
      failed: get("failed") + get("cancelled"),
      open: get("initiated") + get("pending"),
      paid: get("paid"),
      refunds: get("partially_refunded") + get("refunded"),
    },
    items: rows.map((row) => ({
      amountToman: Number(row.amountToman),
      failureMessage: row.failureMessage,
      gateway: row.gateway,
      id: row.publicId,
      initiatedAt: row.initiatedAt.toISOString(),
      paidAt: iso(row.paidAt),
      planName: row.subscription?.planNameSnapshot ?? null,
      refundedToman: Number(row.paymentRefunds.reduce((sum, refund) => sum + refund.amountToman, BigInt(0))),
      status: row.status,
      subscriptionId: row.subscription?.publicId ?? null,
      user: { id: row.user.publicId, image: row.user.image, name: row.user.name, phone: row.user.phone },
    })),
    page: query.page,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    perPage: query.perPage,
    refundedToman: Number(refunded),
    total,
  };
}

export async function getAdminPayment(publicId: string) {
  const row = await findPaymentDetail(publicId);
  if (!row) return null;
  const refundedToman = row.paymentRefunds
    .filter((refund) => refund.status === "succeeded")
    .reduce((sum, refund) => sum + refund.amountToman, BigInt(0));
  const refundable = row.status === "paid" || row.status === "partially_refunded";
  return {
    amountToman: Number(row.amountToman),
    authority: row.authority,
    cancelledAt: iso(row.cancelledAt),
    currency: row.currency,
    failedAt: iso(row.failedAt),
    failureCode: row.failureCode,
    failureMessage: row.failureMessage,
    gateway: row.gateway,
    gatewayPayload: row.gatewayPayload ?? null,
    id: row.publicId,
    initiatedAt: row.initiatedAt.toISOString(),
    paidAt: iso(row.paidAt),
    refundableToman: refundable ? Number(row.amountToman - refundedToman) : 0,
    refundedToman: Number(refundedToman),
    refunds: row.paymentRefunds.map((refund) => ({
      amountToman: Number(refund.amountToman),
      by: refund.requestedByAdmin?.name ?? null,
      createdAt: refund.createdAt.toISOString(),
      gatewayReference: refund.gatewayReference,
      id: refund.id.toString(),
      processedAt: iso(refund.processedAt),
      reason: refund.reason,
      status: refund.status,
    })),
    status: row.status,
    subscription: row.subscription
      ? {
          endsAt: iso(row.subscription.endsAt),
          id: row.subscription.publicId,
          planName: row.subscription.planNameSnapshot,
          source: row.subscription.source,
          startsAt: iso(row.subscription.startsAt),
          status: row.subscription.status,
        }
      : null,
    transactionReference: row.transactionReference,
    updatedAt: row.updatedAt.toISOString(),
    user: { id: row.user.publicId, image: row.user.image, name: row.user.name, phone: row.user.phone },
  };
}
export type AdminPaymentDetail = NonNullable<Awaited<ReturnType<typeof getAdminPayment>>>;

/**
 * The payment gateway has no refund API, so a refund here is a manual one:
 * the money goes back outside the system and this records it (status
 * `succeeded`, `gateway_payload.method = "manual"`). The payment row is locked
 * so concurrent refunds can never exceed what was paid.
 */
export async function refundAdminPayment(actor: Actor, publicId: string, input: PaymentRefundInput) {
  const now = systemClock.now();
  try {
    return await runInTransaction(async (transaction) => {
      const payment = await findPaymentForRefund(transaction, publicId);
      if (!payment) throw new ApiError(404, API_ERROR_CODES.notFound, "پرداخت پیدا نشد.");
      const locked = await lockPaymentForActivation(transaction, payment.id);
      if (!locked || (locked.status !== "paid" && locked.status !== "partially_refunded")) {
        throw new ApiError(409, API_ERROR_CODES.conflict, "فقط پرداخت موفق قابل بازپرداخت است.");
      }

      const remaining = locked.amountToman - (await sumSucceededRefunds(transaction, payment.id));
      const amount = BigInt(input.amountToman);
      if (amount > remaining) {
        const message = `مبلغ بازپرداخت از مانده قابل استرداد (${new Intl.NumberFormat("fa-IR").format(remaining)} تومان) بیشتر است.`;
        throw new ApiError(400, API_ERROR_CODES.validationFailed, message, { fields: { amountToman: [message] } });
      }
      const full = amount === remaining;
      if (input.cancelSubscription && !full) {
        throw new ApiError(400, API_ERROR_CODES.validationFailed, "لغو اشتراک فقط همراه بازپرداخت کامل ممکن است.", {
          fields: { cancelSubscription: ["لغو اشتراک فقط همراه بازپرداخت کامل ممکن است."] },
        });
      }

      const refund = await insertManualRefund(transaction, {
        adminId: actor.adminId,
        amountToman: amount,
        now,
        paymentId: payment.id,
        reason: input.reason,
      });
      const status = full ? "refunded" : "partially_refunded";
      await setPaymentStatus(transaction, payment.id, status, now);

      let subscriptionCancelled = false;
      const subscription = payment.subscription;
      if (input.cancelSubscription && subscription && (subscription.status === "active" || subscription.status === "pending")) {
        await cancelSubscriptionRow(transaction, subscription.id, { now, reason: `بازپرداخت: ${input.reason}`.slice(0, 500) });
        subscriptionCancelled = true;
        if (subscription.status === "active") {
          await notifyProvider(transaction, {
            body: `مبلغ اشتراک شما بازگردانده شد و اشتراک لغو شد. دلیل: ${input.reason}`,
            eventKey: `subscription_cancelled:refund:${refund.id.toString()}`,
            title: "اشتراک شما لغو شد",
            type: "ended",
            userId: subscription.providerProfile.userId,
          });
        }
      }

      await recordAdminAudit(
        {
          action: "billing.payments.refund",
          adminId: actor.adminId,
          metadata: { amountToman: amount, method: "manual", reason: input.reason, subscriptionCancelled },
          module: "billing",
          newValues: { status },
          oldValues: { status: locked.status },
          request: actor.request,
          subject: { id: payment.id, type: "subscription_payment" },
        },
        transaction,
      );
      return { paymentStatus: status, refundId: refund.id.toString(), subscriptionCancelled };
    }, LOCKED);
  } catch (error) {
    rethrow(error);
  }
}
