# ۲.۰۱ — Types و Validators

> **فاز:** ۲ · هسته پلتفرم  
> **اولویت:** P0

---

## هدف

تعریف type-safe interfaces و Zod schemas برای تمام موجودیت‌ها.

---

## تسک‌ها

### ۱. Types (`src/types/`)

- [ ] `user.ts` — User
- [ ] `provider.ts` — ProviderProfile, OfferedService
- [ ] `consumer.ts` — Land
- [ ] `service.ts` — ServiceCategory, Service
- [ ] `request.ts` — Request, RequestProvider, RequestStatus
- [ ] `subscription.ts` — SubscriptionPlan, UserSubscription
- [ ] `notification.ts` — Notification
- [ ] `index.ts` — re-exports

### ۲. RequestStatus union

```typescript
export type RequestStatus =
  | 'pending_provider'
  | 'in_progress'
  | 'completed'
  | 'cancelled';
```

### ۳. Zod Schemas (`src/lib/validators/`)

- [ ] `auth.ts` — phoneSchema, otpSchema
- [ ] `land.ts` — landFormSchema
- [ ] `service.ts` — offeredServiceSchema
- [ ] `search.ts` — searchFormSchema
- [ ] `request.ts` — cancelReasonSchema

### ۴. نمونه phoneSchema

```typescript
export const phoneSchema = z.string()
  .regex(/^09\d{9}$/, 'شماره موبایل معتبر نیست');
```

### ۵. Branded IDs (اختیاری)

```typescript
export type UserId = string & { readonly brand: unique symbol };
```

---

## فایل‌های خروجی

```
src/types/*.ts
src/lib/validators/*.ts
```

---

## معیار پذیرش

- [ ] تمام موجودیت‌های PRD بخش ۱۱ پوشش داده شده
- [ ] `z.infer<typeof schema>` برای فرم‌ها قابل استفاده
