# ADR-0002: قرارداد HTTP API

- **وضعیت:** Accepted
- **تاریخ:** 2026-08-03

## Base URL و نسخه‌بندی

- اپ: `/api/app/v1`
- مدیریت: `/api/admins/v1`
- نسخه breaking در URL افزایش می‌یابد. تغییر backward-compatible در همان `v1` انجام می‌شود.
- پاسخ JSON با `Content-Type: application/json; charset=utf-8` ارسال می‌شود؛ پاسخ `204` body ندارد.

## Envelope

پاسخ موفق:

```json
{
  "data": {},
  "meta": {},
  "requestId": "01J..."
}
```

`meta` اختیاری است. پاسخ خطا:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "داده‌های ورودی معتبر نیست.",
    "fields": {
      "phone": ["شماره موبایل معتبر نیست."]
    }
  },
  "requestId": "01J..."
}
```

- `error.code` مقدار پایدار و مناسب تصمیم‌گیری Client است.
- `message` قابل نمایش و بدون اطلاعات حساس است.
- `fields` اختیاری و کلیدهای آن path فیلدها هستند.
- هر response هدر `X-Request-Id` دارد و مقدار آن با `requestId` یکسان است.

## Status code

| Status | کاربرد |
|---|---|
| `200` | read/update/action همگام |
| `201` | ایجاد resource |
| `202` | command پذیرفته‌شده برای پردازش async |
| `204` | موفق بدون body |
| `400` | syntax، header یا query نامعتبر |
| `401` | credential مفقود، نامعتبر یا منقضی |
| `403` | credential معتبر بدون permission/ownership |
| `404` | resource در scope درخواست‌کننده پیدا نشده |
| `409` | conflict دامنه، state یا idempotency payload |
| `412` | شکست `If-Match` برای optimistic concurrency |
| `422` | payload از نظر ساختار معتبر ولی از نظر semantic نامعتبر |
| `429` | rate limit |
| `500` | خطای داخلی redacted |

## Pagination، filter و sort

- collectionهای بزرگ cursor-based هستند.
- query استاندارد: `cursor`, `limit`, `sort`, `direction`.
- `limit` پیش‌فرض `20` و حداکثر `100` است.
- پاسخ pagination در `meta.pagination` شامل `nextCursor`, `hasMore`, `limit` است.
- cursor opaque، URL-safe و وابسته به sort پایدار است؛ Client نباید آن را تفسیر کند.
- filterها فقط با نام‌های مستندشده و sort فقط از allow-list هر endpoint پذیرفته می‌شوند.
- sort نهایی همیشه tie-breaker یکتای `publicId` دارد.

## Idempotency

- commandهای ایجاد درخواست، پرداخت، verify، callback، transitionهای درخواست، refund، grant و mutationهای حساس مدیر strategy صریح دارند.
- هدر `Idempotency-Key` بین 16 تا 128 کاراکتر URL-safe است.
- scope کلید شامل realm، actor، operationId و key است.
- hash payload ذخیره می‌شود؛ تکرار با payload یکسان همان نتیجه را بازمی‌گرداند و payload متفاوت `409 IDEMPOTENCY_KEY_REUSED` می‌دهد.
- رکورد in-flight هم‌زمان `409 IDEMPOTENCY_IN_PROGRESS` می‌دهد.
- retention پیش‌فرض 24 ساعت است؛ پرداخت و callback حداقل 7 روز نگهداری می‌شوند.

## ETag و optimistic concurrency

- resourceهای mutable حساس `version` عدد صحیح و هدر strong `ETag` دارند.
- ETag از digest پایدار `publicId:version` ساخته می‌شود و جزئیات داخلی را افشا نمی‌کند.
- mutation حساس به نسخه باید `If-Match` ارسال کند.
- نبودن precondition در endpoint الزامی `400 PRECONDITION_REQUIRED` و mismatch برابر `412 VERSION_CONFLICT` است.
- transitionهای چندجدولی علاوه بر version داخل transaction و constraint دیتابیس محافظت می‌شوند.

## Cache

- پاسخ‌های authenticated به‌صورت پیش‌فرض `Cache-Control: private, no-store` هستند.
- endpoint عمومی فقط با policy صریح cache می‌شود.
- response نباید Vary یا cache key مشترک میان دو realm ایجاد کند.
