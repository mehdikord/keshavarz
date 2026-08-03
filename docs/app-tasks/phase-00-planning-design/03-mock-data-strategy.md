# ۰۳ — استراتژی Mock Data

> **فاز:** ۰ · برنامه‌ریزی و طراحی  
> **اولویت:** P0

---

## هدف

تعریف دقیق داده‌های شبیه‌سازی‌شده، seed اولیه، و persistence strategy.

---

## ۱. استراتژی Persistence

| لایه | فناوری | محتوا |
|------|--------|-------|
| Client state | Zustand + `persist` | user, provider, consumer, requests, notifications |
| Storage key | `localStorage` | `keshavarz-*` prefix |
| Seed | `lib/mock/seed.ts` | بارگذاری اولیه اگر storage خالی |

**رفتار:** اولین بازدید → seed load. بازدید بعدی → hydrate از localStorage.

---

## ۲. کاتالوگ خدمات (Seed)

### دسته ۱: خدمات کاشت

| ID | نام |
|----|-----|
| `svc-plant-wheat` | کاشت گندم |
| `svc-plant-bean` | کاشت لوبیا |
| `svc-plant-potato` | کاشت سیب‌زمینی |
| `svc-plant-corn` | کاشت ذرت |

### دسته ۲: خدمات برداشت

| ID | نام |
|----|-----|
| `svc-harvest-wheat` | برداشت گندم |
| `svc-harvest-rice` | برداشت برنج |
| `svc-harvest-cotton` | برداشت پنبه |

### دسته ۳: سم‌پاشی و کود

| ID | نام |
|----|-----|
| `svc-spray-pesticide` | سم‌پاشی |
| `svc-spray-fertilizer` | کودپاشی |
| `svc-spray-herbicide` | علف‌کش |

### دسته ۴: شخم و آماده‌سازی

| ID | نام |
|----|-----|
| `svc-plow` | شخم زمین |
| `svc-level` | تسطیح زمین |
| `svc-disc` | دیسک زنی |

---

## ۳. کاربران دمو (Seed)

| نقش | شماره | نام | موقعیت کار |
|-----|-------|-----|------------|
| Provider ۱ | `09121111111` | علی رضایی | اهواز (31.32, 48.68) — شعاع ۵۰km |
| Provider ۲ | `09122222222` | حسن محمدی | دزفول (32.38, 48.40) — شعاع ۳۰km |
| Provider ۳ | `09123333333` | رضا کریمی | شوشتر (32.05, 48.85) — شعاع ۸۰km — **بدون اشتراک** |
| Consumer | `09123456789` | زهرا احمدی | — |

> کاربر لاگین‌شده پیش‌فرض: `09123456789` (Consumer + می‌تواند Provider هم باشد)

---

## ۴. خدمات Providerهای Seed

**علی (Provider ۱):** کاشت گندم ۵M، برداشت گندم ۸M، سم‌پاشی ۳M — اشتراک فعال  
**حسن (Provider ۲):** شخم ۴M، کاشت ذرت ۶M — اشتراک فعال  
**رضا (Provider ۳):** برداشت برنج ۱۰M — **اشتراک منقضی**

---

## ۵. زمین‌های Seed (Consumer — زهرا)

| عنوان | متراژ | موقعیت |
|--------|-------|--------|
| زمین گندم شمال | ۵۰۰۰ m² | (31.35, 48.72) |
| زمین سبزیجات | ۲۰۰۰ m² | (31.28, 48.65) |

---

## ۶. پلن اشتراک

| ID | نام | مدت | قیمت |
|----|-----|------|------|
| `plan-basic` | اشتراک پایه | ۱ ماه | ۲۹۹,۰۰۰ تومان |
| `plan-pro` | اشتراک حرفه‌ای | ۱ ماه | ۴۹۹,۰۰۰ تومان |

---

## ۷. مختصات Mock Map

**مرکز پیش‌فرض نقشه:** اهواز `(31.3183, 48.6706)`

**MapPicker Mock:**
- تصویر satellite-style placeholder (Unsplash یا SVG grid)
- کلیک روی نقشه → ثبت lat/lng
- دکمه GPS → مرکز پیش‌فرض + jitter کوچک

---

## ۸. آب‌وهوا Mock

```typescript
const weatherMock = {
  temp: 38,
  condition: 'آفتابی',
  humidity: 25,
  wind: 12,
  icon: 'sun',
  city: 'اهواز',
};
```

اختیاری: اتصال به Open-Meteo API (رایگان) در فاز ۳.

---

## ۹. OTP Mock

- کد ثابت: `12345`
- در حالت dev: نمایش کد زیر input
- انقضا: ۲ دقیقه (نمایشی)

---

## ۱۰. ساختار Store Keys

```
keshavarz-auth
keshavarz-provider
keshavarz-consumer
keshavarz-requests
keshavarz-notifications
keshavarz-catalog (readonly — optional persist)
```

---

## ۱۱. Request Seed (اختیاری — برای دمو)

یک درخواست `pending_provider` از قبل برای تست UI Provider tab «جدید».

---

## تسک‌ها

- [ ] کاتالوگ ۴ دسته + ۱۳ خدمت تأیید شود
- [ ] ۴ کاربر دمو + ۲ زمین تأیید شود
- [ ] استراتژی persist/localStorage تأیید شود
- [ ] فایل `seed.ts` ساختار پیشنهادی در فاز ۲ پیاده شود

---

## معیار پذیرش

- داده seed سناریوی جستجو→نتایج→درخواست→قبول را پوشش دهد
- Provider بدون اشتراک (رضا) در جستجو ظاهر نشود
- فاصله‌ها با Haversine واقع‌گرایانه باشند
