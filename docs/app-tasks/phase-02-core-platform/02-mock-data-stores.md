# ۲.۰۲ — Mock Data و Zustand Stores

> **فاز:** ۲ · هسته پلتفرم  
> **اولویت:** P0  
> **پیش‌نیاز:** [01-types-validators](./01-types-validators.md) + [Mock Data Strategy](../phase-00-planning-design/03-mock-data-strategy.md)

---

## هدف

پیاده‌سازی seed data و state management با persist.

---

## تسک‌ها

### ۱. Seed (`lib/mock/seed.ts`)

- [ ] کاتالوگ ۴ دسته + ۱۳ خدمت
- [ ] ۴ کاربر دمو
- [ ] Provider profiles + offered services
- [ ] ۲ زمین Consumer
- [ ] پلن‌های اشتراک
- [ ] تابع `initializeMockData()` — فقط اگر storage خالی

### ۲. `useAuthStore`

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (phone: string, otp: string) => boolean;
  logout: () => void;
  updateDisplayName: (name: string) => void;
}
```

- [ ] persist: `keshavarz-auth`

### ۳. `useProviderStore`

```typescript
interface ProviderState {
  workCenter: Coordinates | null;
  workRadiusKm: number;
  offeredServices: OfferedService[];
  subscription: UserSubscription | null;
  // actions: setWorkArea, addService, updatePrice, removeService, purchaseSubscription
}
```

- [ ] persist: `keshavarz-provider`

### ۴. `useConsumerStore`

```typescript
interface ConsumerState {
  lands: Land[];
  // actions: addLand, updateLand, deleteLand
}
```

- [ ] persist: `keshavarz-consumer`

### ۵. `useRequestStore`

```typescript
interface RequestState {
  requests: Request[];
  requestProviders: RequestProvider[];
  // actions: createFromSearch, sendToProvider, accept, reject, cancel, complete
}
```

- [ ] persist: `keshavarz-requests`

### ۶. `useNotificationStore`

```typescript
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  add, markRead, markAllRead
}
```

### ۷. `useCatalogStore` (readonly)

- [ ] categories + services — از seed، بدون mutate

### ۸. Hook ترکیبی

- [ ] `useInitializeApp()` — seed + hydrate در root client provider

---

## فایل‌های خروجی

```
src/lib/mock/seed.ts
src/lib/mock/users.ts
src/lib/mock/catalog.ts
src/stores/*.ts
src/components/providers/app-provider.tsx
```

---

## معیار پذیرش

- [ ] refresh صفحه state را حفظ کند
- [ ] کاربر جدید با OTP → `displayName: "کاربر کشاورز"`
- [ ] seed فقط یکبار load شود
