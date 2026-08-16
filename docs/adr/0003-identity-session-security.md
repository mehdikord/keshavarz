# ADR-0003: جداسازی هویت و نشست

- **وضعیت:** Accepted
- **تاریخ:** 2026-08-03

## قلمروهای مستقل

| ویژگی | App User | Admin |
|---|---|---|
| ورود | موبایل ایرانی + OTP | موبایل + رمز عبور |
| جدول نشست | `user_sessions` | `admin_sessions` |
| cookie | `__Secure-keshavarz_app_session` | `__Secure-keshavarz_admin_session` |
| cookie path | `/api/app/v1` | `/api/admins/v1` |
| guard | authentication + ownership | authentication + deny-by-default RBAC |

- هر cookie دارای `HttpOnly`, `Secure`, `SameSite=Lax` است.
- session token حداقل 256 بیت تصادفی است؛ مقدار خام فقط در cookie و hash قطعی آن در DB قرار می‌گیرد.
- session و CSRF token یک realm در realm دیگر معتبر نیست.
- mutationهای cookie-based علاوه بر CSRF token، `Origin`/`Referer` allow-list را کنترل می‌کنند.

## چرخه نشست

| Policy | App User | Admin |
|---|---:|---:|
| absolute lifetime | 30 روز | 12 ساعت |
| idle timeout | 7 روز | 30 دقیقه |
| refresh window | 7 روز پایانی | 15 دقیقه پایانی |
| token rotation | login و هر refresh | login و هر refresh |

- refresh توکن قبلی را atomically revoke می‌کند و reuse توکن rotate‌شده تمام session family را revoke می‌کند.
- logout نشست جاری و logout-all همه نشست‌های actor را revoke می‌کند.
- ban/deactivate کاربر، disable مدیر، reset یا تغییر رمز مدیر نشست‌های مربوط را revoke می‌کند.
- فهرست sessionها فقط metadata redacted دستگاه، زمان‌ها و شناسه عمومی session را برمی‌گرداند.

## OTP کاربر

- شماره به `09XXXXXXXXX` normalize می‌شود.
- کد 6 رقمی، expiry برابر 2 دقیقه، حداکثر 5 تلاش و resend cooldown برابر 60 ثانیه است.
- حداکثر 5 ارسال برای هر phone در 30 دقیقه، 20 ارسال برای هر IP در یک ساعت و 5 verify برای هر challenge اعمال می‌شود.
- OTP plaintext ذخیره یا log نمی‌شود؛ HMAC با pepper نسخه‌دار ذخیره می‌شود.
- پاسخ request/resend وجود کاربر را افشا نمی‌کند.
- verify موفق challenge را consume و challengeهای login قبلی همان phone را باطل می‌کند.

## رمز مدیر

- حداقل 12 و حداکثر 128 کاراکتر؛ رمزهای رایج، لو‌رفته یا شامل اطلاعات هویتی رد می‌شوند.
- hash با Argon2id و حداقل `memory=64MiB`, `iterations=3`, `parallelism=1` ساخته می‌شود و پارامترها upgradeable هستند.
- پس از 5 تلاش ناموفق در 15 دقیقه، حساب 15 دقیقه lock می‌شود؛ تکرار lockout مدت را تا سقف 24 ساعت افزایش می‌دهد.
- rate limit روی phone، IP و fingerprint اعمال و خطای login همیشه عمومی است.
- تغییر رمز به current password، audit و revoke سایر نشست‌ها نیاز دارد.
- reset مدیر فقط با permission صریح، token یک‌بارمصرف کوتاه‌عمر و audit انجام می‌شود.
