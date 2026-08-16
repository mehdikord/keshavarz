# ماتریس مهاجرت Mock → API واقعی

> **وضعیت:** مهاجرت کامل شد (فاز ۱۳). لایه `next/src/lib/mock` حذف شده و مسیرهای runtime فقط از `/api/app/v1` و `/api/admins/v1` تغذیه می‌شوند.

## لایه‌های Mock سابق (بازنشسته)

| لایه | مسیر تقریبی سابق | جایگزین |
|---|---|---|
| Constants / OTP | `lib/mock/constants.ts` | `lib/app/defaults.ts`, `lib/app/legacy-storage-keys.ts`؛ OTP فقط از API |
| Catalog seed | `lib/mock/catalog.ts` | `/catalog/*` |
| Users/providers seed | `lib/mock/users.ts` | `/me`, `/provider/*`, ادمین Users/Providers |
| Subscriptions | `lib/mock/subscriptions.ts` | `/subscription/plans`, `/provider/subscription*` |
| Sync bootstrap | `lib/mock/sync-user-data.ts` | `use-initialize-app` + session bootstrap |
| Domain stores | `stores/*-store.ts` (دامنه) | حذف؛ فقط UI prefs باقی ماند |
| Search helper | `lib/search/search-providers.ts` | `/service-searches*` |
| Init hook | `hooks/use-initialize-app.ts` | پاکسازی legacy keys + `auth-store.bootstrap` |

## نگاشت Store → API (انجام‌شده)

| Store / مصرف | جایگزین API | فاز |
|---|---|---|
| `auth-store` (OTP) | `/api/app/v1/auth/otp/*` + session cookies | ۱۰ |
| catalog | `/catalog/categories`, `/catalog/.../services` | ۱۱ |
| lands | `/lands*` | ۱۱ |
| consumer requests | `/consumer/requests*`, `/service-requests*` | ۱۱ |
| provider profile/services | `/provider/profile`, `/work-area`, `/services*` | ۱۱ |
| search matching | `/service-searches*` | ۱۱ |
| subscription | `/subscription/plans`, `/provider/subscription*` | ۱۲ |
| payments | `/payments*`, verify + gateway callback سرور | ۱۲ |
| notifications | `/notifications*` | ۱۲ |
| reports | `/consumer/reports/*`, `/provider/reports/*` | ۱۲ |

## الگوی معماری Client پس از مهاجرت

```
UI Page/Component
  → domain API clients (`lib/api/app-*`, `lib/api/admin-*`)
    → appApi / adminApi (typed, credentials include, CSRF)
      → Next Route Handlers
        → Service → Repository → Prisma → MySQL
```

- Zustand فقط برای: UI prefs، shell ادمین، draft موقت
- Zustand دیگر source-of-truth دامنه نیست

## معیار اتمام مهاجرت

- [x] هیچ import از `@/lib/mock` در `app/`, `components/`, `stores/`, `hooks/` مسیر production نیست
- [x] OTP ثابت production وجود ندارد
- [x] ایجاد زمین/درخواست/قبول/پرداخت روی DB واقعی دیده می‌شود
- [x] ادمین همان رکوردها را در `/admins` می‌بیند
- [x] گارد CI: `pnpm check:no-mock-imports` + ESLint `no-restricted-imports`

## استثناهای عمدی UI (غیر SoT)

- ویجت نقشه/تقویم سمت client برای انتخاب مختصات/تاریخ؛ ذخیره نهایی از API
- `StatusBarMock` در mobile shell صرفاً ظاهر دستگاه
- `/admins/demo` sandbox کامپوننت (نه دامنه production)
- `MockPaymentProvider` فقط سمت سرور برای درگاه dev
