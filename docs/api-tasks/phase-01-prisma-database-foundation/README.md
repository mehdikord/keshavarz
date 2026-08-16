# فاز ۰۱ — زیرساخت Prisma و Migrationهای افزایشی

> **هدف:** تبدیل کنترل‌شده `docs/database.schema` به Prisma بدون اجرای API.  
> **وابستگی:** فاز ۰۰  
> **نکته:** Prisma migration history منبع اجرای DB است؛ فایل SQL طراحی، مرجع تطبیق باقی می‌ماند.

## مراحل

### ۰۱.۰۱ — نصب و پیکربندی

- [x] انتخاب و pin کردن نسخه سازگار Prisma ORM و Driver
- [x] افزودن `prisma/schema.prisma` و datasource MySQL
- [x] ساخت singleton `PrismaClient` سازگار با hot reload
- [x] تعریف `DATABASE_URL`, `DIRECT_DATABASE_URL` و الگوی env validation
- [x] جلوگیری از log شدن credential و query parameter حساس

### ۰۱.۰۲ — مدل‌سازی schema

- [x] نگاشت هر ۳۱ جدول به model با `@@map`
- [x] نگاشت ستون‌ها با `@map`
- [x] استفاده از `BigInt @db.UnsignedBigInt` برای PK/FK
- [x] نگاشت Decimal، DateTime(3)، JSON، Enum، soft delete و indexها
- [x] نگاشت relationها و referential actions مطابق SQL
- [x] تعیین راهکار raw SQL برای viewها، generated columnها و constraintهای خارج از توان DSL

### ۰۱.۰۳ — Migration اولیه

- [x] تولید migration اولیه به حالت `--create-only`
- [x] بازبینی و ویرایش SQL برای charset، collation، CHECK، generated column و view
- [x] اجرای migration روی دیتابیس خالی
- [x] مقایسه ساختار ساخته‌شده با `docs/database.schema`
- [x] ثبت seed جدا برای permissionها، role سیستم و داده پایه کاتالوگ

### ۰۱.۰۴ — Baseline

- [x] مسیر A: دیتابیس خالی با اجرای همه migrationها
- [x] مسیر B: دیتابیس از قبل ساخته‌شده با introspection و baseline resolve
- [x] ممنوعیت اجرای reset روی staging/production
- [x] تهیه backup و restore drill قبل از اولین deploy

### ۰۱.۰۵ — Workflow تغییرات آینده

- [x] هر تغییر در branch جدا و migration جدید
- [x] `migrate dev --create-only`، review SQL، test و سپس apply
- [x] production فقط `migrate deploy`
- [x] expand/contract برای rename، تغییر type و ستون اجباری
- [x] drift check در CI و منع edit migration اعمال‌شده

## اسناد لازم

- [خط‌مشی Migration افزایشی](./incremental-migration-policy.md)

## معیار پذیرش

- [x] دیتابیس خالی بدون خطا از صفر ساخته می‌شود.
- [x] تعداد جدول، view، index، FK و constraint با schema مرجع تطبیق دارد.
- [x] `BIGINT UNSIGNED` در تمام PK/FKها حفظ شده است.
- [x] generated columnهای single accepted/one active و viewها باقی مانده‌اند.
- [x] baseline روی clone دیتابیس موجود بدون حذف داده آزمایش شده است.

## گزارش تکمیل

- **وضعیت:** تکمیل‌شده در 2026-08-03
- Prisma ORM، Client و MariaDB adapter روی نسخه `7.9.1` و driver روی `3.5.3` pin شدند.
- migration اولیه روی دیتابیس خالی `keshavarz` اجرا و migration history ثبت شد.
- ساختار نهایی شامل ۳۱ جدول دامنه، ۲ View، ۶۱ FK، ۳۰ CHECK و ۱۴۲ index است.
- هر PK/FK دامنه `BIGINT UNSIGNED` است و هر دو stored generated column حفظ شدند.
- seed پایه شامل ۲۹ Permission، یک role سیستمی، ۴ دسته، ۱۳ خدمت، ۲ پلن و تنظیم عمومی است.
- اجرای دوم seed هیچ رکورد تکراری ایجاد نکرد.
- backup/restore drill و baseline resolve روی clone دارای sentinel data بدون حذف داده موفق بود.
- drift check نتیجه `No difference detected` دارد.
- راهنمای عملیاتی در [`baseline-runbook.md`](./baseline-runbook.md) و `next/prisma/README.md` ثبت شده است.
