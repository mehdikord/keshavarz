# ۰۲ — معماری اطلاعات (Information Architecture)

> **فاز:** ۰ · برنامه‌ریزی و طراحی  
> **اولویت:** P0

---

## هدف

نقشه کامل صفحات، navigation، و سلسله‌مراتب محتوا قبل از پیاده‌سازی.

---

## ۱. درخت سایت

> **قرارداد URL:** پنل خدمات‌دهنده از `/providers` و پنل خدمات‌گیرنده از `/users` شروع می‌شود.  
> مثال: `site.com/providers/requests` · `site.com/users/lands`

```
/ (Landing)
├── /auth (ورود OTP)
├── /profile (پروفایل — P1)
│
├── /providers/
│   ├── /home          ← داشبورد (مرکز Dock)
│   ├── /services      ← خدمات من
│   ├── /requests      ← درخواست‌ها (۴ تب)
│   │   └── /[id]      ← جزئیات
│   ├── /reports       ← گزارشات مالی
│   └── /subscription  ← اشتراک‌ها
│
└── /users/
    ├── /home          ← داشبورد (مرکز Dock)
    ├── /lands         ← زمین‌های من
    │   ├── /new       ← افزودن
    │   └── /[id]/edit ← ویرایش
    ├── /search        ← جستجوی خدمات
    │   └── /results   ← نتایج
    ├── /requests      ← درخواست‌ها (۴ تب)
    │   └── /[id]      ← جزئیات
    └── /reports       ← گزارشات مالی
```

---

## ۲. Layout Groups (Next.js App Router)

```
src/app/
├── layout.tsx              # Root: RTL, font, providers
├── page.tsx                # Landing
├── (auth)/
│   └── auth/page.tsx
├── profile/page.tsx
├── providers/
│   ├── layout.tsx          # Provider shell + Dock
│   ├── home/page.tsx
│   ├── services/page.tsx
│   ├── requests/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── reports/page.tsx
│   └── subscription/page.tsx
└── users/
    ├── layout.tsx          # Consumer shell + Dock
    ├── home/page.tsx
    ├── lands/
    │   ├── page.tsx
    │   ├── new/page.tsx
    │   └── [id]/edit/page.tsx
    ├── search/
    │   ├── page.tsx
    │   └── results/page.tsx
    ├── requests/
    │   ├── page.tsx
    │   └── [id]/page.tsx
    └── reports/page.tsx
```

**نگاشت URL ↔ پوشه:**

| پیشوند URL | پوشه `src/app/` |
|------------|-----------------|
| `/providers/*` | `providers/` |
| `/users/*` | `users/` |

---

## ۳. Navigation — Provider Dock

**ترتیب RTL (راست → چپ):**

| # | برچسب | مسیر | آیکون |
|---|--------|------|-------|
| ۱ | ارائه خدمات | `/providers/services` | Wrench |
| ۲ | درخواست‌ها | `/providers/requests` | Inbox |
| ۳ | داشبورد | `/providers/home` | LayoutDashboard |
| ۴ | گزارشات | `/providers/reports` | BarChart3 |
| ۵ | اشتراک‌ها | `/providers/subscription` | CreditCard |

**رفتار:** آیتم وسط (داشبورد) می‌تواند بزرگ‌تر/برجسته‌تر باشد (FAB-style center).

---

## ۴. Navigation — Consumer Dock

**ترتیب RTL (راست → چپ):**

| # | برچسب | مسیر | آیکون |
|---|--------|------|-------|
| ۱ | درخواست‌ها | `/users/requests` | ClipboardList |
| ۲ | جستجوی خدمات | `/users/search` | Search |
| ۳ | داشبورد | `/users/home` | LayoutDashboard |
| ۴ | زمین‌ها | `/users/lands` | MapPin |
| ۵ | گزارشات مالی | `/users/reports` | PieChart |

---

## ۵. سلسله‌مراتب محتوای هر صفحه کلیدی

### Landing `/`

```
┌─────────────────────────┐
│ Header: لوگو + پروفایل  │
├─────────────────────────┤
│ Hero: تاریخ + ساعت      │
│ WeatherWidget           │
├─────────────────────────┤
│ CTA: خدمات‌دهنده        │
│ CTA: خدمات‌گیرنده       │
├─────────────────────────┤
│ Footer: نسخه / شعار     │
└─────────────────────────┘
```

### Provider — درخواست‌ها

```
┌─────────────────────────┐
│ PageHeader + badge تعداد│
├─────────────────────────┤
│ Tabs: جدید|درحال|پایان|لغو│
├─────────────────────────┤
│ RequestCard[]           │
│ (scroll)                │
├─────────────────────────┤
│ Dock (fixed)            │
└─────────────────────────┘
```

### Consumer — جستجو → نتایج

```
Search Form Page          Results Page
┌──────────────┐         ┌──────────────┐
│ انتخاب زمین  │  ──→    │ Sort/Filter  │
│ دسته‌بندی    │         │ ProviderCard[]│
│ خدمت         │         │ [ارسال درخواست]│
│ تقویم تاریخ  │         └──────────────┘
│ [جستجو]      │
└──────────────┘
```

---

## ۶. Route Guard

| مسیر | نیاز به Auth |
|------|-------------|
| `/` | خیر (اما CTAها به auth هدایت اگر لاگین نیست) |
| `/auth` | خیر |
| `/providers/*` | بله |
| `/users/*` | بله |
| `/profile` | بله |

---

## ۷. Breadcrumb / Back Navigation

- صفحات جزئیات (`[id]`): دکمه بازگشت به لیست
- صفحات فرم (lands/new): بازگشت به `/users/lands`
- نتایج جستجو: بازگشت به `/users/search` با حفظ state فرم

---

## تسک‌ها

- [ ] درخت سایت تأیید شود
- [ ] layout groups در App Router تأیید شود
- [ ] ترتیب Dock هر دو پنل تأیید شود
- [ ] wireframe متنی هر صفحه کلیدی مرور شود

---

## معیار پذیرش

- هیچ صفحه‌ای بدون مسیر مشخص نماند
- navigation بین دو پنل از Landing یا پروفایل ممکن باشد
