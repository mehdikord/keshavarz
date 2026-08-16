# Frontend Real — Release Runbook

> مربوط به [فاز ۱۳](./README.md). مرجع API: [`docs/api-tasks`](../../api-tasks/) و [`docs/openapi/openapi.json`](../../openapi/openapi.json).

## Envهای لازم

حداقل برای اجرای `next` + Prisma (مقادیر نمونهٔ local):

```bash
DATABASE_URL="mysql://user:pass@127.0.0.1:3306/keshavarz"
DIRECT_DATABASE_URL="mysql://user:pass@127.0.0.1:3306/keshavarz"

APP_ORIGIN="http://localhost:3000"
ADMIN_ORIGIN="http://localhost:3000"

TOKEN_HASH_SECRET="replace-with-32+-char-secret______________"
OTP_HASH_PEPPER="replace-with-32+-char-pepper_______________"

# Bootstrap admin (اختیاری ولی لازم برای login ادمین)
ADMIN_SEED_PHONE="09120000000"
ADMIN_SEED_PASSWORD="ChangeMeAdmin!99"
ADMIN_SEED_NAME="مدیر سیستم"

# Smoke / E2E
SMOKE_BASE_URL="http://127.0.0.1:3000"
PLAYWRIGHT_BASE_URL="http://127.0.0.1:3000"
```

سایر متغیرهای امنیتی/جاب مطابق `next/src/server/config/env.ts` و runbookهای `docs/api-tasks`.

## Seed ادمین و چرخش رمز

1. Envهای `ADMIN_SEED_*` را ست کنید.
2. `pnpm db:migrate:deploy && pnpm db:seed`
3. ورود از `/admins/login` با همان موبایل/رمز.
4. **چرخش رمز production:** بلافاصله بعد از اولین ورود از `/admins/me/change-password` رمز را عوض کنید؛ سپس `ADMIN_SEED_PASSWORD` را از envهای deploy حذف یا rotate کنید.
5. حساب‌های اضافه را فقط از پنل RBAC بسازید؛ seed فقط برای bootstrap است.

## چک‌لیست قبل از deploy

- [ ] `pnpm check:no-mock-imports`
- [ ] `pnpm check:admin-list-perf`
- [ ] `pnpm check:admin-load-budget`
- [ ] `pnpm check:frontend-security`
- [ ] `pnpm check:api-boundaries`
- [ ] `pnpm test:api`
- [ ] `pnpm build`
- [ ] `pnpm release:check` (همان گاردها + smoke؛ با `RELEASE_E2E=1` شامل Playwright)
- [ ] migrations اعمال شده (`pnpm db:migrate:deploy`)
- [ ] seed/bootstrap فقط در محیط‌هایی که نیاز است

## Smoke بعد از deploy

```bash
SMOKE_BASE_URL="https://your-host" pnpm release:smoke
```

دستی:

1. `/api/app/v1/health` → OK
2. `/admins/login` → ورود مدیر
3. `/admins` dashboard KPI لود می‌شود
4. `/auth` درخواست OTP بدون خطای ۵۰۰
5. یک لیست پرترافیک (`/admins/users`) با فیلتر و Next cursor

## E2E

```bash
pnpm test:e2e:install   # optional if using bundled Chromium
# default uses system Google Chrome (PLAYWRIGHT_USE_SYSTEM_CHROME=0 to force bundled)
# سرور را بالا بیاورید، سپس:
RELEASE_E2E=1 ADMIN_SEED_PHONE=... ADMIN_SEED_PASSWORD=... pnpm test:e2e
```

پوشش Playwright:

- ادمین: login + dashboard + users (فیلتر URL) + بازدید providers/payments/requests
- اپ: validation موبایل، redirect گارد، سطوح auth RTL
- RBAC منفی: 401/403 بدون session + redirect login
- RTL موبایل/دسکتاپ

چرخه کامل Consumer/Provider (land → search → request → accept → complete) و مداخلهٔ ادمین (approve / refund / grant) در integration تست‌های سرور (`phase06`–`phase08`) و دستی روی DB واقعی تأیید می‌شود؛ Playwright روی UI guard/smoke متمرکز است.

## Performance لیست ادمین

- لیست‌های پرترافیک cursor-only هستند (گارد `check:admin-list-perf`).
- کاتالوگ (categories/services) استثنای حجم کوچک است.
- برای تست دستی دیتای حجیم: seed/generator سمت DB + اسکرول Next روی Users/Payments/Audit؛ UI نباید همه صفحات را پیش‌بارگذاری کند.
- بودجه ثابت: `pnpm check:admin-load-budget` (limit پیش‌فرض ۲۰، سقف ۱۰۰، TTFR P95 هدف <۱.۵s).

## لینک‌های مرتبط

- OpenAPI: [`docs/openapi/openapi.json`](../../openapi/openapi.json)
- Endpoint catalog: [`docs/api-tasks/endpoint-catalog.md`](../../api-tasks/endpoint-catalog.md)
- Pagination standard: [`../pagination-filtering-standard.md`](../pagination-filtering-standard.md)
- Prisma foundation: [`../../../next/prisma/README.md`](../../../next/prisma/README.md)
- Security baseline API: [`docs/api-tasks/security-baseline.md`](../../api-tasks/security-baseline.md)
