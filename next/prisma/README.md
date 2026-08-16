# Prisma Database Foundation

- `schema.prisma` نگاشت type-safe هر ۳۱ جدول است.
- `migrations/20260803120000_initial_schema/migration.sql` منبع اجرای کامل MySQL است.
- migration اولیه عمداً با `docs/database.schema` یکسان نگه داشته می‌شود.

## SQL خارج از Prisma DSL

موارد زیر فقط در migration SQL نگهداری می‌شوند و نباید با `prisma db push` بازنویسی شوند:

- charset و collation اختصاصی ستون‌ها
- `ON UPDATE CURRENT_TIMESTAMP(3)`
- CHECK constraintها
- دو stored generated column مربوط به single-accepted و one-active
- دو View گزارش و جستجو
- commentهای دیتابیس

ستون‌های generated در `schema.prisma` با `@ignore` فقط مستند شده‌اند تا Prisma Client نتواند آن‌ها را بنویسد.

## Commands

```bash
pnpm prisma:validate
pnpm prisma:generate
pnpm db:migrate:deploy
pnpm db:migrate:drift
pnpm db:seed
```

Migration اعمال‌شده immutable است و هر تغییر آینده باید migration جدید داشته باشد.
