# فاز ۰۶ — مدیریت درخواست‌های خدمت

> **هدف:** دید کامل و مداخله کنترل‌شده روی چرخه Service Request بدون شکستن history.  
> **خط:** A  
> **وابستگی:** فاز ۰۲  
> **مرجع دامنه:** `docs/api-tasks/phase-08-request-lifecycle`  
> **وضعیت:** انجام‌شده

## مراحل

### ۰۶.۰۱ — Requests list

- [x] `GET /service-requests` با فیلتر status و سایر queryهای schema
- [x] ستون‌ها: public_id، وضعیت، خدمت، consumer، provider پذیرفته‌شده، تاریخ‌ها، مبلغ/متا در صورت وجود
- [x] Filter drawer حرفه‌ای + URL sync + cursor pagination

### ۰۶.۰۲ — Request detail

- [x] `GET /service-requests/{requestId}`
- [x] نمایش snapshot زمین/خدمت (immutable)
- [x] لیست provider linkها و وضعیت هرکدام
- [x] تب تاریخچه: `GET .../histories`

### ۰۶.۰۳ — Admin interventions

- [x] cancel مدیریتی با reason و permission `requests.cancel`
- [x] remove provider link با `requests.manage` و تأیید
- [x] عدم ارائه UI برای «ویرایش تاریخچه» یا دستکاری وضعیت خارج از API

### ۰۶.۰۴ — UX عملیاتی

- [x] deep-link از داشبورد به فیلتر status خاص
- [x] badge رنگی وضعیت‌ها یکدست با اپ
- [x] کپی شناسه درخواست

## معیار پذیرش

- [x] اپراتور می‌تواند درخواست را پیدا، جزئیات و تاریخچه را ببیند.
- [x] cancel/remove فقط با مجوز و confirmation کار می‌کند.
- [x] تاریخچه append-only در UI رعایت می‌شود.
- [x] لیست روی دیتای زیاد با cursor پایدار است.

## فایل‌های کلیدی

- `next/src/lib/api/admin-requests.ts`
- `next/src/components/admin-panel/requests/*`
- `next/src/app/admins/(console)/service-requests/**`
- deep-link داشبورد: `/admins/service-requests?status=pending_provider`

## گام بعدی

[فاز ۰۷ — اشتراک و پرداخت](../phase-07-subscriptions-payments/)
