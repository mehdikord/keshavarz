# فاز ۱ — زیرساخت و Scaffold

> **هدف:** ایجاد پروژه Next.js با پیکربندی کامل و قاب موبایل.  
> **مدت تخمینی:** ۱–۲ روز  
> **وابستگی:** [فاز ۰](../phase-00-planning-design/)

---

## مراحل این فاز

| # | مرحله | سند |
|---|--------|-----|
| ۱ | Scaffold پروژه و پکیج‌ها | [01-project-scaffold.md](./01-project-scaffold.md) |
| ۲ | Design Tokens و Theme | [02-design-tokens-theme.md](./02-design-tokens-theme.md) |
| ۳ | Mobile Shell و Layout RTL | [03-layout-mobile-shell.md](./03-layout-mobile-shell.md) |
| ۴ | PWA Setup | [04-pwa-setup.md](./04-pwa-setup.md) |

---

## چک‌لیست فاز

- [ ] پروژه در `next/` با pnpm اجرا می‌شود
- [ ] `pnpm dev` بدون خطا
- [ ] Tailwind 4 + shadcn/ui نصب و یک Button تستی رندر می‌شود
- [ ] فونت Vazirmatn لود می‌شود
- [ ] `dir="rtl"` در root layout
- [ ] MobileShell در viewport ۱۹۲۰px قاب ۴۳۰px نشان می‌دهد
- [ ] manifest.json و آیکون PWA موجود است
- [ ] ESLint طبق best practices پیکربندی شده

---

## ترتیب اجرا

```
01 → 02 → 03 → 04
```

---

## معیار پذیرش

- `pnpm build` موفق
- صفحه تست با قاب موبایل، RTL، و یک کامپوننت shadcn نمایش داده شود
- Lighthouse: Manifest معتبر

---

## گام بعدی

→ [فاز ۲: هسته پلتفرم](../phase-02-core-platform/README.md)
