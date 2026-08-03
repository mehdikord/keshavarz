# Task 1.4 — Mock Data Layer

| فیلد | مقدار |
|------|--------|
| **فاز** | ۱ — Foundation |
| **اولویت** | P0 |
| **مدت تخمینی** | ۴ ساعت |
| **پیش‌نیاز** | Task 1.3 |

---

## هدف

ایجاد داده‌های Mock اولیه، کاتالوگ خدمات، کاربران دمو و utilityهای دسترسی به داده.

---

## وظایف

### 1.4.1 — کاتالوگ خدمات

- [ ] `src/lib/mock/service-catalog.ts`:

| دسته‌بندی | خدمات |
|----------|--------|
| خدمات کاشت | کاشت گندم، کاشت لوبیا، کاشت سیب‌زمینی، کاشت ذرت |
| ادوات برداشت | برداشت گندم، برداشت یونجه، برداشت پنبه |
| سم‌پاشی و کوددهی | سم‌پاشی زمین، کوددهی زمین، سم‌پاشی درختی |

- [ ] هر آیتم: `id`, `categoryId`, `name`, `icon` (lucide icon name)

### 1.4.2 — کاربران دمو

- [ ] `src/lib/mock/users.ts`:

| کاربر | نقش | موقعیت |
|-------|------|--------|
| علی رضایی | Provider | اهواز (31.32, 48.68) |
| زهرا محمدی | Consumer | دزفول (32.38, 48.40) |
| رضا احمدی | Provider | دزفول (32.40, 48.42) |

- [ ] شماره موبایل هر کاربر برای تست OTP

### 1.4.3 — داده‌های نمونه

- [ ] `src/lib/mock/seed-lands.ts` — ۲-۳ زمین برای زهرا
- [ ] `src/lib/mock/seed-providers.ts` — پروفایل علی و رضا با خدمات و محدوده
- [ ] `src/lib/mock/seed-subscriptions.ts` — پلن‌ها + اشتراک فعال علی
- [ ] `src/lib/mock/seed-requests.ts` — ۱-۲ درخواست نمونه در وضعیت‌های مختلف

### 1.4.4 — Subscription Plans

- [ ] `src/lib/mock/subscription-plans.ts`:

| پلن | مدت | قیمت |
|-----|------|------|
| پایه | ۱ ماه | ۵۰۰,۰۰۰ تومان |
| حرفه‌ای | ۱ ماه | ۹۰۰,۰۰۰ تومان |

### 1.4.5 — Mock Services (لایه سرویس)

- [ ] `src/lib/mock/storage.ts`:
  - `getStorageKey(namespace)` 
  - `loadFromStorage<T>(key, fallback)`
  - `saveToStorage<T>(key, data)`

- [ ] `src/lib/mock/mock-api.ts`:
  - شبیه‌سازی delay (300ms) برای realism
  - توابع CRUD برای هر entity
  - `initializeMockData()` — seed اولیه اگر localStorage خالی باشد

### 1.4.6 — Geo Utilities

- [ ] `src/lib/mock/geo.ts`:
  - `haversineDistance(point1, point2)` → کیلومتر
  - `isWithinRadius(center, target, radiusKm)` → boolean
  - `getMockCities()` — لیست شهرها برای MapPicker

---

## فایل‌های خروجی

```
src/lib/mock/
├── service-catalog.ts
├── users.ts
├── seed-lands.ts
├── seed-providers.ts
├── seed-subscriptions.ts
├── seed-requests.ts
├── subscription-plans.ts
├── storage.ts
├── mock-api.ts
├── geo.ts
└── index.ts
```

---

## معیار پذیرش

- [ ] `initializeMockData()` داده seed را در localStorage بنویسد
- [ ] کاتالوگ حداقل ۳ دسته و ۹ خدمت داشته باشد
- [ ] `haversineDistance` فاصله اهواز-دزفول ≈ ۱۳۰km برگرداند
- [ ] داده seed با Zod schemas validate شود
- [ ] فراخوانی مجدد seed داده موجود را overwrite نکند (مگر force)

---

## نکات طراحی Mock

- مختصات واقعی شهرهای ایران برای realism
- قیمت‌ها واقع‌گرایانه (مثلاً کاشت گندم: ۸۰۰,۰۰۰ - ۱,۵۰۰,۰۰۰ تومان)
- نام‌های فارسی برای تمام entities
