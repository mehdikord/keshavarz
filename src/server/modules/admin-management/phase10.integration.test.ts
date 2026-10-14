import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getSecurityEnvironment } from "@/server/config/env";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/errors";
import { createPublicId } from "@/server/identifiers/ulid";
import {
  createCategoryForAdmin,
  createServiceForAdmin,
  deleteCategoryForAdmin,
  deleteServiceForAdmin,
} from "@/server/modules/admin-catalog/admin-catalog.service";
import { getAdminDashboard } from "@/server/modules/admin-dashboard/dashboard.service";
import {
  createManagedAdmin,
  createManagedRole,
  deleteManagedRole,
  setManagedAdminStatus,
} from "@/server/modules/admin-management/admin-management.service";
import {
  approveProviderForAdmin,
  updateProviderServiceForAdmin,
} from "@/server/modules/admin-providers/admin-providers.service";
import { upsertSettingForAdmin } from "@/server/modules/admin-settings/admin-settings.service";
import {
  createSubscriptionPlanForAdmin,
  deleteSubscriptionPlanForAdmin,
  listSubscriptionPlansForAdmin,
} from "@/server/modules/admin-subscriptions/admin-subscriptions.service";
import {
  createUserModerationActionForAdmin,
  getUserForAdmin,
  listUserModerationActionsForAdmin,
  updateUserForAdmin,
} from "@/server/modules/admin-users/admin-users.service";
import { hashPassword, hashToken } from "@/server/security";

const phones = ["09998000001", "09998000002", "09998000003"];
const adminPhones = ["09998000991", "09998000992", "09998000993"];
const categorySlug = "phase10-test-category";
const serviceSlug = "phase10-test-service";
const planCode = `p10-plan-${Date.now().toString(36)}`;
const roleCode = `phase10-role-${createPublicId().slice(0, 8).toLowerCase()}`;

async function cleanup() {
  await prisma.providerServicePriceHistory.deleteMany({
    where: {
      providerService: {
        providerProfile: { user: { phone: { in: phones } } },
      },
    },
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
  await prisma.userSession.deleteMany({
    where: { user: { phone: { in: phones } } },
  });
  await prisma.userModerationAction.deleteMany({
    where: { user: { phone: { in: phones } } },
  });
  await prisma.user.deleteMany({ where: { phone: { in: phones } } });

  await prisma.service.deleteMany({ where: { slug: serviceSlug } });
  await prisma.serviceCategory.deleteMany({ where: { slug: categorySlug } });
  await prisma.subscriptionPlan.deleteMany({ where: { code: planCode } });

  await prisma.systemSetting.deleteMany({
    where: { settingGroup: "phase10", settingKey: "flag" },
  });

  await prisma.adminRolePermission.deleteMany({
    where: { role: { code: { startsWith: "phase10-role-" } } },
  });
  await prisma.adminRoleAssignment.deleteMany({
    where: { role: { code: { startsWith: "phase10-role-" } } },
  });
  await prisma.adminRole.deleteMany({
    where: { code: { startsWith: "phase10-role-" } },
  });
  await prisma.adminSession.deleteMany({
    where: { admin: { phone: { in: adminPhones } } },
  });
  await prisma.adminAuditLog.deleteMany({
    where: { admin: { phone: { in: adminPhones } } },
  });
  await prisma.admin.deleteMany({ where: { phone: { in: adminPhones } } });
}

describe.sequential("phase 10 admin management", () => {
  let actorAdminId: bigint;

  beforeAll(async () => {
    await cleanup();
    const actor = await prisma.admin.create({
      data: {
        isSuperAdmin: 1,
        name: "phase10 actor",
        password: await hashPassword("Phase10ActorPass!99"),
        phone: adminPhones[0]!,
        publicId: createPublicId(),
      },
    });
    actorAdminId = actor.id;
  }, 60_000);

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  }, 60_000);

  it("returns dashboard KPIs with Tehran timezone", async () => {
    const dashboard = await getAdminDashboard({});
    expect(dashboard.timezone).toBe("Asia/Tehran");
    expect(dashboard.from).toBeTruthy();
    expect(dashboard.to).toBeTruthy();
    expect(typeof dashboard.totalUsers).toBe("number");
    expect(typeof dashboard.requestsByStatus).toBe("object");
  });

  it("updates users, moderates with ban, and revokes sessions", async () => {
    const user = await prisma.user.create({
      data: {
        name: "phase10 user",
        phone: phones[0]!,
        publicId: createPublicId(),
      },
    });
    await prisma.userSession.create({
      data: {
        expiresAt: new Date(Date.now() + 86_400_000),
        publicId: createPublicId(),
        tokenHash: hashToken(
          `sess-${user.publicId}`,
          getSecurityEnvironment().TOKEN_HASH_SECRET,
        ),
        userId: user.id,
      },
    });

    const updated = await updateUserForAdmin(user.publicId, {
      name: "phase10 renamed",
    });
    expect(updated.newValues.name).toBe("phase10 renamed");

    await createUserModerationActionForAdmin({
      action: "ban",
      adminId: actorAdminId,
      reason: "آزمون بن",
      userId: user.publicId,
    });

    const detail = await getUserForAdmin(user.publicId);
    expect(detail.isActive).toBe(false);

    const sessions = await prisma.userSession.findMany({
      where: { userId: user.id },
    });
    expect(sessions.every((row) => row.revokedAt !== null)).toBe(true);

    const timeline = await listUserModerationActionsForAdmin({
      limit: 10,
      userId: user.publicId,
    });
    expect(timeline.items.some((item) => item.action === "ban")).toBe(true);
  });

  it("approves provider and records admin price history", async () => {
    const user = await prisma.user.create({
      data: {
        name: "phase10 provider",
        phone: phones[1]!,
        publicId: createPublicId(),
      },
    });
    const profile = await prisma.providerProfile.create({
      data: {
        isActive: 0,
        isAvailable: 0,
        userId: user.id,
        workLatitude: "35.7000000",
        workLongitude: "51.4000000",
        workRadiusKm: 40,
      },
    });
    const service = await prisma.service.findFirstOrThrow({
      where: { deletedAt: null },
      orderBy: { id: "asc" },
    });
    const providerService = await prisma.providerService.create({
      data: {
        priceToman: BigInt(100_000),
        pricingUnit: "per_hectare",
        providerProfileId: profile.id,
        serviceId: service.id,
      },
    });

    const approved = await approveProviderForAdmin({
      adminId: actorAdminId,
      isActive: true,
      providerId: user.publicId,
    });
    expect(approved.newValues.approvedAt).toBeTruthy();
    expect(approved.newValues.isActive).toBe(true);

    const patched = await updateProviderServiceForAdmin({
      adminId: actorAdminId,
      priceToman: 150_000,
      providerServiceId: providerService.id.toString(),
    });
    expect(patched.newValues.priceToman).toBe(150_000);

    const history = await prisma.providerServicePriceHistory.findMany({
      where: { providerServiceId: providerService.id },
    });
    expect(history.some((row) => row.changedBy === "admin")).toBe(true);
  });

  it("manages catalog soft-delete guards", async () => {
    await createCategoryForAdmin({
      adminId: actorAdminId,
      isActive: true,
      name: "دسته فاز۱۰",
      slug: categorySlug,
      sortOrder: 10,
    });
    await createServiceForAdmin({
      adminId: actorAdminId,
      categoryId: categorySlug,
      isActive: true,
      name: "خدمت فاز۱۰",
      slug: serviceSlug,
      sortOrder: 10,
    });

    await expect(
      deleteCategoryForAdmin(categorySlug, actorAdminId),
    ).rejects.toBeInstanceOf(ApiError);

    await deleteServiceForAdmin(serviceSlug, actorAdminId);
    await deleteCategoryForAdmin(categorySlug, actorAdminId);

    const category = await prisma.serviceCategory.findFirst({
      where: { slug: categorySlug },
    });
    expect(category?.deletedAt).not.toBeNull();
  });

  it("manages subscription plans", async () => {
    const created = await createSubscriptionPlanForAdmin(actorAdminId, {
      code: planCode,
      durationMonths: 1,
      features: ["a"],
      isActive: true,
      isRecommended: false,
      name: "پلن فاز۱۰",
      priceToman: 123_000,
      sortOrder: 99,
    });
    expect(created.planId).toBe(planCode);

    const listed = await listSubscriptionPlansForAdmin({
      includeDeleted: false,
    });
    expect(listed.some((plan) => plan.planId === planCode)).toBe(true);

    await deleteSubscriptionPlanForAdmin(actorAdminId, planCode);
    const after = await prisma.subscriptionPlan.findFirstOrThrow({
      where: { code: planCode },
    });
    expect(after.deletedAt).not.toBeNull();
  });

  it("validates settings value types", async () => {
    const ok = await upsertSettingForAdmin({
      group: "phase10",
      key: "flag",
      settingValue: true,
      updatedByAdminId: actorAdminId,
      valueType: "boolean",
    });
    expect(ok.newValues.settingValue).toBe(true);

    await expect(
      upsertSettingForAdmin({
        group: "phase10",
        key: "flag",
        settingValue: "nope",
        updatedByAdminId: actorAdminId,
        valueType: "boolean",
      }),
    ).rejects.toMatchObject({ status: 422 });
  });

  it("protects system roles and last super-admin", async () => {
    const role = await createManagedRole({
      actorAdminId,
      code: roleCode,
      name: "نقش موقت فاز۱۰",
    });
    expect(role.roleId).toBe(roleCode);
    await deleteManagedRole(role.roleId);

    await expect(deleteManagedRole("platform_admin")).rejects.toBeInstanceOf(
      ApiError,
    );

    const other = await createManagedAdmin({
      actorAdminId,
      isSuperAdmin: false,
      name: "phase10 admin b",
      password: "SecureMgrPass!7744",
      phone: adminPhones[1]!,
    });

    const actor = await prisma.admin.findUniqueOrThrow({
      where: { id: actorAdminId },
    });

    await expect(
      setManagedAdminStatus({
        actorAdminId,
        adminId: actor.publicId,
        isActive: false,
      }),
    ).rejects.toBeInstanceOf(ApiError);

    expect(other.adminId).toBeTruthy();
  });
});
