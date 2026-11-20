import { expect, test } from "@playwright/test";

test.describe("RTL & responsive key surfaces", () => {
  test("app auth remains usable on desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/auth");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByLabel(/موبایل|شماره/)).toBeVisible();
  });
});
