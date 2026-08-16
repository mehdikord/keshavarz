# فاز ۰۰ — طراحی سیستم، IA و استانداردها

> **هدف:** قبل از کدنویسی UI، هویت بصری ادمین، معماری اطلاعات، و استانداردهای فیلتر/صفحه‌بندی را قطعی کنیم.  
> **خط:** A + B (پایه مشترک)  
> **وابستگی:** ندارد  
> **خروجی:** اسناد طراحی قابل اجرای توسعه

## مراحل

### ۰۰.۰۱ — Design System ادمین

- [ ] تعریف tokens سطح ادمین (surface، border، sidebar، table density)
- [ ] تایپوگرافی صفحات داده (عنوان صفحه، toolbar، cell، meta)
- [ ] الگوی دکمه primary/secondary/destructive برای عملیات مدیریتی
- [ ] الهام از Metronic فقط در ساختار/تراکم؛ نه کپی برند
- [ ] هم‌راستایی با `docs/Best Practices` (Tailwind 4، shadcn، React 19، Next 16)

### ۰۰.۰۲ — Information Architecture

- [ ] نهایی‌سازی درخت منوی sidebar بر اساس permission modules
- [ ] تأیید routeهای [`screen-catalog.md`](../screen-catalog.md)
- [ ] تعیین الگوی list → detail برای هر دامنه سنگین
- [ ] تعیین صفحات تب‌دار (Provider، Request، Admin user)

### ۰۰.۰۳ — استانداردهای داده و لیست

- [ ] تأیید [`pagination-filtering-standard.md`](../pagination-filtering-standard.md)
- [ ] تأیید فیلتر حداقل هر دامنه در [`api-ui-mapping.md`](../api-ui-mapping.md)
- [ ] مشخص کردن gapهای احتمالی فیلتر Backend (لیست backlog کوچک)

### ۰۰.۰۴ — استراتژی مهاجرت اپ

- [ ] مرور [`mock-to-api-migration-matrix.md`](../mock-to-api-migration-matrix.md)
- [ ] تصمیم درباره feature flag موقت یا مهاجرت مستقیم دامنه به دامنه
- [ ] تصمیم state library: API hooks + Zustand نازک

## تحویل‌دادنی‌ها

```text
docs/admin-tasks/README.md
docs/admin-tasks/screen-catalog.md
docs/admin-tasks/api-ui-mapping.md
docs/admin-tasks/ux-design-principles.md
docs/admin-tasks/pagination-filtering-standard.md
docs/admin-tasks/mock-to-api-migration-matrix.md
docs/admin-tasks/phase-00-planning-design-system/README.md
```

## معیار پذیرش

- [ ] تیم می‌تواند بدون ابهام منوی ادمین و الگوی جدول را پیاده کند.
- [ ] قرارداد cursor pagination و فیلترهای حداقل تأیید شده است.
- [ ] مرز خط ادمین و مهاجرت اپ روشن است.
- [ ] هیچ کدنویسی UI اجباری در این فاز نیست؛ فقط تثبیت تصمیم‌ها.

## گام بعدی

[فاز ۰۱ — Admin Shell](../phase-01-admin-shell-foundation/) و/یا موازی [فاز ۱۰ — App Auth](../phase-10-app-api-client-auth/)
