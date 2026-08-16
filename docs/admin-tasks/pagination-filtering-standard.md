# استاندارد صفحه‌بندی، فیلتر و عملکرد لیست‌ها

> این سند برای جلوگیری از کندی پنل ادمین و اپ روی دیتای production است و با قرارداد Backend هم‌راستا است.

## قرارداد API (منبع حقیقت)

از `next/src/server/contracts`:

| پارامتر | مقدار |
|---|---|
| پیش‌فرض `limit` | `20` |
| سقف `limit` | `100` |
| مکانیزم | Cursor (`cursor` opaque/public_id بسته به endpoint) |
| meta | `nextCursor`, `hasMore`, `limit` |
| sort | فقط allow-list هر schema |
| direction | `asc` \| `desc` (پیش‌فرض معمولاً `desc`) |

## قواعد Client

1. **هیچ list screenای تمام صفحات را پیش‌بارگذاری نکند.**
2. درخواست بعدی فقط با `meta.nextCursor` وقتی `hasMore === true`.
3. تغییر فیلتر = reset cursor (شروع از صفحه اول منطقی).
4. تغییر `limit` = reset cursor.
5. فیلترها و `limit` و `sort` در URL نگه داشته شوند.
6. Debounce جستجوی متنی ۲۰۰–۴۰۰ms؛ فیلترهای select بلافاصله یا با Apply پنل.
7. Concurrent fetch: درخواست قبلی abort شود (`AbortController`).
8. Cache کوتاه برای back-navigation مجاز است؛ بعد از mutation همان دامنه invalidate شود.
9. Exportهای بزرگ فقط از endpoint `/exports`؛ نه از جمع‌کردن صفحه به صفحه در مرورگر.

## الگوی UI صفحه‌بندی

پیشنهاد MVP (سازگار با cursor و بدون total count):

```
[۲۰ ▼ در صفحه]   نتایج این صفحه: N    [قبلی*]  [بعدی]
```

- `بعدی`: فعال اگر `hasMore`
- `قبلی`: با stack محلی cursorها در client (یا غیرفعال اگر پیچیدگی زیاد؛ حداقل Next کافی است برای MVP، Prev در همان فاز تکمیل شود)
- هرگز «صفحه ۷ از ۲۰۰» نساز مگر API total بدهد

## فیلتر حرفه‌ای — حداقل هر دامنه

| دامنه | فیلترهای حداقل |
|---|---|
| Users | `q`, `isActive`, sort `createdAt` |
| Providers | `q`, approval/availability (طبق schema)، sort |
| Service requests | status، `q`، بازه‌های مجاز schema، sort |
| Payments | status، gateway، بازه، `q` در صورت وجود |
| Provider subscriptions | status، plan، provider |
| Audit logs | actor، module، action، date range |
| Notifications (admin) | status/channel در صورت وجود |
| App consumer/provider requests | status + cursor |

اگر schema فعلی فیلتری ندارد ولی UX نیاز دارد: در فاز مربوطه **gap** ثبت شود و یا Backend ticket کوچک قبل از UI، یا UI بدون ادعای فیلتر کاذب.

## عملکرد و بودجه

| متریک | هدف |
|---|---|
| Time to first table rows (P95 داخلی) | < ۱.۵s روی شبکه عادی |
| Payload list | ترجیحاً < ۱۰۰KB JSON فشرده‌نشده برای ۲۰ ردیف خلاصه |
| Re-render فیلتر | بدون remount کل layout |
| Memory | بدون نگه داشتن بیش از ۲–۳ صفحه در state مگر infinite scroll صریح |

## چک‌لیست پذیرش هر صفحه لیست

- [x] Cursor pagination پیاده شده (گارد `pnpm check:admin-list-perf`)
- [x] Limit قابل انتخاب و سقف‌دار (`20|50|100`، بودجه `check:admin-load-budget`)
- [x] فیلترها URL-synced (`useAdminUrlListState`)
- [x] Reset فیلتر و cursor درست کار می‌کند
- [x] Skeleton / empty / error
- [x] Permission روی اکشن‌ها
- [x] با dataset حجیم: UI فقط یک صفحه نگه می‌دارد؛ تست دستی/staging در release-runbook
