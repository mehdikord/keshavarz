# ۱.۰۲ — Design Tokens و Theme

> **فاز:** ۱ · زیرساخت  
> **اولویت:** P0  
> **پیش‌نیاز:** [01-project-scaffold](./01-project-scaffold.md) + [Design System](../phase-00-planning-design/01-design-system.md)

---

## هدف

پیاده‌سازی Design Tokens در Tailwind 4 و shadcn theme.

---

## تسک‌ها

### ۱. فونت Vazirmatn

- [ ] نصب: `pnpm add @fontsource/vazirmatn` یا `next/font/local`
- [ ] weights: 400, 500, 600, 700
- [ ] اعمال در `layout.tsx`:

```tsx
import { Vazirmatn } from 'next/font/google';
// یا local font
const vazirmatn = Vazirmatn({ subsets: ['arabic'], weight: ['400','500','600','700'] });
```

### ۲. CSS Variables در `globals.css`

- [ ] تعریف تمام tokens از Design System
- [ ] `@theme inline` برای Tailwind 4
- [ ] رنگ‌های shadcn: `--background`, `--foreground`, `--primary`, ...

### ۳. RTL Root Layout

```tsx
<html lang="fa" dir="rtl">
```

### ۴. Utility اعداد فارسی

- [ ] `lib/utils/format.ts` → `toPersianDigits(n: number | string)`
- [ ] `formatPrice(amount: number)` → «۵,۰۰۰,۰۰۰ تومان»
- [ ] `formatDistance(km: number)` → «۲۴ کیلومتر»

### ۵. تاریخ شمسی

- [ ] `lib/utils/date.ts` → `formatJalali(date: Date)`
- [ ] استفاده از `Intl` یا `@persian-tools/persian-date` (اختیاری)

### ۶. کلاس‌های سفارشی

```css
.gradient-hero { background: var(--gradient-hero); }
.glass-dock { backdrop-filter: blur(12px); ... }
.card-elevated { box-shadow: var(--shadow-md); }
```

---

## فایل‌های خروجی

| فایل |
|------|
| `src/app/globals.css` |
| `src/app/layout.tsx` |
| `src/lib/utils/format.ts` |
| `src/lib/utils/date.ts` |

---

## معیار پذیرش

- [ ] متن فارسی با Vazirmatn رندر می‌شود
- [ ] RTL: دکمه‌ها و inputها چیدمان صحیح
- [ ] رنگ primary سبز کشاورزی (`#2D6A4F`)

---

## نکات طراحی

- پس‌زمینه viewport بیرونی (خارج از Mobile Shell): `#E8F0E8` یا gradient ملایم
- داخل Shell: `#F8FAF5`
