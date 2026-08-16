# خط‌مشی پایه امنیت API

## جداسازی قلمروهای احراز هویت

| قلمرو | کاربر اپ | مدیر |
|---|---|---|
| مسیر | `/api/app/v1` | `/api/admins/v1` |
| credential ورود | موبایل + OTP | موبایل + رمز عبور |
| جدول نشست | `user_sessions` | `admin_sessions` |
| cookie | نام و Path مستقل | نام و Path مستقل |
| guard | user authentication + ownership | admin authentication + RBAC |
| actor audit | user/history | `admin_audit_logs` |

- session یک قلمرو نباید در قلمرو دیگر معتبر باشد.
- middleware مشترک فقط parsing و کنترل‌های عمومی را انجام می‌دهد؛ guardها جدا می‌مانند.
- کاربر عادی حتی اگر Provider باشد، هیچ Permission مدیریتی دریافت نمی‌کند.

## نشست و Cookie

- token حداقل ۲۵۶ بیت تصادفی باشد و مقدار خام فقط یک‌بار به Client داده شود.
- فقط hash قطعی token در DB ذخیره شود.
- Cookie دارای `HttpOnly`, `Secure`, `SameSite=Lax` و Path محدود به قلمرو باشد.
- برای درخواست‌های mutation از cookie، CSRF token و کنترل `Origin/Referer` فعال شود.
- rotation در login/refresh انجام و token قبلی revoke شود.
- logout، تغییر رمز مدیر، غیرفعال‌سازی حساب و ban باید نشست‌های مربوط را revoke کنند.
- session fixation، replay و استفاده از نشست منقضی باید تست شوند.

## OTP کاربران

- شماره به فرمت `09XXXXXXXXX` normalize شود.
- OTP plaintext ذخیره نشود؛ hash با secret pepper یا HMAC نگهداری شود.
- عمر پیشنهادی ۲ دقیقه، حداکثر ۵ تلاش و cooldown ارسال مجدد اعمال شود.
- rate limit روی phone، IP، device fingerprint و بازه زمانی ترکیبی باشد.
- پاسخ درخواست OTP وجود یا عدم وجود کاربر را افشا نکند.
- verify موفق کد را consume کند و تمام کدهای login قبلی همان شماره را باطل کند.
- logging نباید code، hash یا متن کامل پیامک را ثبت کند.

## رمز عبور مدیر

- hash با Argon2id و پارامترهای قابل ارتقا؛ fallback فقط در صورت محدودیت runtime.
- حداقل طول و بررسی رمزهای ضعیف/لو‌رفته در سیاست امنیتی تعریف شود.
- login خطای عمومی برای موبایل یا رمز نادرست برگرداند.
- lockout زمان‌دار بعد از تلاش‌های ناموفق و rate limit سخت‌گیرانه اعمال شود.
- تغییر رمز به current password، revoke سایر نشست‌ها و audit نیاز دارد.
- هیچ reset یا تغییر رمز مدیریتی بدون Permission و audit انجام نشود.

## Authorization و Ownership

- مجوز مدیریت به‌ترتیب: `is_super_admin` محدود، deny override، allow override، نقش فعال و Permission فعال محاسبه شود.
- deny باید بر allow نقش اولویت داشته باشد.
- role assignment و override منقضی‌شده نادیده گرفته شود.
- تمام منابع اپ با user جاری scope شوند؛ دریافت resource و سپس ownership check جداگانه انجام نشود.
- نمایش شماره تماس فقط برای طرفین Request در `in_progress` و `completed` مجاز است.
- شناسه داخلی BIGINT، hashها، مختصات خصوصی و metadata حساس در serializer حذف شوند.

## اعتبارسنجی و محافظت HTTP

- body، params، query و headerهای مهم با Zod validate شوند.
- Content-Type، محدودیت حجم body، نوع فایل، MIME واقعی و نام فایل کنترل شود.
- CORS به originهای مورد نیاز محدود بماند؛ wildcard همراه credential ممنوع است.
- security headerها شامل CSP، HSTS، `X-Content-Type-Options` و frame policy تعریف شوند.
- خطاها stack trace، SQL، path داخلی یا secret را افشا نکنند.
- queryهای مرتب‌سازی فقط از allow-list ستون‌ها ساخته شوند.

## تراکنش، تکرار و concurrency

- endpointهای پرداخت، ایجاد درخواست، قبول، لغو، پایان کار و عملیات مدیر idempotency strategy دارند.
- `Idempotency-Key` برای commandهای مناسب با scope کاربر/مدیر و hash payload ثبت شود.
- transition درخواست با lock/optimistic version و constraint دیتابیس محافظت شود.
- callback پرداخت signature، timestamp و replay protection داشته باشد.
- retry فقط برای خطاهای transient و با backoff محدود انجام شود.

## Audit و محرمانگی

- عملیات create/update/delete/status/refund/grant/permission/settings مدیریت audit می‌شوند.
- old/new values قبل از ثبت از password، token، phone کامل و payload حساس پاک‌سازی شوند.
- logها ساختاریافته و دارای `requestId`, actor، route، latency و result باشند.
- retention، دسترسی و redaction لاگ‌ها در فاز عملیات تعیین شود.

## چک‌لیست امنیت پیش از انتشار

- [ ] threat model دو قلمرو تکمیل شده است.
- [ ] تست IDOR برای تمام routeهای دارای شناسه اجرا شده است.
- [ ] تست CSRF، brute force، session replay و privilege escalation پاس شده است.
- [ ] secretها فقط در secret manager/environment امن هستند.
- [ ] dependency scan و بررسی migration SQL انجام شده است.
- [ ] endpointهای مدیریت با deny-by-default کار می‌کنند.
