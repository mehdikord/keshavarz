import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { createPublicId } from "@/server/identifiers/ulid";
import {
  createServiceSearch,
  listRequestCandidates,
  type ServiceSearchResult,
} from "@/server/modules/search/search.service";

function requestIdOf(result: ServiceSearchResult): string {
  if (result.outcome !== "created") {
    throw new Error(`expected a created request, got ${result.outcome}`);
  }
  return result.requestId;
}

const phones = [
  "09995000001",
  "09995000002",
  "09995000003",
  "09995000010",
  "09995000011",
  "09995000012",
  "09995000013",
  "09995000014",
  "09995000015",
  "09995000020",
  "09995000021",
  "09995000022",
  "09995000023",
  "09995000024",
];
const categorySlug = "phase7-test-category";
const serviceSlug = "phase7-test-service";
const inactiveServiceSlug = "phase7-inactive-service";

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

async function createUser(phone: string, name = "کاربر تست") {
  return prisma.user.create({
    data: {
      name,
      phone,
      publicId: createPublicId(),
    },
  });
}

async function createLand(userId: bigint) {
  return prisma.land.create({
    data: {
      areaSquareMeters: "1000",
      latitude: String(landLat),
      longitude: String(landLng),
      publicId: createPublicId(),
      title: "زمین تست فاز۷",
      userId,
    },
  });
}

async function createSearchableProvider(input: {
  distanceKm: number;
  isActive?: number;
  isAvailable?: number;
  name: string;
  phone: string;
  priceToman: number;
  serviceActive?: number;
  subscription?: "active" | "expired" | "future" | "none";
  workRadiusKm?: number;
}) {
  const user = await createUser(input.phone, input.name);
  const profile = await prisma.providerProfile.create({
    data: {
      isActive: input.isActive ?? 1,
      isAvailable: input.isAvailable ?? 1,
      userId: user.id,
      workLatitude: String(offsetLatitude(input.distanceKm)),
      workLongitude: String(landLng),
      workRadiusKm: input.workRadiusKm ?? 50,
    },
  });

  const service = await prisma.service.findFirstOrThrow({
    where: { slug: serviceSlug },
  });

  await prisma.providerService.create({
    data: {
      isActive: input.serviceActive ?? 1,
      priceToman: BigInt(input.priceToman),
      pricingUnit: "per_hectare",
      providerProfileId: profile.id,
      serviceId: service.id,
    },
  });

  const subscription = input.subscription ?? "active";
  if (subscription !== "none") {
    const now = new Date();
    const startsAt =
      subscription === "future"
        ? new Date(now.getTime() + 24 * 60 * 60 * 1000)
        : new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const endsAt =
      subscription === "expired"
        ? new Date(now.getTime() - 60 * 60 * 1000)
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const plan = await prisma.subscriptionPlan.findFirstOrThrow({
      where: { code: "basic-monthly" },
    });

    await prisma.providerSubscription.create({
      data: {
        activatedAt: startsAt,
        amountToman: plan.priceToman,
        endsAt,
        planNameSnapshot: plan.name,
        providerProfileId: profile.id,
        publicId: createPublicId(),
        source: "admin_grant",
        startsAt,
        status: subscription === "expired" ? "expired" : "active",
        subscriptionPlanId: plan.id,
      },
    });
  }

  return { profile, user };
}

async function cleanup() {
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
  await prisma.service.deleteMany({
    where: { slug: { in: [serviceSlug, inactiveServiceSlug] } },
  });
  await prisma.serviceCategory.deleteMany({
    where: { slug: categorySlug },
  });
}

describe.sequential("phase 07 search matching", () => {
  beforeAll(async () => {
    await cleanup();

    const category = await prisma.serviceCategory.create({
      data: {
        name: "دسته فاز۷",
        slug: categorySlug,
        sortOrder: 1,
      },
    });
    await prisma.service.createMany({
      data: [
        {
          name: "خدمت فاز۷",
          serviceCategoryId: category.id,
          slug: serviceSlug,
          sortOrder: 1,
        },
        {
          isActive: 0,
          name: "خدمت غیرفعال فاز۷",
          serviceCategoryId: category.id,
          slug: inactiveServiceSlug,
          sortOrder: 2,
        },
      ],
    });
  }, 60_000);

  beforeEach(async () => {
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
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  }, 60_000);

  it("includes exact radius edge and excludes outside radius", async () => {
    const consumer = await createUser(phones[0]!);
    const land = await createLand(consumer.id);

    const inside = await createSearchableProvider({
      distanceKm: 50,
      name: "داخل شعاع",
      phone: phones[1]!,
      priceToman: 100_000,
      workRadiusKm: 50,
    });
    await createSearchableProvider({
      distanceKm: 50.5,
      name: "خارج شعاع",
      phone: phones[2]!,
      priceToman: 90_000,
      workRadiusKm: 50,
    });

    const search = await createServiceSearch(
      consumer.id,
      {
        categoryId: categorySlug,
        dates: [futureDate(1)],
        landId: land.publicId,
        serviceId: serviceSlug,
      },
      `idem-radius-${createPublicId()}`,
    );

    expect(search).toMatchObject({ outcome: "created", providersFound: 1 });
    const result = await listRequestCandidates(consumer.id, requestIdOf(search));

    expect(result.request.status).toBe("awaiting_send");
    expect(result.candidates.map((item) => item.providerId)).toEqual([
      inside.user.publicId,
    ]);
    expect(result.candidates[0]?.state).toBe("available");
    expect(result.candidates[0]?.distanceKm).toBeLessThanOrEqual(50);
    expect(JSON.stringify(result.candidates)).not.toContain("09995");
    expect(JSON.stringify(result.candidates)).not.toContain("work_latitude");
  });

  it("hides expired/future subscription, inactive provider/service, and self", async () => {
    const consumer = await createUser(phones[3]!);
    const land = await createLand(consumer.id);

    const visible = await createSearchableProvider({
      distanceKm: 10,
      name: "واجد شرایط",
      phone: phones[4]!,
      priceToman: 120_000,
    });
    await createSearchableProvider({
      distanceKm: 10,
      name: "منقضی",
      phone: phones[5]!,
      priceToman: 80_000,
      subscription: "expired",
    });
    await createSearchableProvider({
      distanceKm: 10,
      name: "آینده",
      phone: phones[6]!,
      priceToman: 80_000,
      subscription: "future",
    });
    await createSearchableProvider({
      distanceKm: 10,
      isAvailable: 0,
      name: "غیرفعال",
      phone: phones[7]!,
      priceToman: 80_000,
    });
    await createSearchableProvider({
      distanceKm: 10,
      name: "خدمت خاموش",
      phone: phones[8]!,
      priceToman: 80_000,
      serviceActive: 0,
    });

    const selfProfile = await prisma.providerProfile.create({
      data: {
        userId: consumer.id,
        workLatitude: String(offsetLatitude(5)),
        workLongitude: String(landLng),
        workRadiusKm: 50,
      },
    });
    const service = await prisma.service.findFirstOrThrow({
      where: { slug: serviceSlug },
    });
    await prisma.providerService.create({
      data: {
        priceToman: BigInt(50_000),
        pricingUnit: "per_hectare",
        providerProfileId: selfProfile.id,
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
        providerProfileId: selfProfile.id,
        publicId: createPublicId(),
        source: "admin_grant",
        startsAt: new Date(now.getTime() - 60_000),
        status: "active",
        subscriptionPlanId: plan.id,
      },
    });

    const search = await createServiceSearch(
      consumer.id,
      {
        dates: [futureDate(2)],
        landId: land.publicId,
        serviceId: serviceSlug,
      },
      `idem-eligibility-${createPublicId()}`,
    );

    const result = await listRequestCandidates(consumer.id, requestIdOf(search));

    expect(result.candidates.map((item) => item.providerId)).toEqual([
      visible.user.publicId,
    ]);

    await expect(
      createServiceSearch(
        consumer.id,
        {
          dates: [futureDate(2)],
          landId: land.publicId,
          serviceId: inactiveServiceSlug,
        },
        `idem-inactive-service-${createPublicId()}`,
      ),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("stores nothing when no provider matches", async () => {
    const consumer = await createUser(phones[0]!);
    const land = await createLand(consumer.id);

    const search = await createServiceSearch(
      consumer.id,
      { dates: [futureDate(1)], landId: land.publicId, serviceId: serviceSlug },
      `idem-empty-${createPublicId()}`,
    );

    expect(search).toEqual({ outcome: "no_providers", providersFound: 0 });
    expect(
      await prisma.serviceRequest.count({ where: { consumerUserId: consumer.id } }),
    ).toBe(0);
  });

  it("persists candidates, sorts by price and merges live changes on reopen", async () => {
    const consumer = await createUser(phones[9]!);
    const land = await createLand(consumer.id);

    const providers = [];
    for (const [index, phone] of [phones[10]!, phones[11]!, phones[12]!].entries()) {
      providers.push(
        await createSearchableProvider({
          distanceKm: 5 + index,
          name: `P${index}`,
          phone,
          priceToman: 200_000 - index * 10_000,
        }),
      );
    }

    const search = await createServiceSearch(
      consumer.id,
      { dates: [futureDate(3)], landId: land.publicId, serviceId: serviceSlug },
      `idem-reopen-${createPublicId()}`,
    );
    const requestId = requestIdOf(search);
    const request = await prisma.serviceRequest.findUniqueOrThrow({
      where: { publicId: requestId },
    });
    expect(
      await prisma.serviceRequestCandidate.count({ where: { serviceRequestId: request.id } }),
    ).toBe(3);

    const first = await listRequestCandidates(consumer.id, requestId);
    const prices = first.candidates.map((item) => item.priceToman);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));

    // One stored provider loses eligibility, one new provider appears.
    await prisma.providerSubscription.updateMany({
      where: { providerProfileId: providers[0]!.profile.id },
      data: { endsAt: new Date(Date.now() - 60_000), status: "expired" },
    });
    const late = await createSearchableProvider({
      distanceKm: 9,
      name: "Late",
      phone: phones[13]!,
      priceToman: 150_000,
    });

    const reopened = await listRequestCandidates(consumer.id, requestId);
    const byId = new Map(reopened.candidates.map((item) => [item.providerId, item]));
    expect(byId.get(providers[0]!.user.publicId)?.state).toBe("unavailable");
    expect(byId.get(late.user.publicId)?.state).toBe("available");
    expect(reopened.candidates).toHaveLength(4);
    expect(
      await prisma.serviceRequestCandidate.count({ where: { serviceRequestId: request.id } }),
    ).toBe(4);
  });

  it("warns about an open request for the same land and service", async () => {
    const consumer = await createUser(phones[3]!);
    const land = await createLand(consumer.id);
    await createSearchableProvider({
      distanceKm: 3,
      name: "P",
      phone: phones[4]!,
      priceToman: 100_000,
    });
    const input = { dates: [futureDate(1)], landId: land.publicId, serviceId: serviceSlug };

    const first = await createServiceSearch(consumer.id, input, `idem-dup-a-${createPublicId()}`);
    const second = await createServiceSearch(consumer.id, input, `idem-dup-b-${createPublicId()}`);
    expect(second).toMatchObject({
      duplicate: { requestId: requestIdOf(first), status: "awaiting_send" },
      outcome: "duplicate",
    });

    const forced = await createServiceSearch(
      consumer.id,
      { ...input, allowDuplicate: true },
      `idem-dup-c-${createPublicId()}`,
    );
    expect(forced.outcome).toBe("created");
    expect(
      await prisma.serviceRequest.count({ where: { consumerUserId: consumer.id } }),
    ).toBe(2);
  });
});
