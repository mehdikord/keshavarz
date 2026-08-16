# فاز ۱۲ — اشتراک، پرداخت، اعلان و گزارش اپ

> **هدف:** تکمیل اتصال صفحات مالی/اعلان/گزارش اپ به API واقعی.  
> **خط:** B  
> **وابستگی:** فاز ۱۱

## مراحل

### ۱۲.۰۱ — Subscription plans & purchase

- [x] `/providers/subscription` از `/subscription/plans` و `/provider/subscription*`
- [x] خرید: `POST /provider/subscriptions/purchase`
- [x] تاریخچه اشتراک‌ها
- [x] حذف `SUBSCRIPTION_PLANS` mock از مسیر runtime

### ۱۲.۰۲ — Payments

- [x] لیست/جزئیات پرداخت کاربر
- [x] verify بازگشت: `POST /payments/{id}/verify`
- [x] هماهنگی با callback gateway موجود (`/payment-gateways/{gateway}/callback`)
- [x] در dev می‌توان gateway `mock` سرور باقی بماند؛ UI نباید payment را محلی invent کند

### ۱۲.۰۳ — Notifications

- [x] جایگزینی `notification-store` mock با `/notifications*`
- [x] unread count، mark read، read-all
- [x] هم‌خوانی با اعلان‌های ایجادشده از چرخه درخواست واقعی

### ۱۲.۰۴ — Reports

- [x] Consumer: financial-summary + monthly-costs
- [x] Provider: financial-summary + monthly-revenue
- [x] نمودارها فقط از سری زمانی API

### ۱۲.۰۵ — پایداری UX

- [x] empty/loading/error در صفحات مالی
- [x] فرمت تومان و تاریخ شمسی یکدست
- [x] خطاهای پرداخت قابل فهم برای کاربر نهایی

## معیار پذیرش

- [x] خرید اشتراک تستی به پرداخت و فعال‌سازی (طبق جریان سرور) منجر می‌شود.
- [x] گزارش‌ها اعداد DB را نشان می‌دهند نه seed محلی.
- [x] اعلان‌های واقعی در UI دیده و خوانده می‌شوند.
- [x] ادمین همان پرداخت/اشتراک را در فاز ۰۷ می‌بیند.

## گام بعدی

[فاز ۱۳ — بازنشستگی Mock، QA و انتشار](../phase-13-mock-retirement-qa-release/)
