import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getSecurityEnvironment } from "@/server/config/env";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/errors";
import { createPublicId } from "@/server/identifiers/ulid";
import { createMockPaymentProvider } from "@/server/integrations/mock-payment-provider";
import {
  handlePaymentGatewayCallback,
  purchaseProviderSubscription,
  refundPaymentByAdmin,
  setPaymentProviderForTests,
  verifyCurrentUserPayment,
} from "@/server/modules/subscriptions/subscriptions.service";

const phones = [
  "09994000001",
  "09994000002",
  "09994000003",
  "09994000004",
  "09994000005",
];
const planCode = "basic-monthly";

async function createUser(phone: string) {
  return prisma.user.create({
    data: {
      phone,
      publicId: createPublicId(),
    },
  });
}

async function cleanup() {
  await prisma.paymentRefund.deleteMany({
    where: {
      payment: { user: { phone: { in: phones } } },
    },
  });
  await prisma.subscriptionPayment.deleteMany({
    where: { user: { phone: { in: phones } } },
  });
  await prisma.providerSubscription.deleteMany({
    where: { providerProfile: { user: { phone: { in: phones } } } },
  });
  await prisma.providerProfile.deleteMany({
    where: { user: { phone: { in: phones } } },
  });
  await prisma.user.deleteMany({ where: { phone: { in: phones } } });
}

describe.sequential("phase 06 subscriptions/payments", () => {
  const provider = createMockPaymentProvider(
    getSecurityEnvironment().TOKEN_HASH_SECRET,
  );

  beforeAll(async () => {
    setPaymentProviderForTests(provider);
    await cleanup();
  }, 60_000);

  afterAll(async () => {
    setPaymentProviderForTests(undefined);
    await cleanup();
    await prisma.$disconnect();
  }, 60_000);

  it("rejects purchase without provider profile", async () => {
    const user = await createUser(phones[0]!);
    await expect(
      purchaseProviderSubscription(
        user.id,
        { planCode },
        `idem-no-profile-${createPublicId()}`,
      ),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });
  });

  it("activates via callback and is replay-safe", async () => {
    const user = await createUser(phones[1]!);
    await prisma.providerProfile.create({
      data: { userId: user.id },
    });

    const purchase = await purchaseProviderSubscription(
      user.id,
      { planCode },
      `idem-purchase-${createPublicId()}`,
    );

    const payment = await prisma.subscriptionPayment.findUniqueOrThrow({
      where: { publicId: purchase.paymentId },
    });
    const amount = Number(payment.amountToman);
    const signature = provider.signCallback(purchase.authority, amount);

    const first = await handlePaymentGatewayCallback("mock", {
      amountToman: amount,
      authority: purchase.authority,
      signature,
    });
    expect(first.status).toBe("paid");

    const replay = await handlePaymentGatewayCallback("mock", {
      amountToman: amount,
      authority: purchase.authority,
      signature,
    });
    expect(replay.status).toBe("paid");

    const activeCount = await prisma.providerSubscription.count({
      where: {
        providerProfile: { userId: user.id },
        status: "active",
      },
    });
    expect(activeCount).toBe(1);

    const verified = await verifyCurrentUserPayment(
      user.id,
      purchase.paymentId,
    );
    expect(verified.status).toBe("paid");
  });

  it("rejects amount mismatch and invalid signature", async () => {
    const user = await createUser(phones[2]!);
    await prisma.providerProfile.create({ data: { userId: user.id } });

    const purchase = await purchaseProviderSubscription(
      user.id,
      { planCode },
      `idem-mismatch-${createPublicId()}`,
    );
    const payment = await prisma.subscriptionPayment.findUniqueOrThrow({
      where: { publicId: purchase.paymentId },
    });
    const amount = Number(payment.amountToman);

    await expect(
      handlePaymentGatewayCallback("mock", {
        amountToman: amount,
        authority: purchase.authority,
        signature: "0".repeat(64),
      }),
    ).rejects.toMatchObject({ status: 401 });

    const signedWrong = provider.signCallback(purchase.authority, amount + 1);
    await expect(
      handlePaymentGatewayCallback("mock", {
        amountToman: amount + 1,
        authority: purchase.authority,
        signature: signedWrong,
      }),
    ).rejects.toMatchObject({ status: 400 });

    const refreshed = await prisma.subscriptionPayment.findUniqueOrThrow({
      where: { publicId: purchase.paymentId },
    });
    expect(refreshed.status).toBe("failed");
  });

  it("keeps one active subscription under concurrent activation", async () => {
    const user = await createUser(phones[3]!);
    await prisma.providerProfile.create({ data: { userId: user.id } });

    const first = await purchaseProviderSubscription(
      user.id,
      { planCode },
      `idem-c1-${createPublicId()}`,
    );
    const second = await purchaseProviderSubscription(
      user.id,
      { planCode },
      `idem-c2-${createPublicId()}`,
    );

    const p1 = await prisma.subscriptionPayment.findUniqueOrThrow({
      where: { publicId: first.paymentId },
    });
    const p2 = await prisma.subscriptionPayment.findUniqueOrThrow({
      where: { publicId: second.paymentId },
    });

    const a1 = Number(p1.amountToman);
    const a2 = Number(p2.amountToman);

    await Promise.all([
      handlePaymentGatewayCallback("mock", {
        amountToman: a1,
        authority: first.authority,
        signature: provider.signCallback(first.authority, a1),
      }),
      handlePaymentGatewayCallback("mock", {
        amountToman: a2,
        authority: second.authority,
        signature: provider.signCallback(second.authority, a2),
      }),
    ]);

    const active = await prisma.providerSubscription.findMany({
      where: {
        providerProfile: { userId: user.id },
        status: "active",
      },
    });
    expect(active).toHaveLength(1);

    const paid = await prisma.subscriptionPayment.count({
      where: {
        status: "paid",
        userId: user.id,
      },
    });
    expect(paid).toBe(2);
  });

  it("rejects refund above remaining amount", async () => {
    const user = await createUser(phones[4]!);
    await prisma.providerProfile.create({ data: { userId: user.id } });

    const purchase = await purchaseProviderSubscription(
      user.id,
      { planCode },
      `idem-refund-${createPublicId()}`,
    );
    const payment = await prisma.subscriptionPayment.findUniqueOrThrow({
      where: { publicId: purchase.paymentId },
    });
    const amount = Number(payment.amountToman);
    await handlePaymentGatewayCallback("mock", {
      amountToman: amount,
      authority: purchase.authority,
      signature: provider.signCallback(purchase.authority, amount),
    });

    const admin = await prisma.admin.create({
      data: {
        isSuperAdmin: 1,
        name: "admin phase6",
        password: "x".repeat(60),
        phone: "09994000999",
        publicId: createPublicId(),
      },
    });

    try {
      await refundPaymentByAdmin({
        adminId: admin.id,
        amountToman: amount,
        idempotencyKey: `idem-ref-ok-${createPublicId()}`,
        paymentId: purchase.paymentId,
        reason: "full refund",
      });

      await expect(
        refundPaymentByAdmin({
          adminId: admin.id,
          amountToman: 1,
          idempotencyKey: `idem-ref-over-${createPublicId()}`,
          paymentId: purchase.paymentId,
          reason: "over refund",
        }),
      ).rejects.toBeInstanceOf(ApiError);
    } finally {
      await prisma.paymentRefund.deleteMany({
        where: { requestedByAdminId: admin.id },
      });
      await prisma.admin.delete({ where: { id: admin.id } });
    }
  });
});
