# Task 1.2 — پیکربندی ابزارها

| فیلد | مقدار |
|------|--------|
| **فاز** | ۱ — Foundation |
| **اولویت** | P0 |
| **مدت تخمینی** | ۲ ساعت |
| **پیش‌نیاز** | Task 1.1 |

---

## هدف

پیکربندی ESLint 9، TypeScript strict، shadcn/ui و Tailwind CSS 4 مطابق Best Practices پروژه.

---

## وظایف

### 1.2.1 — TypeScript Strict

- [ ] فعال‌سازی در `tsconfig.json`:
  ```json
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitReturns": true
  ```
- [ ] path aliases: `@/*` → `./src/*`

### 1.2.2 — ESLint Flat Config

- [ ] نصب eslint 9.39.2
- [ ] پیکربندی flat config مطابق `docs/Best Practices/ESLint.md`
- [ ] افزودن script: `"lint": "eslint ."`

### 1.2.3 — Tailwind CSS 4

- [ ] تأیید نسخه tailwindcss 4.1.18
- [ ] پیکربندی `globals.css` با `@import "tailwindcss"`
- [ ] آماده‌سازی CSS variables برای theme (فاز ۲ تکمیل می‌کند)

### 1.2.4 — shadcn/ui

- [ ] اجرای `pnpm dlx shadcn@3.6.2 init`
- [ ] تنظیمات: RTL، style default، css variables
- [ ] نصب کامپوننت‌های پایه اولیه:
  - button
  - input
  - label
  - card
  - badge
  - tabs
  - dialog
  - sheet
  - select
  - slider
  - sonner (toast)
  - skeleton
  - separator
  - avatar

### 1.2.5 — وابستگی‌های اضافی

- [ ] نصب پکیج‌ها:
  ```bash
  pnpm add zustand@5.0.9 zod@4.2.1
  pnpm add lucide-react class-variance-authority clsx tailwind-merge
  pnpm add react-hook-form @hookform/resolvers
  pnpm add recharts  # نمودارها
  pnpm add date-fns-jalali  # تقویم شمسی (یا معادل)
  ```

### 1.2.6 — Utilityها

- [ ] ایجاد `src/lib/utils.ts` با تابع `cn()`
- [ ] ایجاد `src/lib/format.ts`:
  - `formatPrice(amount)` → قیمت تومان فارسی
  - `formatDistance(km)` → فاصله کیلومتر
  - `toPersianDigits(str)` → تبدیل اعداد

---

## فایل‌های خروجی

| فایل | توضیح |
|------|--------|
| `next/eslint.config.mjs` | ESLint flat config |
| `next/src/lib/utils.ts` | cn utility |
| `next/src/lib/format.ts` | فرمت‌کننده‌های فارسی |
| `next/components.json` | shadcn config |
| `next/src/components/ui/*` | کامپوننت‌های shadcn |

---

## معیار پذیرش

- [ ] `pnpm lint` بدون خطا
- [ ] `pnpm build` موفق
- [ ] import `@/components/ui/button` کار کند
- [ ] `cn()` در یک کامپوننت تست شده باشد

---

## مرجع

- [ESLint.md](../../Best%20Practices/ESLint.md)
- [shadcn.md](../../Best%20Practices/shadcn.md)
- [Tailwind.md](../../Best%20Practices/Tailwind.md)
