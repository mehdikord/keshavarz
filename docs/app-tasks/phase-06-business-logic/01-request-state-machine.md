# ۶.۰۱ — ماشین وضعیت درخواست

> **فاز:** ۶ · منطق کسب‌وکار  
> **اولویت:** P0

---

## هدف

پیاده‌سازی مرکزی تمام transitionهای Request در `lib/request-engine.ts`.

---

## تسک‌ها

### ۱. State Machine

```typescript
// lib/request-engine.ts

const transitions = {
  pending_provider: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};
```

### ۲. Actions

| Action | From | To | Actor |
|--------|------|-----|-------|
| `sendToProvider` | — | pending | Consumer |
| `accept` | pending | in_progress | Provider |
| `reject` | pending | — (remove provider) | Provider |
| `cancelByConsumer` | pending/in_progress | cancelled | Consumer |
| `cancelByProvider` | in_progress | cancelled | Provider |
| `complete` | in_progress | completed | Consumer |

### ۳. accept — side effects

- [ ] set `assignedProviderId`
- [ ] set `price` from provider's offered service
- [ ] همه `RequestProvider` دیگر → `removed`
- [ ] notify consumer + provider
- [ ] BR-01, BR-02

### ۴. reject — side effects

- [ ] `RequestProvider.status` → `rejected`
- [ ] UI نتایج Consumer → disabled item
- [ ] BR-09

### ۵. cancel pending — side effects

- [ ] همه RequestProvider → `removed`
- [ ] BR مربوطه

### ۶. cancel in_progress

- [ ] `cancelReason` اجباری
- [ ] `cancelledBy` ثبت شود
- [ ] BR-07

### ۷. complete

- [ ] `completedAt` timestamp
- [ ] فقط consumerId owner
- [ ] BR-06

### ۸. Guard invalid transitions

- [ ] throw یا return error + toast

### ۹. Unit tests (اختیاری)

- [ ] vitest برای هر transition

---

## فایل‌های خروجی

```
src/lib/request-engine.ts
src/stores/request-store.ts (actions delegate to engine)
```

---

## معیار پذیرش

- [ ] تمام ۹ قانون BR از README فاز ۶
- [ ] هیچ transition غیرمجاز ممکن نباشد
