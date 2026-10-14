import { expect, test } from "@playwright/test";

test.describe("app auth & shell smoke", () => {
  test("auth page validates Iranian mobile and stays RTL", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    const phone = page.getByLabel(/موبایل|شماره/);
    await phone.fill("123");
    await page.getByRole("button", { name: "دریافت کد" }).click();
    await expect(page.getByText(/موبایل معتبر نیست|معتبر نیست/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("unauthenticated users route redirects to auth", async ({ page }) => {
    await page.goto("/users/home");
    await expect(page).toHaveURL(/\/auth/, { timeout: 15_000 });
  });

  test("unauthenticated providers route redirects to auth", async ({ page }) => {
    await page.goto("/providers/home");
    await expect(page).toHaveURL(/\/auth/, { timeout: 15_000 });
  });

  test("unauthenticated lands and reports redirect to auth", async ({
    page,
  }) => {
    await page.goto("/users/lands");
    await expect(page).toHaveURL(/\/auth/, { timeout: 15_000 });

    await page.goto("/users/reports");
    await expect(page).toHaveURL(/\/auth/, { timeout: 15_000 });

    await page.goto("/providers/subscription");
    await expect(page).toHaveURL(/\/auth/, { timeout: 15_000 });
  });
});
