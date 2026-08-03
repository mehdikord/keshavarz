# ۱.۰۳ — Mobile Shell و Layout RTL

> **فاز:** ۱ · زیرساخت  
> **اولویت:** P0  
> **پیش‌نیاز:** [02-design-tokens-theme](./02-design-tokens-theme.md)

---

## هدف

قاب موبایل ثابت که در viewport بزرگ هم حفظ شود — اساس تمام UI اپ.

---

## تسک‌ها

### ۱. کامپوننت `MobileShell`

```tsx
// components/layout/mobile-shell.tsx
interface MobileShellProps {
  children: React.ReactNode;
  showDock?: boolean;
}
```

**استایل:**
- Wrapper بیرونی: `min-h-dvh flex items-center justify-center bg-[outer-bg]`
- قاب داخلی: `w-full max-w-[430px] min-h-dvh bg-background shadow-2xl relative overflow-hidden`
- در دسکتاپ: `rounded-[2rem]` (اختیاری — حس گوشی)
- Safe area: `pb-safe` برای iOS

### ۲. کامپوننت `PageContainer`

- [ ] `px-4 pt-4` padding استاندارد
- [ ] `pb-24` وقتی Dock نمایش داده می‌شود
- [ ] scroll: `overflow-y-auto flex-1`

### ۳. کامپوننت `PageHeader`

- [ ] عنوان + دکمه بازگشت (اختیاری)
- [ ] action slot (راست در RTL)

### ۴. Status Bar Mock (اختیاری — پولیش)

- [ ] نوار بالای قاب شبیه status bar iOS (ساعت، باتری)

### ۵. تست Responsive

- [ ] ۳۲۰px (iPhone SE)
- [ ] ۴۳۰px (حداکثر)
- [ ] ۱۹۲۰px (دسکتاپ — قاب مرکز)

---

## فایل‌های خروجی

| فایل |
|------|
| `components/layout/mobile-shell.tsx` |
| `components/layout/page-container.tsx` |
| `components/layout/page-header.tsx` |

---

## معیار پذیرش

- [ ] در ۱۹۲۰×۱۰۸۰ قاب ۴۳۰px مرکز است
- [ ] اسکرول فقط داخل قاب
- [ ] `100dvh` بدون پرش layout

---

## نکات طراحی

- سایه بیرونی قاب: `shadow-[0_0_60px_rgba(45,106,79,0.15)]`
- گوشه‌های گرد قاب در دسکتاپ حس native app می‌دهد
