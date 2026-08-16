import { createHmac } from "node:crypto";

import {
  expect,
  test,
  type APIRequestContext,
  type BrowserContext,
} from "@playwright/test";

import {
  cleanupUsers,
  seedAdminSession,
  seedAppSession,
  seedEligibleProvider,
  seedProviderForPurchase,
  type SeededTokens,
} from "./helpers/db";

const APP_ORIGIN =
  process.env.APP_ORIGIN ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const ADMIN_ORIGIN =
  process.env.ADMIN_ORIGIN ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

const CONSUMER_PHONE = "09999800001";
const PROVIDER_PHONES = ["09999800002", "09999800003", "09999800004"];
const PURCHASER_PHONE = "09999800006";
const ADMIN_PHONE = "09999800005";
const LAND_LAT = "35.7000000";
const LAND_LNG = "51.4000000";

function tomorrow(): string {
  return new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function idempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

async function mutation(
  context: BrowserContext,
  tokens: SeededTokens,
  method: "post" | "patch" | "put" | "delete",
  path: string,
  body?: unknown,
  key?: string,
  origin?: string,
): Promise<{ status: number; data: unknown }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Origin": origin ?? APP_ORIGIN,
    "X-CSRF-Token": tokens.csrfToken,
  };
  if (key) {
    headers["Idempotency-Key"] = key;
  }
  const response = await (context.request as APIRequestContext)[method](path, {
    data: body,
    headers,
  });
  const json = (await response.json()) as { data?: unknown };
  return { data: json.data, status: response.status() };
}

async function getData(
  context: BrowserContext,
  path: string,
): Promise<{ data: unknown; status: number }> {
  const response = await context.request.get(path);
  const json = (await response.json()) as { data?: unknown };
  return { data: json.data, status: response.status() };
}

function signedCallback(
  authority: string,
  amountToman: number,
): string {
  const secret = process.env.TOKEN_HASH_SECRET!;
  return createHmac("sha256", secret)
    .update(`${authority}:${amountToman}`)
    .digest("hex");
}

async function createSearch(
  context: BrowserContext,
  tokens: SeededTokens,
  consumerLandId: string,
): Promise<{ searchId: string }> {
  const { data, status } = await mutation(
    context,
    tokens,
    "post",
    "/api/app/v1/service-searches",
    {
      consumerNote: "آزمون جریان حیاتی",
      dates: [tomorrow()],
      landId: consumerLandId,
      serviceId: "plant-wheat",
    },
    idempotencyKey("e2e-search"),
  );
  expect(status).toBe(201);
  return data as { searchId: string };
}

test.describe.serial("critical business flows (E2E)", () => {
  let consumerContext: BrowserContext;
  let consumerTokens: SeededTokens;
  let providerContexts: BrowserContext[];
  let providerTokens: SeededTokens[];
  let adminContext: BrowserContext;
  let adminTokens: SeededTokens;
  let consumerLandId: string;

  test.beforeAll(async ({ browser }) => {
    await cleanupUsers([CONSUMER_PHONE, ADMIN_PHONE, PURCHASER_PHONE, ...PROVIDER_PHONES]);

    consumerContext = await browser.newContext();
    providerContexts = [];
    providerTokens = [];
    for (const phone of PROVIDER_PHONES) {
      providerContexts.push(await browser.newContext());
    }
    adminContext = await browser.newContext();

    const seeded = await seedAppSession({
      context: consumerContext,
      phone: CONSUMER_PHONE,
      land: {
        areaSquareMeters: "5000",
        latitude: LAND_LAT,
        longitude: LAND_LNG,
        title: "زمین آزمایش E2E",
      },
    });
    consumerTokens = seeded;

    for (const [index, phone] of PROVIDER_PHONES.entries()) {
      providerTokens.push(
        await seedEligibleProvider({
          context: providerContexts[index]!,
          name: `خدمات‌دهنده ${index + 1}`,
          phone,
          priceToman: 500_000 + index * 100_000,
          serviceSlug: "plant-wheat",
          workLatitude: LAND_LAT,
          workLongitude: LAND_LNG,
        }),
      );
    }

    adminTokens = await seedAdminSession({
      context: adminContext,
      phone: ADMIN_PHONE,
    });
  });

  test.afterAll(async () => {
    await Promise.all([
      ...providerContexts.map((context) => context.close()),
      consumerContext?.close(),
      adminContext?.close(),
    ]);
    await cleanupUsers([CONSUMER_PHONE, ADMIN_PHONE, PURCHASER_PHONE, ...PROVIDER_PHONES]);
  });

  test("UI: authenticated consumer sees the land and search page renders", async () => {
    await consumerContext.newPage();
    const page = (await consumerContext.pages())[0]!;
    await page.goto("/users/lands");
    await expect(page.getByText("زمین آزمایش E2E")).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/users/search");
    await expect(page.getByRole("heading", { name: "جستجوی خدمات" })).toBeVisible();
    await expect(page.getByRole("button", { name: /مشاهده خدمات‌دهندگان/ })).toBeVisible();
  });

  test("search returns the eligible providers and a request is created", async () => {
    const { data: landsData } = await getData(
      consumerContext,
      "/api/app/v1/lands",
    );
    const lands = (landsData as { lands: Array<{ id: string; title: string }> }).lands;
    consumerLandId = lands.find((land) => land.title === "زمین آزمایش E2E")!.id;
    expect(consumerLandId).toBeTruthy();

    const search = await createSearch(consumerContext, consumerTokens, consumerLandId);

    const { data: providersData } = await getData(
      consumerContext,
      `/api/app/v1/service-searches/${search.searchId}/providers?limit=10`,
    );
    const providers = (
      providersData as { items: Array<{ providerId: string }> }
    ).items;
    expect(providers).toHaveLength(3);

    const { data, status } = await mutation(
      consumerContext,
      consumerTokens,
      "post",
      "/api/app/v1/service-requests",
      {
        providerIds: providers.map((provider) => provider.providerId),
        searchId: search.searchId,
      },
      idempotencyKey("e2e-request"),
    );
    expect(status).toBe(201);
    const requestId = (data as { requestId: string }).requestId;
    expect(requestId).toBeTruthy();
  });

  test("provider accepts the request and the consumer completes it", async () => {
    const { data } = await getData(
      consumerContext,
      "/api/app/v1/consumer/requests?status=pending_provider",
    );
    const requests = (
      data as { items: Array<{ id: string; status: string }> }
    ).items;
    expect(requests.length).toBeGreaterThan(0);
    const requestId = requests[0]!.id;

    const providerOne = providerContexts[0]!;
    const { data: inboxData } = await getData(
      providerOne,
      "/api/app/v1/provider/requests?status=pending_provider",
    );
    const inbox = (inboxData as { items: Array<{ id: string }> }).items;
    expect(inbox.map((item) => item.id)).toContain(requestId);

    const accept = await mutation(
      providerOne,
      providerTokens[0]!,
      "post",
      `/api/app/v1/provider/requests/${requestId}/accept`,
      {},
    );
    expect(accept.status).toBe(200);
    expect((accept.data as { status: string }).status).toBe("in_progress");

    const complete = await mutation(
      consumerContext,
      consumerTokens,
      "post",
      `/api/app/v1/consumer/requests/${requestId}/complete`,
      {},
    );
    expect(complete.status).toBe(200);
    expect((complete.data as { status: string }).status).toBe("completed");
  });

  test("a provider can reject a pending request", async () => {
    const search = await createSearch(consumerContext, consumerTokens, consumerLandId);

    const { data: providersData } = await getData(
      consumerContext,
      `/api/app/v1/service-searches/${search.searchId}/providers?limit=10`,
    );
    const providers = (providersData as { items: Array<{ providerId: string }> }).items;
    const targetProvider = providers[1]!;

    const { data: created } = await mutation(
      consumerContext,
      consumerTokens,
      "post",
      "/api/app/v1/service-requests",
      { providerIds: [targetProvider.providerId], searchId: search.searchId },
      idempotencyKey("e2e-reject"),
    );
    const requestId = (created as { requestId: string }).requestId;

    const providerTwo = providerContexts[1]!;
    const { data: inboxData } = await getData(
      providerTwo,
      `/api/app/v1/provider/requests?status=pending_provider&limit=100`,
    );
    const inbox = (inboxData as { items: Array<{ id: string }> }).items;
    expect(inbox.map((item) => item.id)).toContain(requestId);

    const rejected = await mutation(
      providerTwo,
      providerTokens[1]!,
      "post",
      `/api/app/v1/provider/requests/${requestId}/reject`,
      { reason: "ظرفیت کامل است" },
    );
    expect(rejected.status).toBe(200);
    expect((rejected.data as { status: string }).status).toBe("rejected");
  });

  test("consumer can cancel a pending request", async () => {
    const search = await createSearch(consumerContext, consumerTokens, consumerLandId);

    const { data: providersData } = await getData(
      consumerContext,
      `/api/app/v1/service-searches/${search.searchId}/providers?limit=10`,
    );
    const providers = (providersData as { items: Array<{ providerId: string }> }).items;
    const targetProvider = providers[2]!;

    const { data: created } = await mutation(
      consumerContext,
      consumerTokens,
      "post",
      "/api/app/v1/service-requests",
      { providerIds: [targetProvider.providerId], searchId: search.searchId },
      idempotencyKey("e2e-cancel"),
    );
    const requestId = (created as { requestId: string }).requestId;

    const cancelled = await mutation(
      consumerContext,
      consumerTokens,
      "post",
      `/api/app/v1/consumer/requests/${requestId}/cancel`,
      {},
    );
    expect(cancelled.status).toBe(200);
    expect((cancelled.data as { status: string }).status).toBe("cancelled");
  });

  test("provider subscription purchase + signed gateway callback activates it", async ({
    browser,
  }) => {
    const purchaserContext = await browser.newContext();
    const purchaserTokens = await seedProviderForPurchase({
      context: purchaserContext,
      name: "خریدار اشتراک",
      phone: PURCHASER_PHONE,
      serviceSlug: "plant-wheat",
      workLatitude: LAND_LAT,
      workLongitude: LAND_LNG,
    });

    try {
      const { data, status } = await mutation(
        purchaserContext,
        purchaserTokens,
        "post",
        "/api/app/v1/provider/subscriptions/purchase",
        { planCode: "basic-monthly" },
        idempotencyKey("e2e-purchase"),
      );
      expect(status).toBe(201);
      const purchase = data as {
        authority: string;
        paymentId: string;
        redirectUrl: string;
        subscriptionId: string;
      };
      expect(purchase.authority).toMatch(/^mock_/);
      expect(purchase.paymentId).toBeTruthy();

      const callbackResult = await mutation(
        purchaserContext,
        purchaserTokens,
        "post",
        "/api/app/v1/payment-gateways/mock/callback",
        {
          amountToman: 299_000,
          authority: purchase.authority,
          signature: signedCallback(purchase.authority, 299_000),
        },
      );
      expect(callbackResult.status).toBe(200);
      expect((callbackResult.data as { status: string }).status).toBe("paid");

      const { data: subscriptionData } = await getData(
        purchaserContext,
        "/api/app/v1/provider/subscription",
      );
      const subscription = (
        subscriptionData as { subscription: { status: string } | null }
      ).subscription;
      expect(subscription).not.toBeNull();
      expect(subscription!.status).toBe("active");
    } finally {
      await purchaserContext.close();
    }
  });

  test("admin refunds the paid payment and the audit trail records it", async () => {
    const { data: paymentsData } = await getData(
      adminContext,
      "/api/admins/v1/payments?status=paid&limit=5",
    );
    const payments = (paymentsData as { payments: Array<{ paymentId: string; amountToman: number }> }).payments;
    expect(payments.length).toBeGreaterThan(0);
    const payment = payments[0]!;

    const refunded = await mutation(
      adminContext,
      adminTokens,
      "post",
      `/api/admins/v1/payments/${payment.paymentId}/refunds`,
      { amountToman: payment.amountToman, reason: "بازگشت وجه آزمایش E2E" },
      idempotencyKey("e2e-refund"),
      ADMIN_ORIGIN,
    );
    expect(refunded.status).toBe(201);

    const { data: auditData } = await getData(
      adminContext,
      "/api/admins/v1/audit-logs?module=payments&limit=10",
    );
    const auditItems = (auditData as { items: Array<{ action: string }> }).items;
    expect(auditItems.some((item) => item.action === "payment_refund")).toBe(true);
  });
});
