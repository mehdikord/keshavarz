# فاز ۰۲ — Auth ادمین و API Client

> **هدف:** ورود واقعی مدیر، مدیریت نشست، و لایه فراخوانی تایپ‌شده `/api/admins/v1` با RBAC در UI.  
> **خط:** A  
> **وابستگی:** فاز ۰۱  
> **API:** فاز ۰۴ و ۱۰ از `docs/api-tasks`

## مراحل

### ۰۲.۰۱ — Admin API Client

- [x] `adminApi` با `credentials: 'include'` و parse envelope `data/meta/error`
- [x] نرمال‌سازی خطا (`error.code`, `message`, `fields`, `requestId`)
- [x] helperهای `get/post/patch/put/delete` و query string builder
- [x] تایپ‌ها هم‌راستا با Zod schemas سرور یا OpenAPI

### ۰۲.۰۲ — Login و Session

- [x] صفحه `/admins/login` متصل به `POST /auth/login`
- [x] مدیریت خطاهای قفل حساب / اعتبار نامعتبر بدون لو دادن جزئیات حساس
- [x] `GET /me` بعد از ورود برای پروفایل و permissions
- [x] refresh/logout/`logout all`
- [x] Guard لایه layout: بدون session → redirect login
- [x] جلوگیری از دسترسی کاربر اپ به ادمین با cookie جدا (اتکا به API)

### ۰۲.۰۳ — RBAC در UI

- [x] نگاشت permission codes به منو و اکشن‌ها
- [x] `Can` / `useAdminPermissions` برای مخفی/غیرفعال کردن کنترل‌ها
- [x] رفتار 403 یکدست در همه صفحات
- [x] عدم اعتماد صرف به مخفی‌سازی UI

### ۰۲.۰۴ — Profile مدیر

- [x] `/admins/me` با `GET/PATCH /me`
- [x] تغییر رمز با `POST /me/change-password`
- [x] نمایش نقش‌ها/مجوزهای مؤثر (read-only خلاصه)

### ۰۲.۰۵ — Query primitives

- [x] hook عمومی list با cursor (`useAdminCursorQuery`)
- [x] abort + debounce search
- [x] invalidate پس از mutation

## فایل‌های خروجی

```text
next/src/lib/api/envelope.ts
next/src/lib/api/csrf.ts
next/src/lib/api/admin-client.ts
next/src/lib/api/admin-auth.ts
next/src/hooks/admin/use-admin-session.tsx
next/src/hooks/admin/use-admin-permissions.ts
next/src/hooks/admin/use-admin-cursor-query.ts
next/src/components/admin-panel/auth/*
next/src/app/admins/login/page.tsx
next/src/app/admins/(console)/me/page.tsx
next/src/app/admins/(console)/me/change-password/page.tsx
```

## تنظیمات لازم محیط

```bash
ADMIN_SEED_PHONE="09120000000"
ADMIN_SEED_PASSWORD="ChangeMeAdmin!99"
ADMIN_SEED_NAME="مدیر سیستم"
ADMIN_ORIGIN="http://localhost:3000"   # باید با origin مرورگر یکی باشد
```

سپس: `pnpm db:seed`

## تغییرات پشتیبان Backend (حداقلی برای پذیرش فاز)

- `GET/PATCH /me` حالا `permissions: string[]` برمی‌گرداند.
- CSRF cookie ادمین با `Path=/` ست می‌شود تا SPA بتواند `X-CSRF-Token` را بخواند (session همچنان Path=`/api/admins/v1` و HttpOnly است).
- seed اختیاری مدیر bootstrap از env.

## معیار پذیرش

- [x] مدیر seedشده می‌تواند login کند و dashboard shell را ببیند.
- [x] بدون permission، آیتم منو و اکشن حساس دیده نمی‌شود و API هم 403 می‌دهد.
- [x] Logout نشست ادمین را باطل می‌کند.
- [x] Client envelope و pagination meta را درست می‌خواند.

## گزارش تکمیل

- **وضعیت:** تکمیل‌شده
- Login واقعی، session guard، logout، پروفایل، تغییر رمز و RBAC منو پیاده شد.
- `adminApi` با CSRF double-submit برای mutationها آماده است.
- `useAdminCursorQuery` برای فازهای دامنه بعدی آماده است.

## گام بعدی

فازهای موازی ۰۳ تا ۰۸؛ پیشنهاد شروع با [فاز ۰۳ Dashboard](../phase-03-dashboard-ops/) و [فاز ۰۴ Users/Providers](../phase-04-users-providers/)
