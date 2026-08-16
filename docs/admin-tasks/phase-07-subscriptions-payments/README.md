# فاز ۰۷ — اشتراک، پرداخت و Refund

> **هدف:** مدیریت مالی/اشتراک در ادمین با فیلتر کامل و اکشن‌های حساس امن.  
> **خط:** A  
> **وابستگی:** فاز ۰۲ (ترجیحاً بعد از ۰۴ برای deep-link به Provider)  
> **حساسیت بالا:** money movement  
> **وضعیت:** انجام‌شده

## مراحل

### ۰۷.۰۱ — Subscription plans

- [x] لیست/ایجاد/ویرایش/غیرفعال‌سازی پلن‌ها
- [x] نمایش قیمت تومان integer، مدت، features، recommended
- [x] فرم Zod هم‌راستا با schema ادمین

### ۰۷.۰۲ — Provider subscriptions

- [x] `GET /provider-subscriptions` با فیلتر status/plan
- [x] cancel subscription با تأیید
- [x] grant از صفحه Provider یا فرم مستقل (`subscriptions.grant`)

### ۰۷.۰۳ — Payments

- [x] جدول پرداخت‌ها با فیلترهای schema (status، ...)
- [x] جزئیات پرداخت
- [x] شروع refund با permission `payments.refund` + reason/amount طبق API
- [x] ممنوعیت optimistic success برای refund

### ۰۷.۰۴ — Refunds list

- [x] `GET /refunds` با pagination
- [x] پیوند به payment مربوط

### ۰۷.۰۵ — Export آماده‌سازی

- [x] ورود به جریان export (تکمیل در فاز ۰۹) از این صفحات با permissionهای export

## معیار پذیرش

- [x] پلن‌ها قابل مدیریت‌اند و در اپ پس از مهاجرت دیده می‌شوند.
- [x] grant/cancel subscription با RBAC درست کار می‌کند.
- [x] refund فقط با مجوز و تأیید صریح ثبت می‌شود.
- [x] مبالغ همیشه تومان صحیح و فرمت‌شده نمایش داده می‌شوند.
- [x] فیلتر + cursor روی payments پایدار است.

## فایل‌های کلیدی

- `next/src/lib/api/admin-subscriptions.ts`
- `next/src/lib/api/admin-payments.ts`
- `next/src/lib/api/admin-idempotency.ts`
- `next/src/components/admin-panel/subscriptions/*`
- `next/src/components/admin-panel/payments/*`
- grant در `admin-provider-detail-page.tsx`

## یادداشت

- فیلتر `plan` روی provider-subscriptions در schema API نیست؛ فیلتر `status` و `providerId` پیاده شد.
- Export کامل در فاز ۰۹؛ از صفحات پلن/پرداخت لینک به `/admins/exports` با `payments.export`.

## گام بعدی

[فاز ۰۸ RBAC](../phase-08-rbac-admins/) و/یا [فاز ۰۹ Reports/Settings/Audit](../phase-09-reports-settings-audit/)
