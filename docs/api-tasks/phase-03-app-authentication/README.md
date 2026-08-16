# فاز ۰۳ — احراز هویت کاربران اپ با OTP

> **هدف:** ورود/ثبت‌نام یکپارچه کاربران با موبایل و OTP پیامکی.  
> **وابستگی:** فاز ۰۲  
> **جداول:** `users`, `user_otp_codes`, `user_sessions`

## مراحل

### ۰۳.۰۱ — درخواست OTP

- [x] `POST /api/app/v1/auth/otp/request`
- [x] normalize و validate موبایل ایرانی
- [x] اعمال rate limit چندلایه، cooldown و generic response
- [x] ساخت code امن، ذخیره hash و expiry
- [x] enqueue ارسال SMS؛ عدم ارسال مستقیم در transaction

### ۰۳.۰۲ — verify و ایجاد نشست

- [x] `POST /api/app/v1/auth/otp/verify`
- [x] lock رکورد OTP معتبر و افزایش atomic attempts
- [x] consume یک‌باره کد
- [x] ایجاد user جدید با نام پیش‌فرض یا update last login
- [x] جلوگیری از login کاربر inactive/deleted/banned
- [x] ایجاد session، hash token و Cookie امن

### ۰۳.۰۳ — lifecycle نشست

- [x] refresh با rotation
- [x] logout نشست جاری
- [x] logout همه دستگاه‌ها
- [x] فهرست و revoke نشست‌ها
- [x] cleanup نشست و OTP منقضی با Job

### ۰۳.۰۴ — پروفایل جاری

- [x] `GET/PATCH /api/app/v1/me`
- [x] قابلیت هم‌زمان Consumer/Provider در response
- [x] upload/delete تصویر با محدودیت نوع و حجم
- [x] عدم امکان تغییر phone از endpoint عمومی پروفایل

## سناریوهای تست الزامی

- [x] کاربر جدید و موجود
- [x] OTP نادرست، منقضی، مصرف‌شده و attempts تمام‌شده
- [x] resend زودهنگام و brute force
- [x] user inactive و session revoked
- [x] concurrent verify یک OTP فقط یک‌بار موفق می‌شود

## معیار پذیرش

- [x] plaintext OTP و token در DB/log وجود ندارد.
- [x] OTP فقط برای کاربران اپ است و مدیر را authenticate نمی‌کند.
- [x] نشست پس از revoke یا expiry قابل استفاده نیست.
- [x] response وجود کاربر را قبل از verify افشا نمی‌کند.

## گزارش تکمیل

- **وضعیت:** تکمیل‌شده در 2026-08-04
- OTP request/resend/verify با normalize موبایل ایرانی، rate limit چندلایه (phone/IP/device fingerprint)، cooldown و پاسخ عمومی پیاده‌سازی شد.
- verify با `FOR UPDATE`، attempts اتمی، consume همه challengeهای login همان شماره، ایجاد کاربر با نام پیش‌فرض و جلوگیری از ورود inactive/deleted/banned انجام می‌شود.
- lifecycle نشست شامل refresh با rotation در بازه پایانی، تشخیص reuse توکن rotate‌شده و revoke خانواده نشست، logout، فهرست/revoke دستگاه‌ها و job پاکسازی است.
- پروفایل جاری با قابلیت Consumer/Provider، ویرایش امن بدون تغییر phone و upload/delete تصویر با کنترل نوع/حجم و magic bytes پوشش داده شد.
