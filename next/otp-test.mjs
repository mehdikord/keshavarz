import { chromium } from "/home/cloner/Projects/keshavarz/next/node_modules/.pnpm/playwright-core@1.58.2/node_modules/playwright-core/index.mjs";

const browser = await chromium.launch({ executablePath: "/usr/share/code/chrome", headless: true });
const page = await browser.newPage();

// Listen for responses to the OTP request
page.on("response", async (response) => {
  if (response.url().includes("/api/app/v1/auth/otp/request")) {
    const body = await response.text();
    console.log("STATUS:", response.status());
    console.log("BODY:", body);
  }
});

page.on("console", (msg) => {
  console.log("CONSOLE:", msg.type(), msg.text());
});

page.on("request", (req) => {
  if (req.url().includes("/api/app/v1/auth/otp/request")) {
    console.log("REQUEST HEADERS:", JSON.stringify(req.headers()));
    console.log("REQUEST POST DATA:", req.postData());
  }
});

console.log("Loading page...");
await page.goto("http://localhost:3000/auth", { waitUntil: "networkidle" });
console.log("Page loaded");

await page.waitForTimeout(2000);

console.log("Page content snippet:", (await page.textContent("body")).slice(0, 200));

const phoneInput = page.locator("input#phone");
await phoneInput.waitFor({ timeout: 15000 });
console.log("Phone input found");
await phoneInput.fill("09123456789");
await page.click("button:has-text('دریافت کد')");

await page.waitForTimeout(3000);

await browser.close();
console.log("Done");