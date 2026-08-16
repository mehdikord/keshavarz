# فاز ۱۳ — بازنشستگی Mock، QA، Performance و انتشار

> **هدف:** بستن پروژه Frontend Real با حذف Mock، تضمین کیفیت، و آمادگی انتشار.  
> **خط:** A + B  
> **وابستگی:** فاز ۰۹ + ۱۲

## مراحل

### ۱۳.۰۱ — حذف Mock از production paths

- [x] حذف/انتقال `next/src/lib/mock/**` از imports اپ
- [x] پاکسازی stores از seed و persist دامنه
- [x] حذف `MOCK_OTP` از مسیرهای غیرتست
- [x] اسکریپت یا چک CI برای ممنوعیت import `@/lib/mock` در `app/`, `components/`, `hooks/`, `stores/`, `lib/`
- [x] انتقال fixture لازم به پوشه تست (`src/test/fixtures`)

### ۱۳.۰۲ — Performance ادمین

- [x] بازبینی تمام لیست‌های ادمین برای cursor-only
- [x] تست دستی/اسکریپتی با حجم بالای داده (seed بزرگ یا generator) — راهنما در release-runbook
- [x] حذف N+1 فراخوانی در صفحات detail
- [x] بودجه عملکرد [`pagination-filtering-standard.md`](../pagination-filtering-standard.md)

### ۱۳.۰۳ — QA کارکردی

- [x] E2E ادمین smoke: login → dashboard → users (+ فیلتر URL) → providers/payments/requests surfaces
- [x] E2E اپ smoke: validation OTP UI، route guard، سطوح کلیدی
- [x] تست RBAC منفی (401/403 بدون session) برای چند endpoint
- [x] تست RTL و صفحات کلیدی موبایل/دسکتاپ
- [x] هم‌راستایی با `docs/Best Practices/Testing.md` (هرم: Vitest integration + Playwright smoke)
- [x] چرخه کامل دامنه (land → search → request → accept → complete / approve / refund) در integration سرور + smoke دستی؛ Playwright عمداً روی guard/smoke UI متمرکز است

### ۱۳.۰۴ — امنیتی Frontend

- [x] عدم نمایش internal id / hash / raw debug
- [x] بررسی XSS در رندر پیام‌ها و audit
- [x] اطمینان از HttpOnly cookie و عدم ذخیره token در localStorage
- [x] route guard ادمین و اپ

### ۱۳.۰۵ — مستند انتشار

- [x] envهای لازم Frontend/Backend
- [x] حساب seed ادمین و چگونگی چرخش رمز
- [x] checklist smoke بعد از deploy
- [x] لینک به OpenAPI و runbookهای `docs/api-tasks`

### ۱۳.۰۶ — Polish نهایی UX ادمین

- [x] یکنواختی badgeها، empty states، Confirm dialogs
- [x] میانبرهای صفحه‌کلید ضروری (اختیاری — deferred)
- [x] بازبینی نهایی شباهت کیفیت به admin template حرفه‌ای بدون کپی برند

## معیار پذیرش نهایی

- [x] هیچ مسیر runtime به Mock وابسته نیست.
- [x] پنل ادمین کامل، فیلتردار، صفحه‌بندی‌شده و permission-aware است.
- [x] اپ Consumer/Provider روی دیتای واقعی کار می‌کند و با ادمین هم‌خوان است.
- [x] E2Eهای اصلی (smoke + RBAC + RTL) سبز هستند.
- [x] روی دیتای حجیم، لیست‌های ادمین قابل استفاده می‌مانند.
- [x] Definition of Done در [`README.md`](../README.md) تیک خورده است.

## خروجی‌های کلیدی این فاز

| مورد | مسیر |
|---|---|
| Mock ban | `next/scripts/validate-no-mock-imports.mjs` + ESLint `no-restricted-imports` |
| List perf guard | `next/scripts/validate-admin-list-perf.mjs` |
| Frontend security guard | `next/scripts/validate-frontend-security.mjs` |
| Playwright E2E | `next/e2e/*`, `next/playwright.config.ts` |
| Release runbook | [`release-runbook.md`](./release-runbook.md) |
| CI | `.github/workflows/frontend-checks.yml` |
| App constants (ex-mock) | `lib/maps/defaults.ts`, `lib/app/defaults.ts`, `lib/app/legacy-storage-keys.ts` |

## پس از اتمام

پروژه از حالت «Mock app + Real API» به «Real app + Real admin + Real API + Real DB» رسیده است. تغییرات بعدی فقط enhancement نسخه‌ای خواهند بود.
