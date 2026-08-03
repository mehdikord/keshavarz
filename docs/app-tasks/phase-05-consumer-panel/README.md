# فاز ۵ — پنل خدمات‌گیرنده (Consumer)

> **هدف:** پیاده‌سازی کامل ۶ صفحه + Dock + جریان جستجو.  
> **مدت تخمینی:** ۳–۴ روز  
> **وابستگی:** [فاز ۲](../phase-02-core-platform/)

---

## مراحل

| # | صفحه | مسیر | سند |
|---|------|------|-----|
| ۱ | Dock + Layout | — | [01-dock-layout.md](./01-dock-layout.md) |
| ۲ | داشبورد | `/users/home` | [02-dashboard.md](./02-dashboard.md) |
| ۳ | زمین‌های من | `/users/lands` | [03-lands-page.md](./03-lands-page.md) |
| ۴ | جستجو + نتایج | `/users/search` | [04-search-flow.md](./04-search-flow.md) |
| ۵ | درخواست‌ها | `/users/requests` | [05-requests-page.md](./05-requests-page.md) |
| ۶ | جزئیات درخواست | `/users/requests/[id]` | [06-request-detail.md](./06-request-detail.md) |
| ۷ | گزارشات مالی | `/users/reports` | [07-reports.md](./07-reports.md) |

---

## ترتیب Dock (RTL — راست به چپ)

```
درخواست‌ها | جستجوی خدمات | داشبورد | زمین‌ها | گزارشات مالی
```

---

## چک‌لیست فاز

- [ ] Dock Consumer مستقل از Provider
- [ ] CRUD زمین با MapPicker
- [ ] فرم جستجو: زمین + دسته + خدمت + تقویم
- [ ] صفحه نتایج با مرتب‌سازی و ارسال درخواست
- [ ] ۴ تب درخواست
- [ ] پایان کار فقط توسط Consumer
- [ ] نمودار هزینه

---

## گام بعدی

→ [فاز ۶: منطق کسب‌وکار](../phase-06-business-logic/)
