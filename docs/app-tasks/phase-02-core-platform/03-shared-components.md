# ۲.۰۳ — کامپوننت‌های مشترک UI

> **فاز:** ۲ · هسته پلتفرم  
> **اولویت:** P0  
> **پیش‌نیاز:** فاز ۱ + shadcn init

---

## هدف

کامپوننت‌های reusable که در هر دو پنل استفاده می‌شوند.

---

## تسک‌ها

### ۱. نصب shadcn components

```bash
pnpm dlx shadcn@3.6.2 add button input label card badge tabs select dialog sheet slider separator skeleton sonner avatar scroll-area form
```

### ۲. Layout Components

| کامپوننت | مسیر | توضیح |
|----------|------|--------|
| `MobileShell` | `layout/` | از فاز ۱ |
| `PageHeader` | `layout/` | عنوان + back |
| `PageContainer` | `layout/` | padding + scroll |

### ۳. Shared Components

| کامپوننت | توضیح |
|----------|--------|
| `EmptyState` | آیکون + عنوان + توضیح + CTA |
| `StatCard` | عدد بزرگ + label + آیکون + trend |
| `StatusBadge` | رنگ بر اساس RequestStatus |
| `PriceDisplay` | فرمت تومان فارسی |
| `DistanceDisplay` | «۲۴ کیلومتر» |
| `UserAvatar` | حرف اول نام |
| `ConfirmDialog` | تأیید حذف/لغو |
| `LoadingSpinner` | مرکز صفحه |

### ۴. `EmptyState` API

```tsx
<EmptyState
  icon={Tractor}
  title="هنوز خدمتی ثبت نکرده‌اید"
  description="خدمات قابل ارائه خود را اضافه کنید"
  action={{ label: 'افزودن خدمت', href: '...' }}
/>
```

### ۵. `MapPicker` (Mock)

- [ ] تصویر placeholder satellite
- [ ] کلیک → marker + lat/lng
- [ ] دکمه «موقعیت من»
- [ ] نمایش مختصات

### ۶. `PersianCalendar` (Mock)

- [ ] grid ماه شمسی
- [ ] multi-select روزها
- [ ] نمایش روزهای انتخاب‌شده به صورت chip

### ۷. `OTPInput`

- [ ] ۵ خانه جدا
- [ ] auto-focus بعدی
- [ ] paste support

### ۸. `WeatherWidget`

- [ ] کارت gradient با آیکون آب‌وهوا
- [ ] دما، رطوبت، باد

### ۹. Sonner Toaster

- [ ] `<Toaster position="top-center" dir="rtl" />`
- [ ] `lib/toast.ts` helpers: `toast.success()`, `toast.error()`

---

## فایل‌های خروجی

```
src/components/shared/*.tsx
src/components/layout/*.tsx
src/lib/toast.ts
```

---

## معیار پذیرش

- [ ] EmptyState در Story/صفحه تست رندر شود
- [ ] MapPicker مختصات برگرداند
- [ ] OTP ۵ رقمی کار کند

---

## نکات طراحی

- StatCard: gradient border ظریف سبز
- StatusBadge رنگ‌ها: pending=زرد، in_progress=آبی، completed=سبز، cancelled=قرمز
