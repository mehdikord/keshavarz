import { createHmac } from "node:crypto";

import {
  expect,
  test,
  type APIRequestContext,
  type BrowserContext,
} from "@playwright/test";

import {
  cleanupUsers,
  seedAppSession,
  seedEligibleProvider,
  seedProviderForPurchase,
  type SeededTokens,
} from "./helpers/db";

const APP_ORIGIN =
  process.env.APP_ORIGIN ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

const CONSUMER_PHONE = "09999800001";
const PROVIDER_PHONES = ["09999800002", "09999800003", "09999800004"];
const PURCHASER_PHONE = "09999800006";
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
): Promise<{ status: number; data: unknown }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Origin": APP_ORIGIN,
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
): Promise<{ requestId: string }> {
  const { data, status } = await mutation(
    context,
    tokens,
    "post",
    "/api/app/v1/service-searches",
    {
      // Every test searches the same land + service; skip the duplicate warning.
      allowDuplicate: true,
      consumerNote: "آزمون جریان حیاتی",
      dates: [tomorrow()],
      landId: consumerLandId,
      serviceId: "plant-wheat",
    },
    idempotencyKey("e2e-search"),
  );
  expect(status).toBe(201);
  const result = data as { outcome: string; requestId: string; status: string };
  expect(result.outcome).toBe("created");
  expect(result.status).toBe("awaiting_send");
  return { requestId: result.requestId };
}

async function listCandidates(
  context: BrowserContext,
  requestId: string,
): Promise<Array<{ providerId: string; state: string }>> {
  const { data } = await getData(
    context,
    `/api/app/v1/service-requests/${requestId}/providers`,
  );
  return (data as { candidates: Array<{ providerId: string; state: string }> })
    .candidates;
}

async function sendTo(
  context: BrowserContext,
  tokens: SeededTokens,
  requestId: string,
  providerIds: string[],
  key: string,
) {
  const { data, status } = await mutation(
    context,
    tokens,
    "post",
    `/api/app/v1/service-requests/${requestId}/providers`,
    { providerIds },
    idempotencyKey(key),
  );
  expect(status).toBe(200);
  return data as { sent: Array<{ providerId: string }>; status: string };
}

test.describe.serial("critical business flows (E2E)", () => {
  let consumerContext: BrowserContext;
  let consumerTokens: SeededTokens;
  let providerContexts: BrowserContext[];
  let providerTokens: SeededTokens[];
  let consumerLandId: string;

  test.beforeAll(async ({ browser }) => {
    await cleanupUsers([CONSUMER_PHONE, PURCHASER_PHONE, ...PROVIDER_PHONES]);

    consumerContext = await browser.newContext();
    providerContexts = [];
    providerTokens = [];
    for (const phone of PROVIDER_PHONES) {
      providerContexts.push(await browser.newContext());
    }

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
  });

  test.afterAll(async () => {
    await Promise.all([
      ...providerContexts.map((context) => context.close()),
      consumerContext?.close(),
    ]);
    await cleanupUsers([CONSUMER_PHONE, PURCHASER_PHONE, ...PROVIDER_PHONES]);
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

    const { requestId } = await createSearch(consumerContext, consumerTokens, consumerLandId);

    const providers = await listCandidates(consumerContext, requestId);
    expect(providers).toHaveLength(3);
    expect(providers.every((provider) => provider.state === "available")).toBe(true);

    const sent = await sendTo(
      consumerContext,
      consumerTokens,
      requestId,
      providers.map((provider) => provider.providerId),
      "e2e-request",
    );
    expect(sent.sent).toHaveLength(3);
    expect(sent.status).toBe("pending_provider");
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

  test("UI: a provider who lost the race sees the 'taken' screen without request data", async () => {
    const { requestId } = await createSearch(consumerContext, consumerTokens, consumerLandId);
    const providers = await listCandidates(consumerContext, requestId);
    // Sent to every provider at once; the first one accepts.
    await sendTo(
      consumerContext,
      consumerTokens,
      requestId,
      providers.map((provider) => provider.providerId),
      "e2e-taken",
    );
    const accepted = await mutation(
      providerContexts[0]!,
      providerTokens[0]!,
      "post",
      `/api/app/v1/provider/requests/${requestId}/accept`,
      {},
    );
    expect(accepted.status).toBe(200);

    const loser = providerContexts[1]!;
    const detail = await loser.request.get(`/api/app/v1/provider/requests/${requestId}`);
    expect(detail.status()).toBe(409);
    expect((await detail.json()).error.code).toBe("REQUEST_ALREADY_ACCEPTED");

    const page = await loser.newPage();
    await page.goto(`/providers/requests/${requestId}`);
    await expect(
      page.getByRole("heading", { name: "این درخواست توسط خدمات‌دهنده دیگری قبول شد" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("دسترسی به این درخواست مجاز نیست")).toHaveCount(0);
    await expect(page.getByText("زمین آزمایش E2E")).toHaveCount(0);

    await page.getByRole("link", { name: "بازگشت به لیست درخواست‌ها" }).click();
    await expect(page).toHaveURL(/\/providers\/requests$/);
    await page.close();
  });

  test("a provider can reject a pending request", async () => {
    const { requestId } = await createSearch(consumerContext, consumerTokens, consumerLandId);

    const providers = await listCandidates(consumerContext, requestId);
    const targetProvider = providers[1]!;
    await sendTo(consumerContext, consumerTokens, requestId, [targetProvider.providerId], "e2e-reject");

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
    const { requestId } = await createSearch(consumerContext, consumerTokens, consumerLandId);

    const providers = await listCandidates(consumerContext, requestId);
    const targetProvider = providers[2]!;
    await sendTo(consumerContext, consumerTokens, requestId, [targetProvider.providerId], "e2e-cancel");

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
});
