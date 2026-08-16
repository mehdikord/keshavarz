# ADR-0001: معماری لایه‌ای Backend در Next.js

- **وضعیت:** Accepted
- **تاریخ:** 2026-08-03

## زمینه

Backend در همان پروژه Next.js 16 اجرا می‌شود، اما قواعد کسب‌وکار، دسترسی داده و HTTP نباید به هم وابسته شوند. دامنه‌های اپ و مدیریت نیز credential و guard متفاوت دارند.

## تصمیم

- transport با App Router Route Handlers در دو root مستقل پیاده می‌شود:
  - `next/src/app/api/app/v1`
  - `next/src/app/api/admins/v1`
- جریان وابستگی فقط `route -> schema -> service -> repository -> Prisma` است.
- Route فقط parsing، validation مرز HTTP، authentication/authorization، فراخوانی Service و تبدیل نتیجه به response را انجام می‌دهد.
- Schema ورودی‌های `body`, `params`, `query` و headerهای مهم را با Zod و به‌صورت strict اعتبارسنجی می‌کند.
- Service تنها محل قواعد کسب‌وکار، ownership، transition، transaction و idempotency orchestration است.
- Repository تنها لایه مجاز برای import کردن Prisma Client و اجرای query است.
- UI، Route Handler و Service حق import مستقیم Prisma Client ندارند.
- کد مشترک HTTP در `next/src/server` و کد هر دامنه در feature همان دامنه قرار می‌گیرد.
- `proxy.ts` فقط برای concerns شبکه‌ای است و برای auth، RBAC یا business logic استفاده نمی‌شود.

## نام‌گذاری

- URLها lowercase، kebab-case و نام collectionها جمع هستند.
- path parameterها camelCase و با شناسه عمومی نام‌گذاری می‌شوند؛ مانند `{requestId}`.
- JSON و TypeScript از camelCase و typeها از PascalCase استفاده می‌کنند.
- دیتابیس از snake_case استفاده می‌کند و mapping فقط در Prisma انجام می‌شود.
- operationId از الگوی `realmDomainAction` با lowerCamelCase پیروی می‌کند.

## پیامدها

- تست Service بدون Next.js و تست Repository بدون HTTP ممکن است.
- تغییر transport یا ORM اثر محدودتری دارد.
- هر feature به فایل‌های بیشتری نیاز دارد، اما مرزهای امنیتی و مالکیت داده شفاف می‌مانند.
