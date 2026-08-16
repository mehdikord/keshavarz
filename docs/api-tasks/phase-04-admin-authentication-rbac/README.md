# فاز ۰۴ — احراز هویت مدیران و RBAC

> **هدف:** ورود رمزدار مدیران و مجوزدهی deny-by-default.  
> **وابستگی:** فاز ۰۲  
> **جداول:** `admins`, `admin_sessions`, `admin_roles`, `admin_permissions`, assignmentها، overrideها و audit

## مراحل

### ۰۴.۰۱ — login مدیر

- [x] `POST /api/admins/v1/auth/login`
- [x] موبایل normalize و query فقط admin فعال/حذف‌نشده
- [x] verify رمز با Argon2id
- [x] failed attempts و `locked_until` به‌صورت atomic
- [x] generic error و rate limit سخت‌گیرانه
- [x] ساخت admin session و ثبت last login

### ۰۴.۰۲ — session و حساب جاری

- [x] refresh/logout/logout-all مستقل از user session
- [x] `GET/PATCH /me`
- [x] تغییر رمز با current password و revoke سایر نشست‌ها
- [x] جلوگیری از استفاده session بعد از inactive شدن admin

### ۰۴.۰۳ — permission evaluator

- [x] super-admin bypass محدود و auditشده
- [x] deny override فعال مقدم بر همه allowها
- [x] allow override فعال
- [x] role assignment غیرمنقضی + role/permission فعال
- [x] cache کوتاه با invalidation در تغییر نقش/override

### ۰۴.۰۴ — audit middleware

- [x] ثبت actor، permission، route، method، subject و نتیجه
- [x] old/new values redacted
- [x] ثبت denied actionهای حساس
- [x] audit مستقل از response موفق، بدون شکستن transaction اصلی

## تست‌های امنیتی

- [x] password enumeration و timing
- [x] lockout و unlock زمانی
- [x] role expired و override expired
- [x] deny override بر role allow
- [x] admin A نتواند بدون Permission admin B را تغییر دهد
- [x] self-deactivation و حذف آخرین super-admin مسدود شود

## معیار پذیرش

- [x] هیچ route مدیریتی بدون permission صریح قابل دسترسی نیست.
- [x] login مدیر هیچ OTP ارسال نمی‌کند.
- [x] تغییر credential/role بلافاصله روی نشست و cache اثر می‌گذارد.
- [x] عملیات حساس audit قابل جستجو تولید می‌کنند.

## گزارش تکمیل

- **وضعیت:** تکمیل‌شده در 2026-08-04
- Login مدیر با normalize موبایل، Argon2id، rate limit چندلایه، خطای عمومی، lockout پیش‌رونده و session مستقل از کاربر اپ پیاده‌سازی شد.
- refresh/logout/logout-all، پروفایل جاری و change-password با revoke سایر نشست‌ها و audit اضافه شد.
- permission evaluator با ترتیب deny → allow override → role، cache ۳۰ ثانیه‌ای و invalidation، به‌همراه guardهای self-deactivation و last super-admin آماده شد.
- audit با redaction و ثبت permission_denied / super_admin_bypass بدون شکست مسیر اصلی فعال است.
