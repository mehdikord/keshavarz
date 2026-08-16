import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { createPublicId } from "@/server/identifiers/ulid";
import { toCsv } from "@/server/modules/exports/exports.csv";
import {
  cleanupExpiredExports,
  createAdminExport,
  getAdminExport,
  processExportJob,
} from "@/server/modules/exports/exports.service";
import {
  clearExportStoreForTests,
  getExportJob,
  updateExportJob,
} from "@/server/modules/exports/exports.store";
import {
  getAdminFinancialReport,
  getAdminReportsOverview,
  getConsumerFinancialSummary,
  getConsumerMonthlyCosts,
  getProviderFinancialSummary,
  getProviderMonthlyRevenue,
} from "@/server/modules/reports/reports.service";

const phones = ["09999000001", "09999000002"];
const landLat = 35.7;
const landLng = 51.4;

async function cleanup() {
  clearExportStoreForTests();
  await prisma.serviceRequestProviderHistory.deleteMany({
    where: {
      requestProvider: {
        request: { consumer: { phone: { in: phones } } },
      },
    },
  });
  await prisma.serviceRequestProvider.deleteMany({
    where: { request: { consumer: { phone: { in: phones } } } },
  });
  await prisma.serviceRequestDate.deleteMany({
    where: { request: { consumer: { phone: { in: phones } } } },
  });
  await prisma.serviceRequestStatusHistory.deleteMany({
    where: { request: { consumer: { phone: { in: phones } } } },
  });
  await prisma.serviceRequest.deleteMany({
    where: { consumer: { phone: { in: phones } } },
  });
  await prisma.providerService.deleteMany({
    where: { providerProfile: { user: { phone: { in: phones } } } },
  });
  await prisma.providerSubscription.deleteMany({
    where: { providerProfile: { user: { phone: { in: phones } } } },
  });
  await prisma.providerProfile.deleteMany({
    where: { user: { phone: { in: phones } } },
  });
  await prisma.land.deleteMany({
    where: { user: { phone: { in: phones } } },
  });
  await prisma.user.deleteMany({ where: { phone: { in: phones } } });
}

describe.sequential("phase 11 reports and exports", () => {
  let consumerId: bigint;
  let providerUserId: bigint;
  let landPublicId: string;
  let serviceSlug: string;

  beforeAll(async () => {
    await cleanup();

    const consumer = await prisma.user.create({
      data: {
        name: "phase11 consumer",
        phone: phones[0]!,
        publicId: createPublicId(),
      },
    });
    consumerId = consumer.id;

    const providerUser = await prisma.user.create({
      data: {
        name: "phase11 provider",
        phone: phones[1]!,
        publicId: createPublicId(),
      },
    });
    providerUserId = providerUser.id;

    const land = await prisma.land.create({
      data: {
        areaSquareMeters: "1000",
        latitude: String(landLat),
        longitude: String(landLng),
        publicId: createPublicId(),
        title: "زمین گزارش",
        userId: consumer.id,
      },
    });
    landPublicId = land.publicId;

    const service = await prisma.service.findFirstOrThrow({
      where: { deletedAt: null },
      orderBy: { id: "asc" },
    });
    serviceSlug = service.slug;

    const profile = await prisma.providerProfile.create({
      data: {
        approvedAt: new Date(),
        isActive: 1,
        isAvailable: 1,
        userId: providerUser.id,
        workLatitude: String(landLat),
        workLongitude: String(landLng),
        workRadiusKm: 50,
      },
    });

    await prisma.providerService.create({
      data: {
        priceToman: BigInt(200_000),
        pricingUnit: "per_hectare",
        providerProfileId: profile.id,
        serviceId: service.id,
      },
    });

    const now = new Date();
    const completed = await prisma.serviceRequest.create({
      data: {
        agreedPriceToman: BigInt(350_000),
        assignedProviderNameSnapshot: providerUser.name,
        assignedProviderProfileId: profile.id,
        completedAt: now,
        consumerNameSnapshot: consumer.name,
        consumerUserId: consumer.id,
        landAreaSquareMetersSnapshot: "1000",
        landId: land.id,
        landLatitudeSnapshot: String(landLat),
        landLongitudeSnapshot: String(landLng),
        landTitleSnapshot: land.title,
        publicId: createPublicId(),
        serviceCategoryNameSnapshot: "cat",
        serviceId: service.id,
        serviceNameSnapshot: service.name,
        status: "completed",
      },
    });

    await prisma.serviceRequestStatusHistory.create({
      data: {
        actorType: "system",
        fromStatus: null,
        serviceRequestId: completed.id,
        toStatus: "completed",
      },
    });

    // pending should not affect revenue/cost
    await prisma.serviceRequest.create({
      data: {
        consumerNameSnapshot: consumer.name,
        consumerUserId: consumer.id,
        landAreaSquareMetersSnapshot: "1000",
        landId: land.id,
        landLatitudeSnapshot: String(landLat),
        landLongitudeSnapshot: String(landLng),
        landTitleSnapshot: land.title,
        publicId: createPublicId(),
        serviceCategoryNameSnapshot: "cat",
        serviceId: service.id,
        serviceNameSnapshot: service.name,
        status: "pending_provider",
      },
    });
  }, 60_000);

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  }, 60_000);

  it("protects CSV cells from formula injection", () => {
    const csv = toCsv([{ note: "=1+1", title: "ok" }]);
    expect(csv).toContain("'=1+1");
    expect(csv).toContain("ok");
  });

  it("reports consumer costs only from completed requests", async () => {
    const summary = await getConsumerFinancialSummary(consumerId, {});
    expect(summary.timezone).toBe("Asia/Tehran");
    expect(summary.totalCostToman).toBe(350_000);
    expect(summary.completedCount).toBe(1);
    expect(summary.topLand?.landId).toBe(landPublicId);
    expect(summary.topService?.serviceId).toBe(serviceSlug);

    const monthly = await getConsumerMonthlyCosts(consumerId, {});
    expect(monthly.months).toHaveLength(12);
    expect(monthly.months.reduce((sum, row) => sum + row.totalToman, 0)).toBe(
      350_000,
    );
  });

  it("reports provider revenue only from completed requests", async () => {
    const summary = await getProviderFinancialSummary(providerUserId, {});
    expect(summary.totalRevenueToman).toBe(350_000);
    expect(summary.completedCount).toBe(1);
    expect(summary.topService?.serviceId).toBe(serviceSlug);

    const monthly = await getProviderMonthlyRevenue(providerUserId, {});
    expect(monthly.months.length).toBeGreaterThan(0);
    expect(
      monthly.months.reduce((sum, row) => sum + row.totalToman, 0),
    ).toBe(350_000);
  });

  it("returns admin overview and financial reports", async () => {
    const overview = await getAdminReportsOverview({});
    expect(overview.timezone).toBe("Asia/Tehran");
    expect(overview.gmvToman).toBeGreaterThanOrEqual(350_000);
    expect(overview.funnel).toBeTruthy();

    const financial = await getAdminFinancialReport({});
    expect(financial.completedCount).toBeGreaterThanOrEqual(1);
    expect(financial.gmvToman).toBeGreaterThanOrEqual(350_000);
    expect(Array.isArray(financial.topServices)).toBe(true);
  });

  it("creates async export and becomes ready without blocking create", async () => {
    const created = await createAdminExport({
      adminId: BigInt(1),
      adminPublicId: createPublicId(),
      domain: "reports",
      filters: {},
    });
    expect(created.status).toBe("queued");
    expect(created.exportId).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);

    await processExportJob(created.exportId);

    const status = await getAdminExport({
      adminPublicId: createPublicId(),
      exportId: created.exportId,
    });
    expect(status.status).toBe("ready");
    expect(status.rowCount).toBeGreaterThanOrEqual(1);
    if (status.status === "ready") {
      expect("downloadUrl" in status && status.downloadUrl).toContain(
        "downloadToken=",
      );
    }

    const job = getExportJob(created.exportId);
    expect(job?.filePath).toBeTruthy();

    updateExportJob(created.exportId, { status: "expired" });
    const cleanup = await cleanupExpiredExports();
    expect(cleanup.expiredJobs).toBeGreaterThanOrEqual(1);
  });
});
