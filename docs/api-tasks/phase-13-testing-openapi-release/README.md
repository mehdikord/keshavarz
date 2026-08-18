# فاز ۱۳ — تست، OpenAPI و انتشار

> **هدف:** اثبات قرارداد، امنیت، مهاجرت و آمادگی release.  
> **وابستگی:** تمام فازها  
> **وضعیت:** ✅ تکمیل شده

## مراحل

### ۱۳.۰۱ — تست unit

- [x] validators و normalizerها
- [x] permission evaluator
- [x] state machine
- [x] distance و report calculations
- [x] serializers و contact privacy

### ۱۳.۰۲ — integration database

- [x] اجرای MySQL واقعی با همه migrationها
- [x] repositories و constraints
- [x] transaction rollback و deadlock retry
- [x] OTP/session expiry
- [x] payment و notification idempotency

### ۱۳.۰۳ — API contract

- [x] تست تمام endpointها مقابل OpenAPI
- [x] response schema و error code
- [x] auth/permission/ownership matrix
- [x] pagination/filter/sort
- [x] backward compatibility v1

### ۱۳.۰۴ — E2Eهای حیاتی

- [x] OTP → profile → land → search
- [x] ارسال به چند Provider → قبول یکی → حذف سایرین
- [x] رد Provider
- [x] لغو pending و in-progress
- [x] پایان فقط توسط Consumer
- [x] خرید اشتراک و callback
- [x] login مدیر → moderation/RBAC/refund/audit

### ۱۳.۰۵ — تست امنیت و بار

- [x] IDOR همه routeهای resource
- [x] brute force OTP/admin login
- [x] CSRF/session replay
- [x] privilege escalation RBAC
- [x] load search، inbox و dashboard
- [x] race accept/payment callback

### ۱۳.۰۶ — release pipeline

- [x] backup و restore verification
- [x] `prisma migrate deploy` پیش از rollout کد سازگار
- [x] smoke test health/auth/read-only
- [x] progressive rollout و rollback criteria
- [x] migration status و drift check
- [x] post-deploy reconciliation

## گیت نهایی

- [x] OpenAPI کامل و versioned است.
- [x] صفر تست P0 شکست‌خورده وجود دارد.
- [x] migration از نسخه reference ساخته شده و قابل replay است.
- [x] release:check تمام gateها را عبور می‌دهد.
