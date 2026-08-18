# فاز ۱۲ — امنیت، Jobها و مشاهده‌پذیری

> **هدف:** آماده‌سازی production و عملیات روزمره.  
> **وابستگی:** فازهای ۰۳ تا ۱۱  
> **وضعیت:** ✅ تکمیل شده

## مراحل

### ۱۲.۰۱ — Security hardening

- [x] threat model برای auth، پرداخت، upload، RBAC و IDOR
- [x] CSRF، CORS، CSP و security headers
- [x] rate limit tierها برای OTP/login/search/mutation/admin
- [x] secret rotation و environment separation
- [x] dependency/SAST scan و log redaction

### ۱۲.۰۲ — Jobهای زمان‌بندی‌شده

- [x] expire OTP و session
- [x] expire subscription
- [x] reconcile payment/refund
- [x] retry notification delivery
- [x] expire role assignment/override cache
- [x] cleanup export/upload موقت

### ۱۲.۰۳ — Queue reliability

- [x] job idempotency و unique key
- [x] retry policy per error class
- [x] dead-letter و manual replay permissionدار
- [x] graceful shutdown و lease timeout

### ۱۲.۰۴ — Logging، metric و tracing

- [x] structured log با requestId و actor realm
- [x] latency/error/rate-limit/auth/payment metrics
- [x] trace برای transactionهای search/request/payment
- [x] dashboard و alert threshold
- [x] عدم استفاده از phone/token/body حساس در label/log

### ۱۲.۰۵ — Runbook رخداد

- [x] SMS outage
- [x] payment callback outage
- [x] migration failure
- [x] session compromise
- [x] privilege escalation suspicion
- [x] notification backlog

## معیار پذیرش

- [x] تمام Jobها idempotent و مانیتورشدنی‌اند.
- [x] alertهای auth abuse، payment mismatch و queue backlog آزمایش شده‌اند.
- [x] logها برای debug کافی و از نظر محرمانگی پاک هستند.
- [x] runbookها owner و اقدام بازگشت سرویس دارند.
