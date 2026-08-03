# ۰۱ — Design System

> **فاز:** ۰ · برنامه‌ریزی و طراحی  
> **اولویت:** P0  
> **پیش‌نیاز:** [project-prd.md](../../project-prd.md) بخش ۱۴

---

## هدف

تعریف سیستم طراحی یکپارچه قبل از کدنویسی تا تمام صفحات حس «اپلیکیشن کشاورزی مدرن» داشته باشند.

---

## ۱. پالت رنگ (CSS Variables)

| Token | مقدار | کاربرد |
|-------|-------|--------|
| `--primary` | `#2D6A4F` | CTA، هدر، Dock active |
| `--primary-foreground` | `#FFFFFF` | متن روی primary |
| `--secondary` | `#95D5B2` | پس‌زمینه ملایم |
| `--accent` | `#F4A261` | هایلایت، badge |
| `--earth` | `#8B7355` | عناصر ثانویه |
| `--background` | `#F8FAF5` | پس‌زمینه اپ |
| `--surface` | `#FFFFFF` | کارت‌ها |
| `--muted` | `#E8F0E8` | پس‌زمینه muted |
| `--muted-foreground` | `#5C6B5C` | متن ثانویه |
| `--destructive` | `#E76F51` | خطا، لغو |
| `--success` | `#40916C` | تأیید، موفقیت |
| `--border` | `#D8E2D8` | حاشیه کارت‌ها |
| `--ring` | `#2D6A4F` | focus ring |

### گرادیان‌های برند

```css
--gradient-hero: linear-gradient(135deg, #2D6A4F 0%, #40916C 50%, #95D5B2 100%);
--gradient-card: linear-gradient(180deg, #FFFFFF 0%, #F8FAF5 100%);
--gradient-dock: linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(248,250,245,0.95) 100%);
```

---

## ۲. تایپوگرافی

| سطح | سایز | وزن | کاربرد |
|-----|------|-----|--------|
| `display` | 28px / 1.75rem | 700 | عنوان Landing |
| `h1` | 24px | 700 | عنوان صفحه |
| `h2` | 20px | 600 | عنوان بخش |
| `h3` | 17px | 600 | عنوان کارت |
| `body` | 15px | 400 | متن عادی |
| `body-sm` | 13px | 400 | توضیحات |
| `caption` | 11px | 500 | badge، label |
| `stat` | 32px | 700 | اعداد داشبورد |

- **فونت:** Vazirmatn — weights: 400, 500, 600, 700
- **اعداد:** فارسی در UI (`fa-IR` locale)
- **line-height:** 1.6 برای body، 1.3 برای headings

---

## ۳. Spacing و Radius

| Token | مقدار |
|-------|-------|
| `--radius-sm` | 8px |
| `--radius-md` | 12px |
| `--radius-lg` | 16px |
| `--radius-xl` | 24px |
| `--radius-full` | 9999px |

**Spacing scale:** 4, 8, 12, 16, 20, 24, 32, 40, 48 (px)

**Padding صفحات:** `px-4` (16px) افقی، `pb-24` برای فضای Dock

---

## ۴. سایه و عمق

```css
--shadow-sm: 0 1px 2px rgba(45, 106, 79, 0.06);
--shadow-md: 0 4px 12px rgba(45, 106, 79, 0.08);
--shadow-lg: 0 8px 24px rgba(45, 106, 79, 0.12);
--shadow-dock: 0 -4px 20px rgba(45, 106, 79, 0.1);
```

---

## ۵. آیکون‌ها

- **کتابخانه:** `lucide-react`
- **سایز پیش‌فرض:** 20px (ناوبری)، 24px (کارت)، 16px (inline)
- **stroke-width:** 1.75

### آیکون‌های اختصاصی هر بخش

| بخش | آیکون پیشنهادی |
|-----|----------------|
| Provider — خدمات | `Tractor` یا `Wrench` |
| Provider — درخواست | `Inbox` |
| Provider — داشبورد | `LayoutDashboard` |
| Provider — گزارشات | `BarChart3` |
| Provider — اشتراک | `CreditCard` |
| Consumer — درخواست | `ClipboardList` |
| Consumer — جستجو | `Search` |
| Consumer — زمین | `MapPin` |
| Consumer — گزارشات | `PieChart` |

---

## ۶. الگوهای بصری کشاورزی

- **Texture:** الگوی ظریف برگ/گندم در پس‌زمینه hero (opacity 3–5%)
- **Illustration:** آیکون‌های خطی سبز برای Empty States
- **کارت‌ها:** گوشه گرد + سایه نرم + border ظریف
- **دکمه اصلی:** gradient سبز + hover scale 1.02
- **Dock:** glassmorphism + blur backdrop

---

## ۷. کامپوننت‌های پایه (لیست نصب shadcn)

```
button, input, label, card, badge, tabs, select,
dialog, sheet, slider, separator, skeleton, sonner,
avatar, scroll-area, form, calendar (پایه — سفارشی‌سازی شمسی)
```

---

## ۸. حالت‌های تعاملی

| حالت | استایل |
|------|--------|
| Hover | `brightness-95` یا `bg-primary/90` |
| Active/Pressed | `scale-95` transition 150ms |
| Disabled | `opacity-50 pointer-events-none` |
| Focus | `ring-2 ring-primary ring-offset-2` |
| Loading | Spinner + `opacity-70` |

---

## ۹. انیمیشن‌ها

| نام | مدت | easing |
|-----|-----|--------|
| `fade-in` | 200ms | ease-out |
| `slide-up` | 300ms | cubic-bezier(0.16, 1, 0.3, 1) |
| `scale-in` | 200ms | ease-out |
| Page transition | 250ms | ease-in-out |

---

## تسک‌ها

- [ ] جدول رنگ نهایی تأیید شود
- [ ] نمونه mood board (رنگ + کارت + دکمه) — می‌توان در Figma یا مستقیم در کد فاز ۱
- [ ] لیست کامپوننت shadcn برای نصب تهیه شود
- [ ] تصمیم dark mode: **خیر** (فقط light در Mock)

---

## معیار پذیرش

- Design tokens در فاز ۱ بدون ابهام قابل پیاده‌سازی باشند
- تم کشاورزی در تمام صفحات قابل تشخیص باشد
