# فاز ۱۳ — تست، OpenAPI و انتشار

> **هدف:** اثبات قرارداد، امنیت، مهاجرت و آمادگی release.  
> **وابستگی:** تمام فازها

## مراحل

### ۱۳.۰۱ — تست unit

- [ ] validators و normalizerها
- [ ] permission evaluator
- [ ] state machine
- [ ] distance و report calculations
- [ ] serializers و contact privacy

### ۱۳.۰۲ — integration database

- [ ] اجرای MySQL واقعی با همه migrationها
- [ ] repositories و constraints
- [ ] transaction rollback و deadlock retry
- [ ] OTP/session expiry
- [ ] payment و notification idempotency

### ۱۳.۰۳ — API contract

- [ ] تست تمام endpointها مقابل OpenAPI
- [ ] response schema و error code
- [ ] auth/permission/ownership matrix
- [ ] pagination/filter/sort
- [ ] backward compatibility v1

### ۱۳.۰۴ — E2Eهای حیاتی

- [ ] OTP -> پروفایل -> زمین -> جستجو
- [ ] ارسال به چند Provider -> قبول یکی -> حذف سایرین
- [ ] رد Provider
- [ ] لغو pending و in-progress
- [ ] پایان فقط توسط Consumer
- [ ] خرید اشتراک و callback
- [ ] login مدیر -> moderation/RBAC/refund/audit

### ۱۳.۰۵ — تست امنیت و بار

- [ ] IDOR همه routeهای resource
- [ ] brute force OTP/admin login
- [ ] CSRF/session replay
- [ ] privilege escalation RBAC
- [ ] load search، inbox و dashboard
- [ ] race accept/payment callback

### ۱۳.۰۶ — release pipeline

- [ ] backup و restore verification
- [ ] `prisma migrate deploy` پیش از rollout کد سازگار
- [ ] smoke test health/auth/read-only
- [ ] progressive rollout و rollback criteria
- [ ] migration status و drift check
- [ ] post-deploy reconciliation

## گیت نهایی

- [ ] OpenAPI کامل و versioned است.
- [ ] صفر تست P0 شکست‌خورده وجود دارد.
- [ ] migration از نسخه قبلی روی snapshot داده پاس شده است.
- [ ] security checklist و performance budget تأیید شده‌اند.
- [ ] release و incident runbook در دسترس تیم عملیات است.
- [ ] پس از تأیید این فاز، API v1 آماده اتصال به UI است.
