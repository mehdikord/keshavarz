# Task 1.3 — Types و Zod Schemas

| فیلد | مقدار |
|------|--------|
| **فاز** | ۱ — Foundation |
| **اولویت** | P0 |
| **مدت تخمینی** | ۳ ساعت |
| **پیش‌نیاز** | Task 1.2 |

---

## هدف

تعریف تمام typeها و schemaهای Zod مطابق مدل داده PRD — پایه type-safe برای کل اپلیکیشن.

---

## وظایف

### 1.3.1 — Types اصلی (`src/types/`)

- [ ] `src/types/user.ts`:
  ```typescript
  interface User {
    id: string;
    phone: string;
    displayName: string;
    createdAt: string;
    updatedAt: string;
  }
  ```

- [ ] `src/types/service.ts`:
  - `ServiceCategory` — id, name, icon?
  - `Service` — id, categoryId, name

- [ ] `src/types/land.ts`:
  - `GeoLocation` — lat, lng
  - `Land` — id, userId, title, areaSqm, location, description?, createdAt

- [ ] `src/types/provider.ts`:
  - `OfferedService` — serviceId, price
  - `ProviderProfile` — userId, workCenter, workRadiusKm, offeredServices
  - `SubscriptionPlan` — id, name, durationMonths, price
  - `UserSubscription` — planId, startDate, endDate, isActive

- [ ] `src/types/request.ts`:
  - `RequestStatus` — union type (نه enum)
  - `Request` — تمام فیلدهای PRD
  - `RequestProvider` — requestId, providerId, status, sentAt
  - `RequestProviderStatus` — 'sent' | 'accepted' | 'rejected' | 'removed'

- [ ] `src/types/notification.ts`:
  - `Notification` — id, userId, title, body, read, createdAt, type

- [ ] `src/types/index.ts` — re-export همه

### 1.3.2 — Zod Schemas (`src/lib/validators/`)

- [ ] `phone.schema.ts` — شماره موبایل ایرانی `09XXXXXXXXX`
- [ ] `otp.schema.ts` — کد ۵ رقمی
- [ ] `land.schema.ts` — CRUD زمین
- [ ] `offered-service.schema.ts` — serviceId + price (min 0)
- [ ] `provider-profile.schema.ts` — workCenter + workRadiusKm (20-100)
- [ ] `search.schema.ts` — landId, categoryId, serviceId, scheduledDates (min 1)
- [ ] `cancel-request.schema.ts` — cancelReason (min 10 chars)

### 1.3.3 — Branded Types (اختیاری P1)

- [ ] `type UserId = string & { readonly brand: unique symbol }`
- [ ] helper `createUserId(id: string): UserId`

---

## فایل‌های خروجی

```
src/types/
├── user.ts
├── service.ts
├── land.ts
├── provider.ts
├── request.ts
├── notification.ts
└── index.ts

src/lib/validators/
├── phone.schema.ts
├── otp.schema.ts
├── land.schema.ts
├── offered-service.schema.ts
├── provider-profile.schema.ts
├── search.schema.ts
├── cancel-request.schema.ts
└── index.ts
```

---

## معیار پذیرش

- [ ] تمام types با PRD بخش ۱۱ مطابقت دارند
- [ ] `RequestStatus` به صورت union string literal (نه enum)
- [ ] Zod schemas با `z.infer<>` type-safe هستند
- [ ] `phone.schema` شماره `09123456789` را accept و `1234` را reject کند
- [ ] `workRadiusKm` فقط ۲۰-۱۰۰ را accept کند
- [ ] `pnpm build` بدون type error

---

## نکات

- از `import type` برای type-only imports استفاده شود
- پیام‌های خطای Zod فارسی باشند
