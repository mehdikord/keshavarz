import "dotenv/config";

import { createHmac, randomBytes } from "node:crypto";

import { prisma } from "../../src/server/db/prisma";

const PUBLIC_ID_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function makePublicId(): string {
  const bytes = randomBytes(32);
  let id = "";
  for (let index = 0; index < 26; index += 1) {
    id += PUBLIC_ID_ALPHABET[bytes[index]! % PUBLIC_ID_ALPHABET.length];
  }
  return id;
}

function makeOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

function hashToken(token: string): string {
  const secret = process.env.TOKEN_HASH_SECRET;
  if (!secret) {
    throw new Error("TOKEN_HASH_SECRET is required.");
  }
  return createHmac("sha256", secret).update(token).digest("hex");
}

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag?.startsWith("--")) {
      args[flag.slice(2)] = argv[index + 1] ?? "";
      index += 1;
    }
  }
  return args;
}

interface Tokens {
  csrfToken: string;
  sessionToken: string;
}

async function installAppSession(
  userId: bigint,
  deviceId: string,
): Promise<Tokens> {
  const token = makeOpaqueToken();
  const csrfToken = makeOpaqueToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await prisma.userSession.upsert({
    where: { tokenHash: hashToken(token) },
    update: { expiresAt, revokedAt: null },
    create: {
      deviceId,
      deviceName: "Playwright",
      expiresAt,
      publicId: makePublicId(),
      tokenHash: hashToken(token),
      userId,
    },
  });

  return { csrfToken, sessionToken: token };
}

async function seedApp(args: Record<string, string>): Promise<Tokens> {
  const phone = args["phone"];
  if (!phone) throw new Error("--phone is required.");

  const user = await prisma.user.upsert({
    where: { phone },
    update: { name: args["name"] ?? "کاربر تست E2E" },
    create: {
      name: args["name"] ?? "کاربر تست E2E",
      phone,
      publicId: makePublicId(),
    },
  });

  if (args["land-title"]) {
    const existing = await prisma.land.findFirst({
      where: { title: args["land-title"], userId: user.id },
    });
    if (!existing) {
      await prisma.land.create({
        data: {
          areaSquareMeters: args["land-area"] ?? "5000",
          latitude: args["land-lat"]!,
          longitude: args["land-lng"]!,
          publicId: makePublicId(),
          title: args["land-title"]!,
          userId: user.id,
        },
      });
    }
  }

  return installAppSession(user.id, "e2e-device");
}

async function seedProvider(
  args: Record<string, string>,
  withSubscription: boolean,
): Promise<Tokens> {
  const phone = args["phone"];
  if (!phone) throw new Error("--phone is required.");
  const serviceSlug = args["service"] ?? "plant-wheat";

  const service = await prisma.service.findUniqueOrThrow({
    where: { slug: serviceSlug },
  });
  const user = await prisma.user.upsert({
    where: { phone },
    update: {
      name: args["name"] ?? (withSubscription
        ? "خدمات‌دهنده تست E2E"
        : "خریدار اشتراک E2E"),
    },
    create: {
      name: args["name"] ?? (withSubscription
        ? "خدمات‌دهنده تست E2E"
        : "خریدار اشتراک E2E"),
      phone,
      publicId: makePublicId(),
    },
  });

  const profile = await prisma.providerProfile.upsert({
    where: { userId: user.id },
    update: {
      isActive: 1,
      isAvailable: 1,
      workLatitude: args["lat"] ?? "35.7000000",
      workLongitude: args["lng"] ?? "51.4000000",
      workRadiusKm: Number(args["radius"] ?? 100),
    },
    create: {
      isActive: 1,
      isAvailable: 1,
      userId: user.id,
      workLatitude: args["lat"] ?? "35.7000000",
      workLongitude: args["lng"] ?? "51.4000000",
      workRadiusKm: Number(args["radius"] ?? 100),
    },
  });

  await prisma.providerService.upsert({
    where: {
      providerProfileId_serviceId: {
        providerProfileId: profile.id,
        serviceId: service.id,
      },
    },
    update: { isActive: 1, priceToman: BigInt(args["price"] ?? 500_000) },
    create: {
      isActive: 1,
      priceToman: BigInt(args["price"] ?? 500_000),
      pricingUnit: "fixed",
      providerProfileId: profile.id,
      serviceId: service.id,
    },
  });

  if (withSubscription) {
    const existingSubscription = await prisma.providerSubscription.findFirst({
      where: { providerProfileId: profile.id, status: "active" },
    });
    if (!existingSubscription) {
      const plan = await prisma.subscriptionPlan.findFirstOrThrow({
        where: { code: "basic-monthly" },
      });
      const now = new Date();
      await prisma.providerSubscription.create({
        data: {
          amountToman: plan.priceToman,
          planNameSnapshot: plan.name,
          providerProfileId: profile.id,
          publicId: makePublicId(),
          status: "active",
          subscriptionPlanId: plan.id,
          startsAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          endsAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  return installAppSession(
    user.id,
    withSubscription ? "e2e-provider" : "e2e-purchaser",
  );
}

async function seedAdmin(args: Record<string, string>): Promise<Tokens> {
  const phone = args["phone"];
  if (!phone) throw new Error("--phone is required.");

  const admin = await prisma.admin.upsert({
    where: { phone },
    update: {},
    create: {
      name: "مدیر تست E2E",
      password: "e2e-skip-password",
      phone,
      publicId: makePublicId(),
    },
  });

  const role = await prisma.adminRole.findUnique({
    where: { code: "platform_admin" },
  });
  if (role) {
    const now = new Date();
    await prisma.adminRoleAssignment.upsert({
      where: { adminId_roleId: { adminId: admin.id, roleId: role.id } },
      update: {},
      create: {
        adminId: admin.id,
        roleId: role.id,
        expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  }

  const token = makeOpaqueToken();
  const csrfToken = makeOpaqueToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.adminSession.upsert({
    where: { tokenHash: hashToken(token) },
    update: { expiresAt, revokedAt: null },
    create: {
      adminId: admin.id,
      expiresAt,
      tokenHash: hashToken(token),
    },
  });

  return { csrfToken, sessionToken: token };
}

async function cleanup(args: Record<string, string>): Promise<void> {
  const phones = (args["phones"] ?? "")
    .split(",")
    .map((phone) => phone.trim())
    .filter(Boolean);

  if (phones.length === 0) return;

  const requestFilter = { consumer: { phone: { in: phones } } };

  await prisma.userSession.deleteMany({
    where: { user: { phone: { in: phones } } },
  });
  await prisma.adminSession.deleteMany({
    where: { admin: { phone: { in: phones } } },
  });
  await prisma.notificationDelivery.deleteMany({
    where: { notification: { user: { phone: { in: phones } } } },
  });
  await prisma.notification.deleteMany({
    where: { user: { phone: { in: phones } } },
  });
  await prisma.serviceRequestProvider.deleteMany({
    where: { request: requestFilter },
  });
  await prisma.serviceRequestDate.deleteMany({
    where: { request: requestFilter },
  });
  await prisma.serviceRequestStatusHistory.deleteMany({
    where: { request: requestFilter },
  });
  await prisma.serviceRequest.deleteMany({ where: requestFilter });
  await prisma.land.deleteMany({ where: { user: { phone: { in: phones } } } });
  await prisma.providerService.deleteMany({
    where: { providerProfile: { user: { phone: { in: phones } } } },
  });
  await prisma.providerSubscription.deleteMany({
    where: { providerProfile: { user: { phone: { in: phones } } } },
  });
  await prisma.providerProfile.deleteMany({
    where: { user: { phone: { in: phones } } },
  });
  await prisma.adminRoleAssignment.deleteMany({
    where: { admin: { phone: { in: phones } } },
  });
  await prisma.admin.deleteMany({ where: { phone: { in: phones } } });
  await prisma.user.deleteMany({ where: { phone: { in: phones } } });
}

const [command, ...rest] = process.argv.slice(2);
const args = parseArgs(rest);

try {
  let result: unknown;
  switch (command) {
    case "seed-app":
      result = await seedApp(args);
      break;
    case "seed-provider":
      result = await seedProvider(args, true);
      break;
    case "seed-purchaser":
      result = await seedProvider(args, false);
      break;
    case "seed-admin":
      result = await seedAdmin(args);
      break;
    case "cleanup":
      await cleanup(args);
      result = { ok: true };
      break;
    default:
      throw new Error(`unknown command: ${command}`);
  }
  process.stdout.write(`${JSON.stringify(result)}\n`);
} finally {
  await prisma.$disconnect();
}
