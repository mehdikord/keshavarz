# ADR-0004: قرارداد نمایش داده و تاریخچه

- **وضعیت:** Accepted
- **تاریخ:** 2026-08-03

## شناسه

- API فقط `public_id` از نوع ULID را با نام JSON مانند `userId`, `requestId` یا `id` برمی‌گرداند.
- BIGINT داخلی، foreign key داخلی و ترتیب ایجاد قابل استنتاج افشا نمی‌شود.
- ورودی path فقط ULID canonical uppercase را می‌پذیرد.

## زمان، پول و Decimal

- تمام timestampها در DB به UTC ذخیره و در API به ISO 8601 با پسوند `Z` ارسال می‌شوند.
- تاریخ شمسی فقط concern نمایش Client است و در API ورودی/خروجی مرجع نیست.
- مبلغ عدد صحیح تومان و بدون float است؛ مقدار خارج از safe integer رد می‌شود.
- مساحت، latitude، longitude، distance و سایر Decimalها به string canonical ارسال می‌شوند.
- Client حق انجام محاسبه مالی authoritative با float را ندارد.

## داده تاریخی و snapshot

- `service_requests` هنگام ایجاد snapshot لازم از زمین، خدمت و context قیمت را ذخیره می‌کند.
- تاریخ‌های انتخابی در `service_request_dates` پس از ایجاد immutable هستند.
- قیمت پذیرفته‌شده از snapshot/history خوانده می‌شود، نه از `provider_services` mutable.
- گزارش مالی فقط از درخواست completed و مبلغ snapshot تراکنشی استفاده می‌کند.
- نمایش جزئیات درخواست تاریخی نباید به نام، مختصات، مساحت، قیمت یا وضعیت فعلی رکورد mutable وابسته باشد.
- history و audit append-only هستند و endpoint ویرایش/حذف ندارند.

## محرمانگی serializer

- password hash، OTP/HMAC، session hash، reset token، شناسه داخلی، metadata درگاه و مختصات خارج از scope حذف می‌شوند.
- شماره تماس فقط برای طرفین request در وضعیت `in_progress` و `completed` قابل نمایش است.
- DTO عمومی به‌صورت allow-list ساخته می‌شود؛ حذف چند field از مدل دیتابیس روش قابل قبول نیست.
