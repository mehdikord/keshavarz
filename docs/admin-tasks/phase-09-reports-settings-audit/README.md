# فاز ۰۹ — گزارش، تنظیمات، Audit، اعلان و Ops

> **هدف:** تکمیل سطوح باقی‌مانده ادمین برای نظارت، پیکربندی و پشتیبانی.  
> **خط:** A  
> **وابستگی:** فاز ۰۳ + ۰۷ (+ ترجیحاً ۰۸)

## مراحل

### ۰۹.۰۱ — Reports

- [x] `/admins/reports/overview` ← `GET /reports/overview`
- [x] `/admins/reports/financial` ← `GET /reports/financial`
- [x] فیلتر بازه تاریخ/timezone
- [x] نمودار و جدول خلاصه؛ بدون محاسبه مالی invent شده در client

### ۰۹.۰۲ — Exports

- [x] `POST /exports` از صفحات دامنه با permission درست
- [x] پیگیری `GET /exports/{exportId}`
- [x] دانلود/نمایش وضعیت؛ احترام به محدودیت نگهداری فایل

### ۰۹.۰۳ — Settings

- [x] لیست settings گروه‌بندی‌شده
- [x] ویرایش `PUT /settings/{group}/{key}` با validation نوعی
- [x] تفکیک visually بین public allow-list و داخلی

### ۰۹.۰۴ — Audit logs

- [x] جدول با فیلتر actor/module/action/date
- [x] جزئیات یک log (read-only)
- [x] عدم ارائه ویرایش/حذف
- [x] redaction داده‌های حساس طبق API

### ۰۹.۰۵ — Admin notifications

- [x] ارسال اعلان مدیریتی
- [x] لیست اعلان‌های ارسال‌شده با pagination

### ۰۹.۰۶ — Jobs / Dead letters (در صورت نیاز عملیاتی)

- [x] صفحات لیست dead-letter payments/notifications
- [x] replay تکی/جمعی طبق API
- [x] `POST /jobs/run` با محافظت و تأیید

## معیار پذیرش

- [x] گزارش‌ها از API واقعی تغذیه می‌شوند.
- [x] settings قابل مشاهده/ویرایش مجوزدار است.
- [x] audit فقط خواندنی و فیلترپذیر است.
- [x] اعلان مدیریتی ارسال و در لیست دیده می‌شود.
- [x] خط A ادمین از نظر صفحات کاتالوگ کامل است (جز polish فاز ۱۳).

## گام بعدی

تکمیل موازی خط B در صورت ناتمام بودن؛ سپس [فاز ۱۳](../phase-13-mock-retirement-qa-release/)
