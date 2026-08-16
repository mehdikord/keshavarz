# تراکنش‌ها و ماشین وضعیت درخواست

## transitionهای مجاز

| Actor | Action | From | To |
|---|---|---|---|
| Consumer | create/send | — | `pending_provider` |
| Provider invited | accept | `pending_provider` | `in_progress` |
| Provider invited | reject | parent unchanged | link: `sent -> rejected` |
| Consumer owner | cancel | `pending_provider` | `cancelled` |
| Consumer owner | cancel with reason | `in_progress` | `cancelled` |
| Assigned Provider | cancel with reason | `in_progress` | `cancelled` |
| Admin permitted | cancel with reason | pending/in-progress | `cancelled` |
| Consumer owner | complete | `in_progress` | `completed` |

## الگوریتم قبول

1. transaction با isolation مناسب شروع شود.
2. Request با شرط `public_id` و status pending lock شود.
3. relation مربوط به Provider جاری با status sent بررسی شود.
4. eligibility تاریخی از snapshot گرفته شود؛ فعال بودن actor/account همچنان بررسی شود.
5. Request با assigned profile، agreed price، acceptedAt و version جدید update شود.
6. link پذیرنده accepted و سایر sentها removed با `accepted_by_other` شوند.
7. status history و provider histories درج شوند.
8. اعلان‌های دو طرف درج و deliveryها queue شوند.
9. transaction commit شود.

Constraint `uq_service_request_single_accepted` آخرین سد race است؛ conflict constraint باید به خطای دامنه `REQUEST_ALREADY_ACCEPTED` تبدیل شود.

## optimistic concurrency

- commandهایی که از detail UI می‌آیند `expectedVersion` می‌پذیرند.
- update با `WHERE id = ? AND version = ? AND status = ?` انجام می‌شود.
- عدم update به 409 با current state امن تبدیل می‌شود.
- idempotency success قبلی باید همان response منطقی را بازگرداند.

## حریم تماس

| Viewer | pending | in_progress | completed | cancelled |
|---|---|---|---|---|
| Consumer owner | بدون شماره Provider | شماره assigned Provider | شماره assigned Provider | طبق policy؛ پیش‌فرض مخفی |
| Invited Provider | بدون شماره Consumer | فقط اگر assigned است | فقط اگر assigned بوده | طبق policy؛ پیش‌فرض مخفی |
| Admin مجاز | masked پیش‌فرض | masked/full با Permission جدا | masked/full | masked/full |

## invariantها

- Request completed باید `completed_at` داشته باشد.
- Request cancelled باید actor و `cancelled_at` داشته باشد.
- in-progress باید دقیقاً یک accepted link و assigned profile داشته باشد.
- agreed price از snapshot link پذیرفته‌شده می‌آید.
- Provider غیرپذیرنده نباید detail یا تماس مرحله in-progress را ببیند.
- Provider نمی‌تواند complete کند.

## تست concurrency

- [ ] دو Provider هم‌زمان accept؛ دقیقاً یکی موفق
- [ ] accept هم‌زمان با cancel
- [ ] complete دوباره
- [ ] callback retry idempotency در اعلان side effect
- [ ] version stale
- [ ] deadlock retry محدود و امن
