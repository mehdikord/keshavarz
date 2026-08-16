# فاز ۰۹ — اعلان‌ها و Delivery

> **هدف:** اعلان درون‌برنامه‌ای پایدار و آماده SMS/Push.  
> **وابستگی:** فاز ۰۸  
> **جداول:** `notifications`, `notification_deliveries`

## مراحل

### ۰۹.۰۱ — مدل رویداد

- [x] فهرست typeهای پایدار: request_new/accepted/rejected/cancelled/completed
- [x] subscription/payment/admin notification types
- [x] payload versioned و فاقد داده تماس حساس
- [x] template جدا از domain event

### ۰۹.۰۲ — API اپ

- [x] list cursor-paginated با filter read/unread
- [x] unread count
- [x] read یک اعلان با ownership
- [x] read-all تا timestamp برای جلوگیری از race
- [x] deep-link allow-list

### ۰۹.۰۳ — ارسال async

- [x] ثبت notification و delivery داخل transaction دامنه
- [x] worker کانال in-app/SMS/push
- [x] attempts، backoff، status و error redacted
- [x] idempotency هر channel
- [x] dead-letter و replay مدیریتی کنترل‌شده

### ۰۹.۰۴ — اعلان مدیریت

- [x] ارسال targeted به user/admin یا segment محدود
- [x] preview template
- [x] permission و audit
- [x] محدودیت batch و rate

## معیار پذیرش

- [x] failure ارسال، transaction اصلی Request را rollback نمی‌کند.
- [x] اعلان تکراری برای یک event/channel ساخته نمی‌شود.
- [x] ownership و privacy در list/read رعایت می‌شود.
- [x] retry و dead-letter قابل مشاهده هستند.
