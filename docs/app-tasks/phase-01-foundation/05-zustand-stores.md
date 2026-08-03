# Task 1.5 — Zustand Stores پایه

| فیلد | مقدار |
|------|--------|
| **فاز** | ۱ — Foundation |
| **اولویت** | P0 |
| **مدت تخمینی** | ۳ ساعت |
| **پیش‌نیاز** | Task 1.4 |

---

## هدف

ایجاد storeهای Zustand با persist middleware برای مدیریت state کلاینت Mock.

---

## وظایف

### 1.5.1 — Auth Store

- [ ] `src/stores/use-auth-store.ts`:

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (phone: string, otp: string) => Promise<boolean>;
  logout: () => void;
  updateDisplayName: (name: string) => void;
}
```

- [ ] persist با key `keshavarz-auth`
- [ ] `login`: اگر OTP = `12345` → موفق؛ کاربر جدید → نام «کاربر کشاورز»

### 1.5.2 — Provider Store

- [ ] `src/stores/use-provider-store.ts`:

```typescript
interface ProviderState {
  profile: ProviderProfile | null;
  subscription: UserSubscription | null;
  updateWorkArea: (center, radiusKm) => void;
  addOfferedService: (serviceId, price) => void;
  updateOfferedServicePrice: (serviceId, price) => void;
  removeOfferedService: (serviceId) => void;
  purchaseSubscription: (planId) => void;
  hasActiveSubscription: () => boolean;
}
```

- [ ] persist با key `keshavarz-provider`

### 1.5.3 — Consumer Store

- [ ] `src/stores/use-consumer-store.ts`:

```typescript
interface ConsumerState {
  lands: Land[];
  addLand: (land) => void;
  updateLand: (id, data) => void;
  deleteLand: (id) => void;
  getLandById: (id) => Land | undefined;
}
```

- [ ] persist با key `keshavarz-consumer`

### 1.5.4 — Request Store

- [ ] `src/stores/use-request-store.ts`:

```typescript
interface RequestState {
  requests: Request[];
  requestProviders: RequestProvider[];
  createRequest: (...) => Request;
  sendRequestToProvider: (requestId, providerId) => void;
  acceptRequest: (requestId, providerId) => void;
  rejectRequest: (requestId, providerId) => void;
  cancelRequest: (requestId, by, reason?) => void;
  completeRequest: (requestId) => void;
  getRequestsByStatus: (status, role) => Request[];
  getRequestProviders: (requestId) => RequestProvider[];
}
```

- [ ] persist با key `keshavarz-requests`
- [ ] منطق کامل در فاز ۶ تکمیل می‌شود؛ اینجا فقط interface و stub

### 1.5.5 — Notification Store

- [ ] `src/stores/use-notification-store.ts`:

```typescript
interface NotificationState {
  notifications: Notification[];
  addNotification: (notification) => void;
  markAsRead: (id) => void;
  getUnreadCount: () => number;
}
```

- [ ] persist با key `keshavarz-notifications`

### 1.5.6 — Store Index + Hydration

- [ ] `src/stores/index.ts` — re-export
- [ ] `src/components/providers/store-hydration.tsx` — `'use client'` wrapper برای جلوگیری از hydration mismatch
- [ ] `initializeMockData()` در اولین render کلاینت

---

## فایل‌های خروجی

```
src/stores/
├── use-auth-store.ts
├── use-provider-store.ts
├── use-consumer-store.ts
├── use-request-store.ts
├── use-notification-store.ts
└── index.ts

src/components/providers/
└── store-hydration.tsx
```

---

## معیار پذیرش

- [ ] ۵ store با TypeScript کامل export شوند
- [ ] persist در localStorage کار کند (رفرش صفحه state حفظ شود)
- [ ] `login('09121234567', '12345')` → `isAuthenticated: true`
- [ ] selectors برای جلوگیری از re-render اضافی
- [ ] هیچ store اطلاعات حساس غیرضروری نگه ندارد

---

## مرجع

- [Shared.md — State Management](../../Best%20Practices/Shared.md)
