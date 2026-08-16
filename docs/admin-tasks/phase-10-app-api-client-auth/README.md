# فاز ۱۰ — API Client اپ و Auth واقعی

> **هدف:** جایگزینی ورود Mock با OTP/session واقعی و پایه‌گذاری client اپ روی `/api/app/v1`.  
> **خط:** B  
> **وابستگی:** فاز ۰۰  
> **وضعیت فعلی:** `appApi` + cookie session + `/me` (بدون مسیر اصلی `MOCK_OTP`)

## مراحل

### ۱۰.۰۱ — App API Client

- [x] `appApi` مشابه ادمین با credentials و envelope
- [x] اشتراک utilityهای parse خطا/pagination در صورت امکان (`lib/api/*`)
- [x] سیاست handling 401: پاکسازی state و هدایت به `/auth`

### ۱۰.۰۲ — OTP واقعی

- [x] اتصال `/auth` به `POST /auth/otp/request|verify|resend`
- [x] نمایش cooldown/attempts بر اساس پاسخ API
- [x] حذف وابستگی مسیر اصلی به `MOCK_OTP`
- [x] حفظ UX دو مرحله‌ای موجود تا حد ممکن

### ۱۰.۰۳ — Session lifecycle

- [x] refresh، logout، logout all
- [x] `GET /me` به‌عنوان منبع کاربر جاری
- [x] لیست/revoke نشست‌ها اگر در UI پروفایل لازم است (`/me/sessions`)

### ۱۰.۰۴ — Bootstrap اپ

- [x] جایگزینی `initializeMockData` با bootstrap session-aware
- [x] تصمیم برای پاکسازی localStorage قدیمی
- [x] عدم hydrate از seed users

### ۱۰.۰۵ — مرز امنیتی

- [x] اطمینان از جدا بودن cookie اپ و ادمین
- [x] عدم نشت admin session به مسیرهای `/users|/providers`

## معیار پذیرش

- [x] کاربر با OTP واقعی (یا provider تست SMS محیط dev) وارد می‌شود و `/me` داده DB برمی‌گرداند.
- [x] مسیر happy-path دیگر `MOCK_OTP` را صدا نمی‌زند.
- [x] 401 کاربر را به auth برمی‌گرداند.
- [x] ادمین و اپ می‌توانند هم‌زمان در مرورگر جدا/پروفایل جدا بدون تداخل مخرب تست شوند.

## گام بعدی

[فاز ۱۱ — دامنه‌های اصلی اپ](../phase-11-app-core-domains/)
