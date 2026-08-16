# خط‌مشی Migration افزایشی Prisma

## اصل Laravel-style

هر تغییر دیتابیس یک migration مستقل، immutable و ترتیبی است. پوشه migration دارای timestamp و نام معنی‌دار است:

```text
prisma/migrations/
├── 20260803090000_create_core_identity_tables/
│   └── migration.sql
├── 20260803091000_create_admin_rbac_tables/
│   └── migration.sql
├── 20260803092000_create_catalog_provider_land_tables/
│   └── migration.sql
└── 20260803093000_create_request_notification_views/
    └── migration.sql
```

تقسیم دقیق migration اولیه می‌تواند در زمان فاز ۰۱ براساس محدودیت FK نهایی شود؛ اصل مهم این است که ترتیب deterministic و SQL هر مرحله قابل review باشد.

## workflow توسعه

1. ابتدا Prisma model تغییر می‌کند.
2. migration با نام عملیاتی و `--create-only` ساخته می‌شود.
3. SQL برای MySQL، lock، index، backfill و constraint بازبینی می‌شود.
4. migration روی snapshot واقعی داده staging آزمایش می‌شود.
5. تست سازگاری نسخه قدیم و جدید اپ اجرا می‌شود.
6. migration commit و دیگر immutable می‌شود.
7. production فقط با deploy command و backup معتبر به‌روزرسانی می‌شود.

## قوانین تغییر بدون آسیب به داده

### افزودن ستون nullable

- migration اول: ستون nullable و index لازم
- deploy کد dual-compatible
- backfill batch
- migration بعدی: `NOT NULL` و default در صورت نیاز

### تغییر نام ستون

- ستون جدید اضافه شود.
- کد مدتی dual-write و fallback-read کند.
- داده‌ها backfill شوند.
- consumerهای ستون قدیم حذف شوند.
- ستون قدیم در migration جدا و release بعدی حذف شود.

### تغییر type یا precision

- ستون جدید با type مقصد
- تبدیل و validation داده
- dual-write
- cutover
- حذف ستون قدیم بعد از دوره پایش

### حذف جدول/ستون

- ابتدا usage در کد، job، report و dashboard صفر شود.
- حداقل یک release deprecation بگذرد.
- backup و query اثبات عدم استفاده ثبت شود.
- حذف در migration مستقل انجام شود.

### index بزرگ

- query plan و حجم جدول بررسی شود.
- روش online/low-lock سازگار با نسخه MySQL انتخاب شود.
- timeout، زمان کم‌ترافیک و rollback عملیاتی تعیین شود.

## rollback

- rollback اصلی production با forward-fix است، نه edit یا delete migration.
- برای تغییر مخرب، restore point و migration جبرانی از قبل طراحی شود.
- release کد باید تا پایان migration با schema قبلی سازگار بماند.

## CI Gate

- [ ] format و validate Prisma
- [ ] ساخت DB خالی و اجرای همه migrationها
- [ ] اجرای migration روی snapshot نسخه قبلی
- [ ] drift detection
- [ ] بررسی SQL مخرب (`DROP`, type narrowing، nullable به required)
- [ ] integration tests
- [ ] ثبت checksum و عدم تغییر migration قدیمی
