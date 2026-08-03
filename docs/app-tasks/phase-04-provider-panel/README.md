# فاز ۴ — پنل خدمات‌دهنده (Provider)

> **هدف:** پیاده‌سازی کامل ۵ صفحه + Dock با طراحی حرفه‌ای.  
> **مدت تخمینی:** ۳–۴ روز  
> **وابستگی:** [فاز ۲](../phase-02-core-platform/)

---

## مراحل

| # | صفحه | مسیر | سند |
|---|------|------|-----|
| ۱ | Dock + Layout | — | [01-dock-layout.md](./01-dock-layout.md) |
| ۲ | داشبورد | `/providers/home` | [02-dashboard.md](./02-dashboard.md) |
| ۳ | خدمات من | `/providers/services` | [03-services-page.md](./03-services-page.md) |
| ۴ | درخواست‌ها | `/providers/requests` | [04-requests-page.md](./04-requests-page.md) |
| ۵ | جزئیات درخواست | `/providers/requests/[id]` | [05-request-detail.md](./05-request-detail.md) |
| ۶ | گزارشات | `/providers/reports` | [06-reports.md](./06-reports.md) |
| ۷ | اشتراک‌ها | `/providers/subscription` | [07-subscription.md](./07-subscription.md) |

---

## ترتیب Dock (RTL — راست به چپ)

```
ارائه خدمات | درخواست‌ها | داشبورد | گزارشات | اشتراک‌ها
```

---

## چک‌لیست فاز

- [ ] Dock با glassmorphism و active state
- [ ] داشبورد با stat cards و نوتیف
- [ ] محدوده کاری: MapPicker + slider ۲۰–۱۰۰ km
- [ ] خدمات قابل ارائه: CRUD با دسته‌بندی
- [ ] ۴ تب درخواست
- [ ] صفحه جزئیات با قبول/رد/لغو
- [ ] نمودار درآمد
- [ ] خرید اشتراک Mock

---

## گام بعدی

→ [فاز ۶: منطق کسب‌وکار](../phase-06-business-logic/)
