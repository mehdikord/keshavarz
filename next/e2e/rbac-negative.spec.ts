import { expect, test } from "@playwright/test";

/**
 * Negative RBAC check via UI + API:
 * anonymous visitor must not see admin/app protected data.
 * Full permission matrix remains covered by server permission-evaluator tests.
 */
test.describe("admin RBAC negative paths", () => {
  test("anonymous visitor cannot open admin console", async ({ page }) => {
    await page.goto("/admins/users");
    await expect(page).toHaveURL(/\/admins\/login/, { timeout: 15_000 });
  });

  test("admin API users list rejects missing session with 401", async ({
    request,
  }) => {
    const response = await request.get("/api/admins/v1/users?limit=20");
    expect([401, 403]).toContain(response.status());
  });

  test("admin API refunds rejects missing session", async ({ request }) => {
    const response = await request.get("/api/admins/v1/refunds?limit=20");
    expect([401, 403]).toContain(response.status());
  });

  test("admin API provider approve rejects missing session", async ({
    request,
  }) => {
    const response = await request.post(
      "/api/admins/v1/providers/01INVALIDPROVIDERID000000/approve",
      { data: {} },
    );
    expect([401, 403, 404]).toContain(response.status());
    expect(response.status()).not.toBe(200);
  });

  test("app payments reject missing session", async ({ request }) => {
    const response = await request.get("/api/app/v1/payments?limit=20");
    expect([401, 403]).toContain(response.status());
  });

  test("app provider subscription purchase rejects missing session", async ({
    request,
  }) => {
    const response = await request.post(
      "/api/app/v1/provider/subscriptions/purchase",
      {
        data: { planCode: "basic-monthly" },
        headers: { "Idempotency-Key": "e2e-rbac-purchase-key-001" },
      },
    );
    expect([401, 403]).toContain(response.status());
  });
});
