import { expect, test } from "@playwright/test";

const adminPhone = process.env.ADMIN_SEED_PHONE?.trim();
const adminPassword = process.env.ADMIN_SEED_PASSWORD?.trim();

test.describe("admin console smoke", () => {
  test("login page is RTL and shows credentials form", async ({ page }) => {
    await page.goto("/admins/login");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("button", { name: /ورود/ })).toBeVisible();
  });

  test("authenticated admin reaches dashboard and key ops lists", async ({
    page,
  }) => {
    test.skip(
      !adminPhone || !adminPassword,
      "Set ADMIN_SEED_PHONE and ADMIN_SEED_PASSWORD to run authenticated admin E2E",
    );

    await page.goto("/admins/login");
    await page.getByLabel(/موبایل|شماره/).fill(adminPhone!);
    await page.getByLabel(/رمز|گذرواژه|password/i).fill(adminPassword!);
    await page.getByRole("button", { name: /ورود/ }).click();

    await expect(page).toHaveURL(/\/admins(\/)?$/, { timeout: 20_000 });

    await page.goto("/admins/users?q=09&limit=20");
    await expect(page).toHaveURL(/q=09/);
    await expect(page.getByText(/کاربران|Users/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: /فیلتر/ })).toBeVisible();

    await page.goto("/admins/providers");
    await expect(page.getByText(/خدمات‌دهنده|Providers|ارائه‌دهنده/i).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/admins/service-requests");
    await expect(page.getByText(/درخواست|Requests/i).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/admins/payments");
    await expect(page.getByText(/پرداخت|Payments/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
