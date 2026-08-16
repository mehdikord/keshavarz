# فاز ۰۳ — Dashboard و Ops

> **هدف:** صفحه خانه عملیاتی ادمین با KPI واقعی و دسترسی سریع به صف‌های مهم.  
> **خط:** A  
> **وابستگی:** فاز ۰۲  
> **API:** `GET /dashboard`, `GET /metrics`

## مراحل

### ۰۳.۰۱ — Dashboard KPI

- [x] کارت‌های کاربران، Providerها، درخواست‌ها، درآمد اشتراک، failureها
- [x] date range و timezone مشخص (مطابق schema داشبورد)
- [x] نمودارهای سبک (lazy) برای روند در صورت وجود داده API
- [x] empty/loading حرفه‌ای؛ بدون کارت تزئینی بی‌داده

### ۰۳.۰۲ — Quick links عملیاتی

- [x] لینک به صف‌های پرترافیک: users، pending providers، open requests، failed payments
- [x] نمایش badge شمارنده فقط از داده واقعی

### ۰۳.۰۳ — Metrics / health

- [x] مصرف `GET /metrics` در نوار وضعیت یا بخش ops
- [x] `GET /health/authenticated` برای تشخیص نشست/سلامت

### ۰۳.۰۴ — آماده‌سازی Ops UI (کامل‌سازی در ۰۹/۱۳)

- [x] اسکلت منوی Jobs / Dead letters
- [x] تعیین اینکه replay از UI در این فاز یا فاز ۰۹ فعال شود → **فاز ۰۹**

## معیار پذیرش

- [x] با permission `dashboard.view` داده‌های واقعی دیده می‌شود.
- [x] بدون permission صفحه 403 دوستانه است.
- [x] تغییر بازه تاریخ (در صورت پشتیبانی) query را درست می‌زند و جدول/کارت‌ها را رفرش می‌کند.
- [x] هیچ aggregate سنگینی سمت client محاسبه نمی‌شود.

## فایل‌های خروجی

```text
next/src/lib/api/admin-dashboard.ts
next/src/components/admin-panel/dashboard/*
next/src/app/admins/(console)/page.tsx
next/src/app/admins/(console)/jobs/page.tsx
```

## گزارش تکمیل

- **وضعیت:** تکمیل‌شده
- داشبورد با KPI واقعی، preset بازه ۷/۳۰/۹۰ روز (URL-synced)، نمودار وضعیت درخواست‌ها (lazy recharts)، quick links و نوار Ops پیاده شد.
- Jobs فقط اسکلت است؛ replay در فاز ۰۹.

## گام بعدی

[فاز ۰۴ — Users/Providers](../phase-04-users-providers/)
