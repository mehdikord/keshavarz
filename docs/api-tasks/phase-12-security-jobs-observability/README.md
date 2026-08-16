# فاز ۱۲ — امنیت، Jobها و مشاهده‌پذیری

> **هدف:** آماده‌سازی production و عملیات روزمره.  
> **وابستگی:** فازهای ۰۳ تا ۱۱

## مراحل

### ۱۲.۰۱ — Security hardening

- [ ] threat model برای auth، پرداخت، upload، RBAC و IDOR
- [ ] CSRF، CORS، CSP و security headers
- [ ] rate limit tierها برای OTP/login/search/mutation/admin
- [ ] secret rotation و environment separation
- [ ] dependency/SAST scan و log redaction

### ۱۲.۰۲ — Jobهای زمان‌بندی‌شده

- [ ] expire OTP و session
- [ ] expire subscription
- [ ] reconcile payment/refund
- [ ] retry notification delivery
- [ ] expire role assignment/override cache
- [ ] cleanup export/upload موقت

### ۱۲.۰۳ — Queue reliability

- [ ] job idempotency و unique key
- [ ] retry policy per error class
- [ ] dead-letter و manual replay permissionدار
- [ ] graceful shutdown و lease timeout

### ۱۲.۰۴ — Logging، metric و tracing

- [ ] structured log با requestId و actor realm
- [ ] latency/error/rate-limit/auth/payment metrics
- [ ] trace برای transactionهای search/request/payment
- [ ] dashboard و alert threshold
- [ ] عدم استفاده از phone/token/body حساس در label/log

### ۱۲.۰۵ — Runbook رخداد

- [ ] SMS outage
- [ ] payment callback outage
- [ ] migration failure
- [ ] session compromise
- [ ] privilege escalation suspicion
- [ ] notification backlog

## معیار پذیرش

- [ ] تمام Jobها idempotent و مانیتورشدنی‌اند.
- [ ] alertهای auth abuse، payment mismatch و queue backlog آزمایش شده‌اند.
- [ ] logها برای debug کافی و از نظر محرمانگی پاک هستند.
- [ ] runbookها owner و اقدام بازگشت سرویس دارند.
