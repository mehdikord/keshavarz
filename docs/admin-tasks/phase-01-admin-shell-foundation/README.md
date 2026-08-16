# فاز ۰۱ — Shell ادمین و Foundation UI

> **هدف:** اسکلت حرفه‌ای پنل ادمین (سطح Metronic) و کامپوننت‌های مشترک لیست/فیلتر، بدون وابستگی دامنه.  
> **خط:** A  
> **وابستگی:** فاز ۰۰  
> **مسیر پایه:** `next/src/app/admins/**` و `next/src/components/admin-panel/**`

## مراحل

### ۰۱.۰۱ — Routing و Layout

- [x] ایجاد route group ادمین تحت `/admins`
- [x] Layout با Sidebar + Topbar + Content
- [x] حالت collapsed sidebar با persist preference
- [x] Breadcrumb component
- [x] صفحات placeholder خالی برای دامنه‌های اصلی (تا فازهای بعد پر شوند)
- [x] جداسازی کامل از Mobile Shell اپ

### ۰۱.۰۲ — Design tokens و تم ادمین

- [x] CSS variables / Tailwind tokens مخصوص admin surfaces
- [x] Typography و spacing برای data-dense UI
- [x] نصب/استفاده کامپوننت‌های shadcn موردنیاز: Table, Sheet, Dialog, Dropdown, Tabs, Badge, Separator, Skeleton, ...

### ۰۱.۰۳ — AdminShell components

- [x] `AdminSidebar` با گروه‌بندی منو و آیکون
- [x] `AdminTopbar` (جستجوی سراسری stub، user menu stub)
- [x] `AdminPageHeader`
- [x] `AdminSectionCard` فقط وقتی برای تعامل لازم است

### ۰۱.۰۴ — Data toolkit مشترک

- [x] `AdminDataTable` (columns, density, empty/loading/error)
- [x] `AdminFilterBar` + `AdminFilterDrawer` + `FilterChips`
- [x] `AdminCursorPagination`
- [x] `AdminConfirmDialog` برای اکشن‌های مخرب
- [x] `AdminStatusBadge` برای statusهای دامنه
- [x] Utilities همگام‌سازی searchParams ↔ فیلتر

### ۰۱.۰۵ — کیفیت پایه

- [x] RTL درست در shell
- [x] `loading.tsx` / `error.tsx` سطح admins
- [x] Responsive قابل‌قبول برای tablet
- [x] عدم وابستگی به `lib/mock`

## فایل‌های خروجی

```text
next/src/app/admins/layout.tsx
next/src/app/admins/error.tsx
next/src/app/admins/login/page.tsx
next/src/app/admins/(console)/layout.tsx
next/src/app/admins/(console)/loading.tsx
next/src/app/admins/(console)/page.tsx
next/src/app/admins/(console)/demo/page.tsx
next/src/app/admins/(console)/**/page.tsx   # placeholders
next/src/components/admin-panel/**
next/src/lib/admin/search-params.ts
next/src/stores/admin-shell-store.ts
next/src/components/layout/root-chrome.tsx
```

## معیار پذیرش

- [x] با باز کردن `/admins` shell حرفه‌ای دیده می‌شود.
- [x] کامپوننت‌های جدول/فیلتر/صفحه‌بندی در `/admins/demo` قابل مشاهده‌اند.
- [x] منو ساختار نهایی دارد حتی اگر لینک‌ها هنوز داده واقعی نگیرند.
- [x] استانداردهای [`ux-design-principles.md`](../ux-design-principles.md) رعایت شده است.

## گزارش تکمیل

- **وضعیت:** تکمیل‌شده
- ادمین از Mobile Shell اپ جدا شد (`RootChrome`).
- Shell دسکتاپ‌محور با سایدبار جمع‌شو (persist)، Topbar، Breadcrumb و placeholderهای دامنه آماده است.
- Toolkit لیست/فیلتر/pagination/confirm بدون وابستگی به mock پیاده شد.
- صفحه دمو داخلی: `/admins/demo`

## گام بعدی

[فاز ۰۲ — Auth ادمین و API Client](../phase-02-admin-auth-api-client/)
