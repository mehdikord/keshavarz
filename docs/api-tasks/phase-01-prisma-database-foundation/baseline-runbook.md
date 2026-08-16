# Runbook راه‌اندازی و Baseline دیتابیس

## پیش‌شرط

- MySQL 8.0.16 یا جدیدتر
- backup معتبر پیش از هر عملیات روی دیتابیس دارای داده
- تنظیم `DATABASE_URL`، `DIRECT_DATABASE_URL` و `SHADOW_DATABASE_URL` در فایل محلی `.env`
- دیتابیس shadow باید مجزا، خالی و قابل حذف باشد.

## مسیر A — دیتابیس خالی

```bash
cd next
pnpm prisma:generate
pnpm db:migrate:deploy
pnpm db:seed
```

این مسیر migration history را ایجاد و تمام migrationها را به‌ترتیب اعمال می‌کند.

## مسیر B — دیتابیس از قبل ساخته‌شده

1. از دیتابیس backup بگیرید و restore آن را روی clone آزمایش کنید.
2. با `prisma db pull` ساختار موجود را با `prisma/schema.prisma` مقایسه کنید.
3. فقط اگر ساختار موجود با migration اولیه منطبق است، migration را applied علامت بزنید:

```bash
cd next
pnpm exec prisma migrate resolve \
  --applied 20260803120000_initial_schema
pnpm db:migrate:status
```

`migrate resolve` ساختار یا داده را تغییر نمی‌دهد و فقط migration history را ثبت می‌کند.

## Production

- اجرای `migrate reset` روی staging و production ممنوع است.
- production فقط از `prisma migrate deploy` استفاده می‌کند.
- migration اعمال‌شده هرگز edit یا delete نمی‌شود؛ اصلاح با migration جدید انجام می‌شود.
- rename، type change و required column با الگوی expand/contract انجام می‌شوند.
- rollback اصلی forward-fix است؛ برای تغییر مخرب restore point الزامی است.
