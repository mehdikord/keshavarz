# فاز ۰ — برنامه‌ریزی و طراحی

> **هدف:** قبل از نوشتن کد، Design System، معماری اطلاعات و استراتژی داده Mock را قطعی کنیم.  
> **مدت تخمینی:** ۱–۲ روز  
> **وابستگی:** ندارد (اولین فاز)

---

## خروجی‌های این فاز

| # | خروجی | سند |
|---|--------|-----|
| ۱ | Design System (رنگ، تایپوگرافی، spacing، کامپوننت) | [01-design-system.md](./01-design-system.md) |
| ۲ | معماری اطلاعات و نقشه صفحات | [02-information-architecture.md](./02-information-architecture.md) |
| ۳ | استراتژی Mock Data و Seed | [03-mock-data-strategy.md](./03-mock-data-strategy.md) |

---

## چک‌لیست فاز

- [ ] Design System تأیید شده (پالت، فونت، سایه، radius)
- [ ] نقشه تمام routeها و navigation تأیید شده
- [ ] لیست کامل دسته‌بندی و خدمات Mock تعریف شده
- [ ] ساختار Zustand stores مشخص شده
- [ ] wireframe ذهنی هر صفحه کلیدی (حداقل ۱۰ صفحه) مستند شده
- [ ] تصمیم نهایی روی کتابخانه نمودار (recharts / chart.js)
- [ ] تصمیم نهایی روی تقویم شمسی Mock

---

## ترتیب اجرا

```
01-design-system.md  →  02-information-architecture.md  →  03-mock-data-strategy.md
```

---

## معیار پذیرش فاز ۰

- هر سه سند تکمیل و قابل اجرا برای توسعه‌دهنده باشد
- هیچ ابهامی در ترتیب Dock، وضعیت درخواست، یا قوانین نمایش شماره موبایل نماند
- پالت رنگ و فونت با PRD هم‌خوان باشد

---

## گام بعدی

پس از تأیید → [فاز ۱: زیرساخت](../phase-01-foundation/README.md)
