import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { createPublicId } from "@/server/identifiers/ulid";
import {
  PlanCreateSchema,
  SubscriptionExtendSchema,
  SubscriptionGrantSchema,
} from "@/server/modules/admin/billing/billing.schemas";
import {
  addDuration,
  cancelAdminSubscription,
  createAdminPlan,
  deleteAdminPlan,
  extendAdminSubscription,
  getAdminPayment,
  grantAdminSubscription,
  listAdminPayments,
  listAdminPlans,
  listAdminSubscriptions,
  refundAdminPayment,
  updateAdminPlan,
} from "@/server/modules/admin/billing/billing.service";
import { listSubscriptionPlans } from "@/server/modules/subscriptions/subscriptions.service";

const ADMIN_PHONE = "09996400001";
const PROVIDER_PHONE = "09996400002";
const PLAN_CODE = "test-billing-plan";

const request = new NextRequest("http://localhost/api/admins/v1/billing/test", {
  headers: { "user-agent": "vitest", "x-forwarded-for": "10.0.0.4" },
  method: "POST",
});

let actor: { adminId: bigint; request: NextRequest };
let providerUserPublicId: string;
let providerUserId: bigint;
let profileId: bigint;
let planId: string;

async function cleanup() {
  const users = await prisma.user.findMany({ select: { id: true }, where: { phone: PROVIDER_PHONE } });
  const userIds = users.map((row) => row.id);
  const payments = await prisma.subscriptionPayment.findMany({ select: { id: true }, where: { userId: { in: userIds } } });
  await prisma.paymentRefund.deleteMany({ where: { subscriptionPaymentId: { in: payments.map((row) => row.id) } } });
  await prisma.subscriptionPayment.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.notificationDelivery.deleteMany({ where: { notification: { userId: { in: userIds } } } });
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.providerSubscription.deleteMany({ where: { providerProfile: { userId: { in: userIds } } } });
  await prisma.providerProfile.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.subscriptionPlan.deleteMany({ where: { code: { startsWith: PLAN_CODE } } });
  const admins = await prisma.admin.findMany({ select: { id: true }, where: { phone: ADMIN_PHONE } });
  await prisma.adminAuditLog.deleteMany({ where: { adminId: { in: admins.map((row) => row.id) } } });
  await prisma.admin.deleteMany({ where: { phone: ADMIN_PHONE } });
}

async function activeSubscription() {
  return prisma.providerSubscription.findMany({ where: { providerProfileId: profileId, status: "active" } });
}

describe.sequential("admin billing", () => {
  beforeAll(async () => {
    await cleanup();
    const admin = await prisma.admin.create({
      data: { name: "مدیر مالی آزمون", password: "unused-hash", phone: ADMIN_PHONE, publicId: createPublicId() },
    });
    actor = { adminId: admin.id, request };
    const user = await prisma.user.create({
      data: { name: "خدمات‌دهنده مالی", phone: PROVIDER_PHONE, publicId: createPublicId() },
    });
    providerUserId = user.id;
    providerUserPublicId = user.publicId;
    profileId = (await prisma.providerProfile.create({ data: { userId: user.id } })).id;
  }, 60_000);

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  }, 60_000);

  it("creates a plan that the provider app lists, and rejects a duplicate code", async () => {
    planId = (
      await createAdminPlan(
        actor,
        PlanCreateSchema.parse({ code: PLAN_CODE, durationMonths: 3, features: ["ویژگی یک"], name: "پلن آزمون مالی", priceToman: 300000 }),
      )
    ).id;
    const appPlans = await listSubscriptionPlans();
    expect(appPlans.find((plan) => plan.code === PLAN_CODE)).toMatchObject({ durationMonths: 3, priceToman: 300000 });

    await expect(
      createAdminPlan(actor, PlanCreateSchema.parse({ code: PLAN_CODE, durationMonths: 1, name: "تکراری", priceToman: 1000 })),
    ).rejects.toMatchObject({ code: "CONFLICT", fields: { code: expect.any(Array) } });

    await updateAdminPlan(actor, planId, { isActive: false });
    expect((await listSubscriptionPlans()).some((plan) => plan.code === PLAN_CODE)).toBe(false);
    await updateAdminPlan(actor, planId, { isActive: true, priceToman: 350000 });
  });

  it("grants a subscription, then carries remaining time into a second grant", async () => {
    const first = await grantAdminSubscription(
      actor,
      SubscriptionGrantSchema.parse({ planId, providerUserId: providerUserPublicId, reason: "هدیه آزمون اول" }),
    );
    const firstRow = await prisma.providerSubscription.findUniqueOrThrow({ where: { publicId: first.id } });
    expect(firstRow).toMatchObject({ amountToman: BigInt(0), source: "admin_grant", status: "active" });
    expect(firstRow.grantedByAdminId).toBe(actor.adminId);
    expect(firstRow.endsAt!.getTime()).toBe(addDuration(firstRow.startsAt!, { amount: 3, unit: "months" }).getTime());

    const second = await grantAdminSubscription(
      actor,
      SubscriptionGrantSchema.parse({
        duration: { amount: 10, unit: "days" },
        planId,
        providerUserId: providerUserPublicId,
        reason: "هدیه آزمون دوم",
      }),
    );
    const active = await activeSubscription();
    expect(active.map((row) => row.publicId)).toEqual([second.id]);
    expect(active[0]!.endsAt!.getTime()).toBe(firstRow.endsAt!.getTime() + 10 * 86_400_000);
    expect((await prisma.providerSubscription.findUniqueOrThrow({ where: { publicId: first.id } })).status).toBe("expired");

    const notifications = await prisma.notification.count({ where: { type: "subscription_granted", userId: providerUserId } });
    expect(notifications).toBe(2);
  });

  it("extends only active subscriptions and refuses to delete a plan in use", async () => {
    const [active] = await activeSubscription();
    const before = active!.endsAt!;
    await extendAdminSubscription(
      actor,
      active!.publicId,
      SubscriptionExtendSchema.parse({ duration: { amount: 1, unit: "months" }, reason: "جبران قطعی سرویس" }),
    );
    const after = (await prisma.providerSubscription.findUniqueOrThrow({ where: { id: active!.id } })).endsAt!;
    expect(after.getTime()).toBe(addDuration(before, { amount: 1, unit: "months" }).getTime());

    await expect(deleteAdminPlan(actor, planId)).rejects.toMatchObject({ code: "CONFLICT" });

    const expired = await prisma.providerSubscription.findFirstOrThrow({ where: { providerProfileId: profileId, status: "expired" } });
    await expect(
      extendAdminSubscription(actor, expired.publicId, SubscriptionExtendSchema.parse({ duration: { amount: 1, unit: "days" }, reason: "نباید شود" })),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const subscriptions = await listAdminSubscriptions({
      page: 1,
      perPage: 20,
      q: PROVIDER_PHONE,
      source: "all",
      status: "all",
    });
    expect(subscriptions.counts).toMatchObject({ active: 1, all: 2, expired: 1 });
    expect(subscriptions.items[0]!.daysLeft).toBeGreaterThan(100);
  });

  it("records manual refunds without exceeding the paid amount", async () => {
    const [active] = await activeSubscription();
    const payment = await prisma.subscriptionPayment.create({
      data: {
        amountToman: BigInt(350000),
        paidAt: new Date(),
        providerSubscriptionId: active!.id,
        publicId: createPublicId(),
        status: "paid",
        userId: providerUserId,
      },
    });

    await expect(
      refundAdminPayment(actor, payment.publicId, { amountToman: 400000, cancelSubscription: false, reason: "بیش از مبلغ" }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED", fields: { amountToman: expect.any(Array) } });

    await expect(
      refundAdminPayment(actor, payment.publicId, { amountToman: 100000, cancelSubscription: true, reason: "جزئی با لغو" }),
    ).rejects.toMatchObject({ fields: { cancelSubscription: expect.any(Array) } });

    const partial = await refundAdminPayment(actor, payment.publicId, { amountToman: 100000, cancelSubscription: false, reason: "بازپرداخت جزئی" });
    expect(partial.paymentStatus).toBe("partially_refunded");

    const detail = await getAdminPayment(payment.publicId);
    expect(detail).toMatchObject({ refundableToman: 250000, refundedToman: 100000, status: "partially_refunded" });

    const [one, two] = await Promise.allSettled([
      refundAdminPayment(actor, payment.publicId, { amountToman: 200000, cancelSubscription: false, reason: "هم‌زمان یک" }),
      refundAdminPayment(actor, payment.publicId, { amountToman: 200000, cancelSubscription: false, reason: "هم‌زمان دو" }),
    ]);
    expect([one, two].filter((result) => result.status === "fulfilled")).toHaveLength(1);

    const rest = await refundAdminPayment(actor, payment.publicId, { amountToman: 50000, cancelSubscription: true, reason: "تسویه کامل" });
    expect(rest).toMatchObject({ paymentStatus: "refunded", subscriptionCancelled: true });
    expect(await activeSubscription()).toHaveLength(0);

    await expect(
      refundAdminPayment(actor, payment.publicId, { amountToman: 1, cancelSubscription: false, reason: "دیگر ممکن نیست" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const list = await listAdminPayments({ page: 1, perPage: 20, period: "all", q: PROVIDER_PHONE, status: "refunds" });
    expect(list.items.map((item) => item.id)).toEqual([payment.publicId]);
    expect(list.items[0]!.refundedToman).toBe(350000);
  });

  it("cancels a pending purchase together with its open payment, then deletes the unused plan", async () => {
    const pending = await prisma.providerSubscription.create({
      data: {
        amountToman: BigInt(350000),
        planNameSnapshot: "پلن آزمون مالی",
        providerProfileId: profileId,
        publicId: createPublicId(),
        subscriptionPlanId: BigInt(planId),
      },
    });
    const openPayment = await prisma.subscriptionPayment.create({
      data: { amountToman: BigInt(350000), providerSubscriptionId: pending.id, publicId: createPublicId(), status: "pending", userId: providerUserId },
    });
    await cancelAdminSubscription(actor, pending.publicId, "خرید ناتمام آزمون");
    expect((await prisma.providerSubscription.findUniqueOrThrow({ where: { id: pending.id } })).status).toBe("cancelled");
    expect((await prisma.subscriptionPayment.findUniqueOrThrow({ where: { id: openPayment.id } })).status).toBe("cancelled");

    await deleteAdminPlan(actor, planId);
    const row = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { id: BigInt(planId) } });
    expect(row.deletedAt).not.toBeNull();
    expect(row.code).toMatch(/^test-billing-plan-deleted-\d+$/);
    expect((await listAdminPlans()).some((plan) => plan.id === planId)).toBe(false);
  });
});
