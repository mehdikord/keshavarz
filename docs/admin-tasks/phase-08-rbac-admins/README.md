# فاز ۰۸ — مدیران و RBAC UI

> **هدف:** مدیریت امن مدیران، نقش‌ها، مجوزها و overrideها روی API موجود.  
> **خط:** A  
> **وابستگی:** فاز ۰۲  
> **حساسیت بسیار بالا:** دسترسی سیستم  
> **وضعیت:** انجام‌شده

## مراحل

### ۰۸.۰۱ — Admins

- [x] لیست مدیران با فیلتر وضعیت
- [x] ایجاد مدیر، ویرایش، تغییر status
- [x] reset password کنترل‌شده
- [x] محافظت UI از غیرفعال کردن آخرین super-admin در حد پیام‌های API

### ۰۸.۰۲ — Roles

- [x] CRUD نقش‌ها
- [x] صفحه تخصیص permissions به نقش (`PUT .../permissions`)
- [x] علامت‌گذاری system roles به‌صورت غیرقابل تخریب در UI

### ۰۸.۰۳ — Permission catalog

- [x] `GET /permissions` به‌صورت خواندنی گروه‌بندی‌شده بر اساس module
- [x] استفاده در فرم‌های نقش و override

### ۰۸.۰۴ — Assignments & overrides

- [x] `PUT /admins/{id}/roles`
- [x] `PUT /admins/{id}/permission-overrides` (allow/deny + expiry اگر API دارد)
- [x] پیش‌نمایش مجوزهای مؤثر در صورت امکان محاسبه client از payload `/me` یا detail

### ۰۸.۰۵ — Safety UX

- [x] تأییدهای چندمرحله‌ای برای تغییر نقش‌های حساس
- [x] عدم نمایش secret/hash
- [x] audit trail از طریق لینک به فاز ۰۹

## معیار پذیرش

- [x] می‌توان نقش ساخت، مجوز داد، به مدیر تخصیص داد و نتیجه را در منوی همان مدیر دید.
- [x] override allow/deny رفتار UI را پس از refresh عوض می‌کند.
- [x] عملیات خطرناک confirmation دارند.
- [x] کاربر فاقد `admins.manage` / `roles.manage` فقط مشاهده مجاز دارد.

## فایل‌های کلیدی

- `next/src/lib/api/admin-rbac.ts`
- `next/src/components/admin-panel/rbac/*`
- `GET /api/admins/v1/roles/{roleId}/permissions` (لازم برای بارگذاری وضعیت فعلی نقش)

## گام بعدی

[فاز ۰۹ — گزارش، تنظیمات، Audit، اعلان](../phase-09-reports-settings-audit/)
