import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/errors";
import { createPublicId } from "@/server/identifiers/ulid";
import { clearServiceSearchStoreForTests } from "@/server/modules/search/search.context";
import { createServiceSearch } from "@/server/modules/search/search.service";
import {
  acceptProviderServiceRequest,
  cancelConsumerServiceRequest,
  completeConsumerServiceRequest,
  createServiceRequestFromSearch,
  getConsumerServiceRequest,
  getProviderServiceRequest,
  rejectProviderServiceRequest,
} from "@/server/modules/requests/request.service";

const phones = [
  "09996000001",
  "09996000002",
  "09996000003",
  "09996000004",
  "09996000005",
];
const categorySlug = "phase8-test-category";
const serviceSlug = "phase8-test-service";
const landLat = 35.7;
const landLng = 51.4;

function offsetLatitude(distanceKm: number): number {
  return landLat + (distanceKm / 6371) * (180 / Math.PI);
}

function futureDate(daysAhead: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

async function createUser(phone: string, name: string) {
  return prisma.user.create({
    data: { name, phone, publicId: createPublicId() },
  });
}

async function createLand(userId: bigint) {
  return prisma.land.create({
    data: {
      areaSquareMeters: "2500",
      latitude: String(landLat),
      longitude: String(landLng),
      publicId: createPublicId(),
      title: "زمین فاز۸",
      userId,
    },
  });
}

async function createProvider(input: {
  distanceKm: number;
  name: string;
  phone: string;
  priceToman: number;
}) {
  const user = await createUser(input.phone, input.name);
  const profile = await prisma.providerProfile.create({
    data: {
      userId: user.id,
      workLatitude: String(offsetLatitude(input.distanceKm)),
      workLongitude: String(landLng),
      workRadiusKm: 50,
    },
  });
  const service = await prisma.service.findFirstOrThrow({
    where: { slug: serviceSlug },
  });
  await prisma.providerService.create({
    data: {
      priceToman: BigInt(input.priceToman),
      pricingUnit: "per_hectare",
      providerProfileId: profile.id,
      serviceId: service.id,
    },
  });
  const plan = await prisma.subscriptionPlan.findFirstOrThrow({
    where: { code: "basic-monthly" },
  });
  const now = new Date();
  await prisma.providerSubscription.create({
    data: {
      activatedAt: now,
      amountToman: plan.priceToman,
      endsAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      planNameSnapshot: plan.name,
      providerProfileId: profile.id,
      publicId: createPublicId(),
      source: "admin_grant",
      startsAt: new Date(now.getTime() - 60_000),
      status: "active",
      subscriptionPlanId: plan.id,
    },
  });
  return { profile, user };
}

async function cleanupUsers() {
  clearServiceSearchStoreForTests();
  await prisma.notificationDelivery.deleteMany({
    where: { notification: { user: { phone: { in: phones } } } },
  });
  await prisma.notification.deleteMany({
    where: { user: { phone: { in: phones } } },
  });
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

async function cleanupAll() {
  await cleanupUsers();
  await prisma.service.deleteMany({ where: { slug: serviceSlug } });
  await prisma.serviceCategory.deleteMany({ where: { slug: categorySlug } });
}

describe.sequential("phase 08 request lifecycle", () => {
  beforeAll(async () => {
    await cleanupAll();
    const category = await prisma.serviceCategory.create({
      data: { name: "دسته فاز۸", slug: categorySlug, sortOrder: 1 },
    });
    await prisma.service.create({
      data: {
        name: "خدمت فاز۸",
        serviceCategoryId: category.id,
        slug: serviceSlug,
        sortOrder: 1,
      },
    });
  }, 60_000);

  beforeEach(async () => {
    await cleanupUsers();
  });

  afterAll(async () => {
    await cleanupAll();
    await prisma.$disconnect();
  }, 60_000);

  async function seedSearchRequest() {
    const consumer = await createUser(phones[0]!, "مصرف‌کننده");
    const land = await createLand(consumer.id);
    const p1 = await createProvider({
      distanceKm: 8,
      name: "Provider One",
      phone: phones[1]!,
      priceToman: 150_000,
    });
    const p2 = await createProvider({
      distanceKm: 12,
      name: "Provider Two",
      phone: phones[2]!,
      priceToman: 180_000,
    });

    const search = await createServiceSearch(
      consumer.id,
      {
        categoryId: categorySlug,
        dates: [futureDate(2)],
        landId: land.publicId,
        serviceId: serviceSlug,
      },
      `idem-search-${createPublicId()}`,
    );

    const created = await createServiceRequestFromSearch(
      consumer.id,
      {
        providerIds: [p1.user.publicId, p2.user.publicId],
        searchId: search.searchId,
      },
      `idem-request-${createPublicId()}`,
    );

    return { consumer, created, p1, p2 };
  }

  it("creates request with snapshots, dates, histories and hides phones while pending", async () => {
    const { consumer, created, p1 } = await seedSearchRequest();
    const detail = await getConsumerServiceRequest(
      consumer.id,
      created.requestId,
    );

    expect(detail.status).toBe("pending_provider");
    expect(detail.dates.length).toBe(1);
    expect(detail.providers).toHaveLength(2);
    expect(detail.providers.every((item) => item.phone === null)).toBe(true);

    const providerView = await getProviderServiceRequest(
      p1.user.id,
      created.requestId,
    );
    expect(providerView.consumer.phone).toBeNull();
    expect(providerView.linkStatus).toBe("sent");

    const notifications = await prisma.notification.count({
      where: {
        type: "request_new",
        relatedServiceRequestId: (
          await prisma.serviceRequest.findUniqueOrThrow({
            where: { publicId: created.requestId },
          })
        ).id,
      },
    });
    expect(notifications).toBe(2);
  });

  it("accepts by exactly one provider under concurrency and removes others", async () => {
    const { created, p1, p2 } = await seedSearchRequest();

    const results = await Promise.allSettled([
      acceptProviderServiceRequest(p1.user.id, created.requestId, {}),
      acceptProviderServiceRequest(p2.user.id, created.requestId, {}),
    ]);

    const fulfilled = results.filter((item) => item.status === "fulfilled");
    const rejected = results.filter((item) => item.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const request = await prisma.serviceRequest.findUniqueOrThrow({
      where: { publicId: created.requestId },
    });
    expect(request.status).toBe("in_progress");
    expect(request.assignedProviderProfileId).toBeTruthy();
    expect(request.agreedPriceToman).toBeTruthy();

    const links = await prisma.serviceRequestProvider.findMany({
      where: { serviceRequestId: request.id },
    });
    expect(links.filter((link) => link.status === "accepted")).toHaveLength(1);
    expect(links.filter((link) => link.status === "removed")).toHaveLength(1);
  });

  it("rejects without changing parent status and completes only by consumer", async () => {
    const { consumer, created, p1, p2 } = await seedSearchRequest();

    await rejectProviderServiceRequest(p1.user.id, created.requestId, {
      reason: "شلوغ هستم",
    });

    const afterReject = await prisma.serviceRequest.findUniqueOrThrow({
      where: { publicId: created.requestId },
    });
    expect(afterReject.status).toBe("pending_provider");

    await acceptProviderServiceRequest(p2.user.id, created.requestId, {});

    await expect(
      completeConsumerServiceRequest(p2.user.id, created.requestId, {}),
    ).rejects.toBeInstanceOf(ApiError);

    const completed = await completeConsumerServiceRequest(
      consumer.id,
      created.requestId,
      {},
    );
    expect(completed.status).toBe("completed");

    const detail = await getConsumerServiceRequest(
      consumer.id,
      created.requestId,
    );
    const accepted = detail.providers.find((item) => item.status === "accepted");
    expect(accepted?.phone).toBeTruthy();

    await expect(
      completeConsumerServiceRequest(consumer.id, created.requestId, {}),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("requires cancel reason in progress and supports version conflict", async () => {
    const { consumer, created, p1 } = await seedSearchRequest();
    await acceptProviderServiceRequest(p1.user.id, created.requestId, {});

    await expect(
      cancelConsumerServiceRequest(consumer.id, created.requestId, {}),
    ).rejects.toMatchObject({ status: 400 });

    await expect(
      cancelConsumerServiceRequest(consumer.id, created.requestId, {
        expectedVersion: 1,
        reason: "نسخه قدیمی",
      }),
    ).rejects.toMatchObject({ status: 409 });

    const cancelled = await cancelConsumerServiceRequest(
      consumer.id,
      created.requestId,
      { reason: "دیگر نیاز ندارم" },
    );
    expect(cancelled.status).toBe("cancelled");
  });
});
