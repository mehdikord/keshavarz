import "dotenv/config";

import { resolve } from "node:path";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import {
  loadCitiesFromSql,
  loadProvincesFromSql,
} from "./geo-data";

import { PrismaClient } from "../src/generated/prisma/client";

const databaseUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl?.startsWith("mysql://")) {
  throw new Error("DATABASE_URL یا DIRECT_DATABASE_URL معتبر تنظیم نشده است.");
}

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(databaseUrl),
  log: ["error"],
});

const permissionCodes = [
  "dashboard.view",
  "users.view",
  "users.update",
  "users.change_status",
  "providers.view",
  "providers.update",
  "providers.change_status",
  "catalog.view",
  "catalog.manage",
  "requests.view",
  "requests.manage",
  "requests.cancel",
  "subscriptions.view",
  "subscriptions.manage",
  "subscriptions.grant",
  "payments.view",
  "payments.refund",
  "payments.export",
  "notifications.view",
  "notifications.send",
  "reports.view",
  "reports.export",
  "admins.view",
  "admins.manage",
  "roles.view",
  "roles.manage",
  "audit_logs.view",
  "settings.view",
  "settings.manage",
] as const;

const catalog = [
  {
    name: "خدمات کاشت",
    slug: "planting",
    services: [
      ["کاشت گندم", "plant-wheat"],
      ["کاشت لوبیا", "plant-bean"],
      ["کاشت سیب‌زمینی", "plant-potato"],
      ["کاشت ذرت", "plant-corn"],
    ],
  },
  {
    name: "خدمات برداشت",
    slug: "harvesting",
    services: [
      ["برداشت گندم", "harvest-wheat"],
      ["برداشت برنج", "harvest-rice"],
      ["برداشت پنبه", "harvest-cotton"],
    ],
  },
  {
    name: "سم‌پاشی و کود",
    slug: "spraying-fertilizing",
    services: [
      ["سم‌پاشی", "pesticide-spraying"],
      ["کودپاشی", "fertilizing"],
      ["علف‌کش", "herbicide-spraying"],
    ],
  },
  {
    name: "شخم و آماده‌سازی",
    slug: "land-preparation",
    services: [
      ["شخم زمین", "land-plowing"],
      ["تسطیح زمین", "land-leveling"],
      ["دیسک زنی", "disk-harrowing"],
    ],
  },
] as const;

const subscriptionPlans = [
  {
    code: "basic-monthly",
    name: "اشتراک پایه",
    durationMonths: 1,
    priceToman: BigInt(299_000),
    features: ["نمایش در نتایج جستجو", "دریافت درخواست خدمت"],
    sortOrder: 10,
    isRecommended: 0,
  },
  {
    code: "professional-monthly",
    name: "اشتراک حرفه‌ای",
    durationMonths: 1,
    priceToman: BigInt(499_000),
    features: [
      "نمایش در نتایج جستجو",
      "دریافت درخواست خدمت",
      "اولویت نمایش در نتایج",
    ],
    sortOrder: 20,
    isRecommended: 1,
  },
] as const;

async function seedPermissions(): Promise<void> {
  const permissions = [];

  for (const code of permissionCodes) {
    const [module, action] = code.split(".");

    if (!module || !action) {
      throw new Error(`کد دسترسی نامعتبر است: ${code}`);
    }

    const permission = await prisma.adminPermission.upsert({
      where: { code },
      update: {
        module,
        action,
        name: code,
        isActive: 1,
      },
      create: {
        module,
        action,
        code,
        name: code,
      },
      select: { id: true },
    });

    permissions.push(permission);
  }

  const systemRole = await prisma.adminRole.upsert({
    where: { code: "platform_admin" },
    update: {
      name: "مدیر پلتفرم",
      description: "نقش سیستمی دارای تمام دسترسی‌های مدیریت",
      isSystem: 1,
      isActive: 1,
      deletedAt: null,
    },
    create: {
      name: "مدیر پلتفرم",
      code: "platform_admin",
      description: "نقش سیستمی دارای تمام دسترسی‌های مدیریت",
      isSystem: 1,
    },
    select: { id: true },
  });

  await prisma.adminRolePermission.createMany({
    data: permissions.map(({ id: permissionId }) => ({
      roleId: systemRole.id,
      permissionId,
    })),
    skipDuplicates: true,
  });
}

async function seedCatalog(): Promise<void> {
  for (const [categoryIndex, categoryData] of catalog.entries()) {
    const category = await prisma.serviceCategory.upsert({
      where: { slug: categoryData.slug },
      update: {
        name: categoryData.name,
        sortOrder: (categoryIndex + 1) * 10,
        isActive: 1,
        deletedAt: null,
      },
      create: {
        name: categoryData.name,
        slug: categoryData.slug,
        sortOrder: (categoryIndex + 1) * 10,
      },
      select: { id: true },
    });

    for (const [serviceIndex, [name, slug]] of categoryData.services.entries()) {
      await prisma.service.upsert({
        where: { slug },
        update: {
          serviceCategoryId: category.id,
          name,
          sortOrder: (serviceIndex + 1) * 10,
          isActive: 1,
          deletedAt: null,
        },
        create: {
          serviceCategoryId: category.id,
          name,
          slug,
          sortOrder: (serviceIndex + 1) * 10,
        },
      });
    }
  }
}

async function seedSubscriptionPlans(): Promise<void> {
  for (const plan of subscriptionPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        durationMonths: plan.durationMonths,
        priceToman: plan.priceToman,
        features: [...plan.features],
        sortOrder: plan.sortOrder,
        isRecommended: plan.isRecommended ?? 0,
        isActive: 1,
        deletedAt: null,
      },
      create: {
        code: plan.code,
        name: plan.name,
        durationMonths: plan.durationMonths,
        priceToman: plan.priceToman,
        features: [...plan.features],
        sortOrder: plan.sortOrder,
        isRecommended: plan.isRecommended ?? 0,
      },
    });
  }
}

async function seedSettings(): Promise<void> {
  await prisma.systemSetting.upsert({
    where: {
      settingGroup_settingKey: {
        settingGroup: "app",
        settingKey: "support_phone",
      },
    },
    update: {
      settingValue: "",
      valueType: "string",
      isPublic: 1,
    },
    create: {
      settingGroup: "app",
      settingKey: "support_phone",
      settingValue: "",
      valueType: "string",
      isPublic: 1,
      description: "شماره پشتیبانی عمومی اپلیکیشن",
    },
  });
}

async function seedProvincesAndCities(): Promise<void> {
  const provincesPath = resolve(process.cwd(), "../docs/data/provinces.sql");
  const citiesPath = resolve(process.cwd(), "../docs/data/cities.sql");

  const provinces = await loadProvincesFromSql(provincesPath);
  const cities = await loadCitiesFromSql(citiesPath);

  for (const province of provinces) {
    await prisma.province.upsert({
      where: { id: province.id },
      update: {
        name: province.name,
        updatedAt: province.updatedAt,
        deletedAt: null,
      },
      create: {
        id: province.id,
        name: province.name,
        createdAt: province.createdAt,
        updatedAt: province.updatedAt,
      },
    });
  }

  const cityIds = new Set(cities.map((city) => city.id));
  for (const city of cities) {
    await prisma.city.upsert({
      where: { id: city.id },
      update: {
        name: city.name,
        provinceId: city.provinceId,
        updatedAt: city.updatedAt,
        deletedAt: null,
      },
      create: {
        id: city.id,
        name: city.name,
        provinceId: city.provinceId,
        createdAt: city.createdAt,
        updatedAt: city.updatedAt,
      },
    });
  }

  await prisma.city.deleteMany({
    where: {
      deletedAt: null,
      id: { notIn: [...cityIds] },
    },
  });

  console.info(
    `استانها و شهرها بارگذاری شدند: ${provinces.length} استان، ${cities.length} شهر.`,
  );
}

async function seedBootstrapAdmin(): Promise<void> {
  const phone = process.env.ADMIN_SEED_PHONE?.trim();
  const password = process.env.ADMIN_SEED_PASSWORD?.trim();
  const name = process.env.ADMIN_SEED_NAME?.trim() || "مدیر سیستم";

  if (!phone || !password) {
    console.info(
      "ADMIN_SEED_PHONE/ADMIN_SEED_PASSWORD تنظیم نشده؛ مدیر bootstrap ساخته نشد.",
    );
    return;
  }

  const { createPublicId } = await import("../src/server/identifiers/ulid");
  const { hashPassword } = await import("../src/server/security/crypto");

  const passwordHash = await hashPassword(password);
  const role = await prisma.adminRole.findUnique({
    where: { code: "platform_admin" },
    select: { id: true },
  });

  if (!role) {
    throw new Error("نقش platform_admin قبل از seed مدیر یافت نشد.");
  }

  const admin = await prisma.admin.upsert({
    where: { phone },
    update: {
      deletedAt: null,
      isActive: 1,
      isSuperAdmin: 1,
      name,
      password: passwordHash,
      passwordChangedAt: new Date(),
    },
    create: {
      isActive: 1,
      isSuperAdmin: 1,
      name,
      password: passwordHash,
      passwordChangedAt: new Date(),
      phone,
      phoneVerifiedAt: new Date(),
      publicId: createPublicId(),
    },
    select: { id: true },
  });

  await prisma.adminRoleAssignment.upsert({
    where: {
      adminId_roleId: {
        adminId: admin.id,
        roleId: role.id,
      },
    },
    update: {
      expiresAt: null,
    },
    create: {
      adminId: admin.id,
      roleId: role.id,
    },
  });
}

async function main(): Promise<void> {
  await seedProvincesAndCities();
  await seedPermissions();
  await seedCatalog();
  await seedSubscriptionPlans();
  await seedSettings();
  await seedBootstrapAdmin();
}

main()
  .catch(() => {
    console.error("اجرای seed دیتابیس ناموفق بود.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
