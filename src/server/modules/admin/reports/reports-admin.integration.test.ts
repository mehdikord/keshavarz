import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { createPublicId } from "@/server/identifiers/ulid";
import { buildReportCsv } from "@/server/modules/admin/reports/reports-admin.export";
import {
  bucketSlots,
  formatJalaliInput,
  resolvePeriod,
  type ReportPeriod,
} from "@/server/modules/admin/reports/report-period";
import {
  getGrowthReport,
  getMarketplaceReport,
  getProvidersReport,
  getRevenueReport,
} from "@/server/modules/admin/reports/reports-admin.service";

/*
 * Everything is seeded in June 2020 (Tehran time), a window no other data
 * uses, so the aggregates can be asserted exactly.
 */
const PHONES = ["09996700001", "09996700002", "09996700003"];
const CATEGORY_SLUG = "forke-reports-category";
const SERVICE_SLUG = "forke-reports-service";
const PLAN_CODE = "forke-reports-plan";

const at = (iso: string) => new Date(`${iso}+03:30`);

let period: ReportPeriod;

async function cleanup() {
  const users = await prisma.user.findMany({ select: { id: true }, where: { phone: { in: PHONES } } });
  const userIds = users.map((row) => row.id);
  const payments = await prisma.subscriptionPayment.findMany({ select: { id: true }, where: { userId: { in: userIds } } });
  await prisma.paymentRefund.deleteMany({ where: { subscriptionPaymentId: { in: payments.map((row) => row.id) } } });
  await prisma.subscriptionPayment.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.providerSubscription.deleteMany({ where: { providerProfile: { userId: { in: userIds } } } });
  await prisma.subscriptionPlan.deleteMany({ where: { code: PLAN_CODE } });
  const requests = await prisma.serviceRequest.findMany({ select: { id: true }, where: { consumerUserId: { in: userIds } } });
  const requestIds = requests.map((row) => row.id);
  await prisma.serviceRequestProvider.deleteMany({ where: { serviceRequestId: { in: requestIds } } });
  await prisma.serviceRequestStatusHistory.deleteMany({ where: { serviceRequestId: { in: requestIds } } });
  await prisma.serviceRequest.deleteMany({ where: { id: { in: requestIds } } });
  await prisma.land.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.providerService.deleteMany({ where: { providerProfile: { userId: { in: userIds } } } });
  await prisma.providerProfile.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.service.deleteMany({ where: { slug: SERVICE_SLUG } });
  await prisma.serviceCategory.deleteMany({ where: { slug: CATEGORY_SLUG } });
}

describe.sequential("admin reports aggregates", () => {
  beforeAll(async () => {
    await cleanup();

    const category = await prisma.serviceCategory.create({ data: { name: "دسته گزارش آزمون", slug: CATEGORY_SLUG } });
    const service = await prisma.service.create({
      data: { name: "خدمت گزارش آزمون", serviceCategoryId: category.id, slug: SERVICE_SLUG },
    });

    // Previous period: one signup. Current period: one consumer, one provider.
    await prisma.user.create({
      data: { createdAt: at("2020-05-10T09:00:00"), name: "کاربر قبلی", phone: PHONES[2]!, publicId: createPublicId() },
    });
    const consumer = await prisma.user.create({
      data: {
        createdAt: at("2020-06-05T09:00:00"),
        lastLoginAt: at("2020-06-07T09:00:00"),
        name: "خدمات‌گیرنده گزارش",
        phone: PHONES[0]!,
        publicId: createPublicId(),
      },
    });
    const providerUser = await prisma.user.create({
      data: { createdAt: at("2020-06-03T09:00:00"), name: "خدمات‌دهنده گزارش", phone: PHONES[1]!, publicId: createPublicId() },
    });
    const profile = await prisma.providerProfile.create({
      data: { createdAt: at("2020-06-03T09:05:00"), userId: providerUser.id },
    });
    const offer = await prisma.providerService.create({
      data: { priceToman: BigInt(1_000_000), providerProfileId: profile.id, serviceId: service.id },
    });
    const land = await prisma.land.create({
      data: {
        areaSquareMeters: "10000",
        latitude: "35.7",
        longitude: "51.4",
        publicId: createPublicId(),
        title: "زمین گزارش",
        userId: consumer.id,
      },
    });

    const base = {
      consumerNameSnapshot: consumer.name,
      consumerUserId: consumer.id,
      landAreaSquareMetersSnapshot: land.areaSquareMeters,
      landId: land.id,
      landLatitudeSnapshot: land.latitude,
      landLongitudeSnapshot: land.longitude,
      landTitleSnapshot: land.title,
      serviceCategoryNameSnapshot: category.name,
      serviceId: service.id,
      serviceNameSnapshot: service.name,
    };
    const completed = await prisma.serviceRequest.create({
      data: {
        ...base,
        acceptedAt: at("2020-06-10T10:10:00"),
        agreedPriceToman: BigInt(1_000_000),
        assignedProviderNameSnapshot: providerUser.name,
        assignedProviderProfileId: profile.id,
        completedAt: at("2020-06-11T15:00:00"),
        createdAt: at("2020-06-10T10:00:00"),
        publicId: createPublicId(),
        status: "completed",
      },
    });
    const cancelled = await prisma.serviceRequest.create({
      data: {
        ...base,
        cancelReason: "منصرف شدم",
        cancelledAt: at("2020-06-12T12:00:00"),
        cancelledBy: "consumer",
        cancelledByUserId: consumer.id,
        createdAt: at("2020-06-12T10:00:00"),
        publicId: createPublicId(),
        status: "cancelled",
      },
    });
    // Nobody found and never sent: unmatched demand.
    await prisma.serviceRequest.create({
      data: { ...base, createdAt: at("2020-06-15T10:00:00"), publicId: createPublicId(), status: "pending_provider" },
    });

    const link = {
      distanceKm: "5.00",
      providerNameSnapshot: providerUser.name,
      providerProfileId: profile.id,
      providerServiceId: offer.id,
      servicePriceSnapshotToman: BigInt(1_000_000),
    };
    await prisma.serviceRequestProvider.create({
      data: {
        ...link,
        respondedAt: at("2020-06-10T10:05:00"),
        sentAt: at("2020-06-10T10:00:00"),
        serviceRequestId: completed.id,
        status: "accepted",
      },
    });
    await prisma.serviceRequestProvider.create({
      data: {
        ...link,
        rejectionReason: "سرم شلوغ است",
        respondedAt: at("2020-06-12T10:01:00"),
        sentAt: at("2020-06-12T10:00:00"),
        serviceRequestId: cancelled.id,
        status: "rejected",
      },
    });

    const plan = await prisma.subscriptionPlan.create({
      data: { code: PLAN_CODE, durationMonths: 1, name: "پلن گزارش", priceToman: BigInt(500_000) },
    });
    const subscription = await prisma.providerSubscription.create({
      data: {
        activatedAt: at("2020-06-02T09:00:00"),
        amountToman: BigInt(500_000),
        endsAt: at("2020-07-02T09:00:00"),
        planNameSnapshot: plan.name,
        providerProfileId: profile.id,
        publicId: createPublicId(),
        startsAt: at("2020-06-02T09:00:00"),
        status: "expired",
        subscriptionPlanId: plan.id,
      },
    });
    await prisma.subscriptionPayment.create({
      data: {
        amountToman: BigInt(500_000),
        paidAt: at("2020-06-02T09:00:00"),
        providerSubscriptionId: subscription.id,
        publicId: createPublicId(),
        status: "paid",
        userId: providerUser.id,
      },
    });
    const renewal = await prisma.subscriptionPayment.create({
      data: {
        amountToman: BigInt(300_000),
        paidAt: at("2020-06-20T09:00:00"),
        providerSubscriptionId: subscription.id,
        publicId: createPublicId(),
        status: "partially_refunded",
        userId: providerUser.id,
      },
    });
    await prisma.paymentRefund.create({
      data: {
        amountToman: BigInt(100_000),
        processedAt: at("2020-06-21T09:00:00"),
        reason: "آزمون",
        status: "succeeded",
        subscriptionPaymentId: renewal.id,
      },
    });

    period = resolvePeriod(
      { from: formatJalaliInput("2020-06-01"), period: "custom", to: formatJalaliInput("2020-06-30") },
      new Date(),
    );
  }, 60_000);

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  }, 60_000);

  it("resolves the custom Jalali range and its previous period", () => {
    expect(period).toMatchObject({ bucket: "day", days: 30, from: "2020-06-01", to: "2020-06-30" });
    expect(period.previous).toEqual({ days: 30, from: "2020-05-02", to: "2020-05-31" });
    expect(bucketSlots(period)).toHaveLength(30);
  });

  it("counts growth in the range and against the previous one", async () => {
    const report = await getGrowthReport(period);
    expect(report.kpis.newUsers).toEqual({ current: 2, previous: 1 });
    expect(report.kpis.newProviders).toEqual({ current: 1, previous: 0 });
    expect(report.kpis.activeUsers.current).toBe(1);
    expect(report.kpis.totalUsers.current - report.kpis.totalUsers.previous!).toBe(2);
    const day = (key: string) => report.series.find((point) => point.key === key)?.values;
    expect(day("2020-06-03")).toMatchObject({ newProviders: 1, newUsers: 1 });
    expect(report.series.at(-1)!.values.totalUsers).toBe(report.kpis.totalUsers.current);
  });

  it("summarises marketplace outcomes, timing and supply", async () => {
    const report = await getMarketplaceReport(period);
    expect(report.kpis.created).toEqual({ current: 3, previous: 0 });
    expect(report.statuses).toMatchObject({ cancelled: 1, completed: 1, pending_provider: 1 });
    expect(report.cancelledBy).toEqual({ admin: 0, consumer: 1, provider: 0 });
    expect(report.kpis.completionRate.current).toBeCloseTo(33.33, 1);
    expect(report.kpis.gmv.current).toBe(1_000_000);
    expect(report.kpis.completed.current).toBe(1);
    expect(report.kpis.unmatched.current).toBe(1);
    expect(report.kpis.medianToAccept.current).toBe(600);
    const row = report.services.find((service) => service.name === "خدمت گزارش آزمون");
    expect(row).toMatchObject({ cancelled: 1, completed: 1, created: 3, gmv: 1_000_000, supply: 1, unmatched: 1 });
    expect(report.series.reduce((sum, point) => sum + (point.values.created ?? 0), 0)).toBe(3);
  });

  it("computes net revenue, renewals and running subscriptions", async () => {
    const report = await getRevenueReport(period, new Date());
    expect(report.kpis.gross.current).toBe(800_000);
    expect(report.kpis.refunds.current).toBe(100_000);
    expect(report.kpis.net.current).toBe(700_000);
    expect(report.split).toEqual({ first: { amount: 500_000, payments: 1 }, renewal: { amount: 300_000, payments: 1 } });
    expect(report.plans.find((plan) => plan.name === "پلن گزارش")).toMatchObject({ amount: 800_000, payments: 2 });
    expect(report.kpis.activeSubscriptions.current).toBe(1);
    expect(report.series.find((point) => point.key === "2020-06-01")?.values.activeSubscriptions).toBe(0);
  });

  it("ranks providers with acceptance and response time", async () => {
    const report = await getProvidersReport(period);
    expect(report.invitations).toMatchObject({ accepted: 1, rejected: 1, sent: 2 });
    expect(report.kpis.acceptanceRate.current).toBe(50);
    expect(report.kpis.medianResponse.current).toBe(180);
    expect(report.kpis.workingProviders.current).toBe(1);
    expect(report.leaderboard[0]).toMatchObject({ acceptanceRate: 50, gmv: 1_000_000, jobs: 1, name: "خدمات‌دهنده گزارش" });
  });

  it("exports CSV with a BOM and escaped Persian text", async () => {
    const { csv, filename, rows } = await buildReportCsv("marketplace-services", period, new Date());
    expect(csv.startsWith("﻿")).toBe(true);
    expect(filename).toBe(`keshavarz-marketplace-services-${formatJalaliInput("2020-06-01")}_${formatJalaliInput("2020-06-30")}.csv`);
    expect(rows).toBeGreaterThan(0);
    expect(csv).toContain("خدمت گزارش آزمون,دسته گزارش آزمون,3,1,1,1,1000000,1");
  });
});
