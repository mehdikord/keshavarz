import { expect, test } from "@playwright/test";

import { seedAppSession } from "./helpers/db";

test("probe lands page", async ({ browser }) => {
  const context = await browser.newContext();
  await seedAppSession({
    context,
    phone: "09999800099",
    land: {
      areaSquareMeters: "5000",
      latitude: "35.7000000",
      longitude: "51.4000000",
      title: "probe-land",
    },
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => {
    console.log("PAGEERROR:", error.message.slice(0, 300));
    console.log("PAGEERRORSTACK:", (error.stack || "").split("\n").slice(0, 4).join("\n"));
  });
  page.on("console", (message) => {
    console.log(`CONSOLE[${message.type()}]:`, message.text().slice(0, 250));
  });
  page.on("request", (request) => {
    console.log("REQ:", request.method(), request.url());
  });
  page.on("requestfailed", (request) => {
    console.log("REQFAIL:", request.method(), request.url(), request.failure()?.errorText);
  });
  const responses: string[] = [];
  page.on("response", (response) => {
    if (response.url().includes("/api/app/v1")) {
      responses.push(`${response.status()} ${response.url()}`);
    }
  });
  await page.goto("http://localhost:3000/users/lands");
  await page.waitForTimeout(15000);
  const manual = await page.evaluate(async () => {
    try {
      const response = await fetch("/api/app/v1/me", { credentials: "include" });
      const body = await response.text();
      return `MANUAL /me: ${response.status} ${body.slice(0, 120)}`;
    } catch (error) {
      return `MANUAL /me ERROR: ${String(error)}`;
    }
  });
  console.log(manual);
  console.log("RESPONSES:", responses.join("\n"));
  console.log("URL:", page.url());
  console.log("BODY:", (await page.locator("body").innerText()).slice(0, 400));
  await context.close();
});
