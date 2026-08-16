# فاز ۰۰ — معماری API و قراردادهای پایه

> **هدف:** تثبیت قراردادها پیش از نوشتن Prisma، Migration یا Route Handler.
> **وابستگی:** ندارد
> **خروجی:** ADRها، OpenAPI skeleton، conventions و threat model اولیه

## مراحل

### ۰۰.۰۱ — ADR معماری

- [x] انتخاب Next.js Route Handlers برای transport و Service layer برای business logic
- [x] تعیین ساختار `route -> schema -> service -> repository -> Prisma`
- [x] تثبیت دو root مستقل `app/api/app/v1` و `app/api/admins/v1`
- [x] منع import مستقیم Prisma در route و UI
- [x] تعیین naming: URL جمع، JSON camelCase و DB snake_case

### ۰۰.۰۲ — قرارداد HTTP

- [x] envelope موفق: `data`, `meta`, `requestId`
- [x] envelope خطا: `error.code`, `message`, `fields`, `requestId`
- [x] status codeهای 200/201/202/204/400/401/403/404/409/422/429/500
- [x] cursor pagination، filter، sort allow-list و max page size
- [x] قرارداد ETag/version برای منابع حساس و `Idempotency-Key` برای commandها

### ۰۰.۰۳ — قرارداد هویت

- [x] تفکیک user/admin session و cookie
- [x] تعریف session lifetime، idle timeout، refresh و revoke
- [x] تعریف OTP expiry، attempts، cooldown و rate limit
- [x] تعریف password policy، Argon2id، lockout و session revoke مدیر

### ۰۰.۰۴ — قرارداد داده

- [x] فقط `public_id` در DTOهای عمومی
- [x] زمان UTC و ISO 8601؛ تاریخ شمسی presentation-only
- [x] مبلغ integer تومان
- [x] Decimalهای مساحت/مختصات به‌صورت string یا serializer دقیق
- [x] سیاست snapshot برای Request و منع خواندن داده تاریخی از رکوردهای mutable

### ۰۰.۰۵ — OpenAPI skeleton

- [x] تعریف server، tagها، security schemes و error schemas
- [x] ایجاد tagهای `App Auth`, `Provider`, `Consumer`, `Admin Auth`, `Admin Management`
- [x] ثبت endpointهای `../endpoint-catalog.md`
- [x] تعیین naming برای operationId و generation client

## تحویل‌دادنی‌ها

```text
docs/adr/
docs/openapi/
next/src/server/contracts/
```

## معیار پذیرش

- [x] هیچ ابهامی در base URL، نسخه، auth یا error format باقی نمانده است.
- [x] API اپ و مدیریت credential مشترک ندارند.
- [x] تمام دامنه‌های PRD و جداول schema به tag/API domain نگاشت شده‌اند.
- [x] تیم Frontend می‌تواند با OpenAPI skeleton mock client بسازد.


## گزارش تکمیل

- **وضعیت:** تکمیل‌شده در 2026-08-03
- ADRهای معماری، HTTP، هویت، داده، OpenAPI و threat model در `docs/adr/` ثبت شدند.
- OpenAPI 3.1 شامل هر ۱۲۹ endpoint کاتالوگ در `docs/openapi/openapi.json` تولید شد.
- نگاشت هر ۳۱ جدول و ۲ View به domain مالک در `docs/openapi/domain-mapping.md` ثبت شد.
- قراردادهای مشترک و Zod schemaها در `next/src/server/contracts/` ایجاد شدند.
- generator و validator قطعی در `next/scripts/generate-openapi.mjs` و `next/scripts/validate-api-contracts.mjs` قرار گرفتند.
- فرمان‌های پذیرش: `pnpm generate:openapi`، `pnpm check:api-contracts`، TypeScript و ESLint.
