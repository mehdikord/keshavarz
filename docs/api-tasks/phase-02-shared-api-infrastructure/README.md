# فاز ۰۲ — زیرساخت مشترک API

> **هدف:** ایجاد هسته قابل استفاده برای هر دو API بدون پیاده‌سازی دامنه‌های محصول.  
> **وابستگی:** فاز ۰۱

## ساختار پیشنهادی

```text
next/src/
├── app/api/app/v1/
├── app/api/admins/v1/
└── server/
    ├── auth/
    ├── db/
    ├── errors/
    ├── http/
    ├── idempotency/
    ├── modules/
    ├── observability/
    ├── security/
    └── validation/
```

## مراحل

### ۰۲.۰۱ — لایه HTTP

- [x] wrapper استاندارد Route Handler
- [x] parsing امن JSON/query/params
- [x] response/error serializer
- [x] request ID و correlation
- [x] pagination و sort/filter parser

### ۰۲.۰۲ — لایه‌های دامنه

- [x] Route فقط auth context، input و response را مدیریت کند.
- [x] Service مالک transaction و rules باشد.
- [x] Repository مالک query و mapping Prisma باشد.
- [x] Mapper شناسه داخلی و داده حساس را حذف کند.
- [x] dependency cycle با boundary lint/test کنترل شود.

### ۰۲.۰۳ — Validation و خطا

- [x] schemaهای Zod جدا برای params/query/body/response
- [x] error codeهای پایدار مانند `AUTH_REQUIRED`, `FORBIDDEN`, `CONFLICT`
- [x] نگاشت Prisma known errors به 409/422 بدون افشای SQL
- [x] خطای field-level برای فرم‌ها
- [x] locale پاسخ بدون تغییر error code

### ۰۲.۰۴ — Primitiveهای امنیتی

- [x] cookie helperهای جدا برای app/admin
- [x] CSRF و Origin guard
- [x] rate limiter interface با storage production-ready
- [x] password/token/OTP hashing adapter
- [x] permission و ownership guard پایه

### ۰۲.۰۵ — Primitiveهای عملیاتی

- [x] transaction helper
- [x] idempotency service
- [x] clock abstraction برای تست expiry
- [x] SMS/payment/storage interface
- [x] logger ساختاریافته و redaction

## معیار پذیرش

- [x] یک endpoint نمونه public، user-protected و admin-protected قرارداد مشترک دارند.
- [x] routeها مستقیم Prisma را import نمی‌کنند.
- [x] خطاهای validation، auth، conflict و server قابل تست‌اند.
- [x] هیچ secret یا token در log نمونه دیده نمی‌شود.

## گزارش تکمیل

- **وضعیت:** تکمیل‌شده در 2026-08-03
- هسته HTTP، validation، error mapping، request correlation و pagination در `next/src/server/http/` ایجاد شد.
- guardهای مستقل app/admin، cookie، CSRF/Origin، hashing، permission و ownership در `next/src/server/auth/` و `next/src/server/security/` قرار گرفت.
- transaction، idempotency، rate limiting، clock، integration contract و structured logging به‌صورت مستقل و قابل تست پیاده‌سازی شد.
- endpoint عمومی سلامت و endpointهای نمونه محافظت‌شده app/admin با قرارداد یکسان و بدون import مستقیم Prisma در Route ساخته شدند.
- اتصال endpoint سلامت به دیتابیس واقعی MySQL با پاسخ `200` و guardهای بدون نشست با پاسخ استاندارد `401 AUTH_REQUIRED` بررسی شدند.
- فرمان‌های پذیرش شامل TypeScript، ESLint، Vitest، boundary check، OpenAPI validation، Prisma validation/status و build تولیدی پاس شدند.
