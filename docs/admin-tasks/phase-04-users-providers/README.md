# فاز ۰۴ — کاربران و Providerها

> **هدف:** مدیریت کامل کاربران و خدمات‌دهندگان با فیلتر حرفه‌ای، صفحه‌بندی cursor و جزئیات غنی.  
> **خط:** A  
> **وابستگی:** فاز ۰۲  
> **حساسیت:** moderation و تغییر وضعیت Provider  
> **وضعیت:** انجام‌شده

## مراحل

### ۰۴.۰۱ — Users list

- [x] `GET /users` با `q`, `isActive`, `cursor`, `limit`, sort
- [x] FilterBar + chips + URL sync
- [x] ستون‌ها: نام، موبایل masked/full بر اساس سیاست، وضعیت، آخرین ورود، createdAt
- [x] Cursor pagination طبق استاندارد

### ۰۴.۰۲ — User detail & moderation

- [x] `GET /users/{userId}`
- [x] `PATCH` فیلدهای مجاز
- [x] moderation actions: activate/deactivate/suspend/ban/unban/warning با reason
- [x] timeline `GET .../moderation-actions`
- [x] Confirm dialog برای اکشن‌های مخرب
- [x] نمایش پیام موفقیت و refresh جزئیات

### ۰۴.۰۳ — Providers list

- [x] `GET /providers` با فیلترهای schema
- [x] وضعیت تأیید / availability در جدول و فیلتر
- [x] جستجو و pagination

### ۰۴.۰۴ — Provider detail

- [x] تب‌ها: خلاصه، work area، services، subscription
- [x] approve / availability actions
- [x] `GET /providers/{id}/services` + patch قیمت/وضعیت خدمت
- [x] میانبر grant subscription (اجرا/تکمیل در فاز ۰۷ اگر فرم پیچیده است)

### ۰۴.۰۵ — Performance & UX

- [x] تست ذهنی/عملی با دیتای زیاد (limit و cursor)
- [x] کپی public_id
- [x] ممنوعیت نمایش id داخلی

## معیار پذیرش

- [x] اپراتور می‌تواند کاربر را پیدا، فیلتر، باز و moderate کند.
- [x] Provider قابل approve/availability و مشاهده خدمات است.
- [x] فیلترها بعد از refresh صفحه باقی می‌مانند.
- [x] لیست با داده‌های زیاد فقط صفحه جاری را می‌گیرد و کند نمی‌شود.
- [x] تمام اکشن‌ها permission-aware و audit-friendly (reason جایی که API می‌خواهد) هستند.

## فایل‌های کلیدی

- `next/src/lib/api/admin-users.ts`
- `next/src/lib/api/admin-providers.ts`
- `next/src/hooks/admin/use-admin-url-list-state.ts`
- `next/src/components/admin-panel/users/*`
- `next/src/components/admin-panel/providers/*`
- `next/src/app/admins/(console)/users/**`
- `next/src/app/admins/(console)/providers/**`

## گام بعدی

[فاز ۰۵ Catalog](../phase-05-catalog/) یا [فاز ۰۶ Requests](../phase-06-service-requests/)
