# ۷.۰۳ — Empty و Loading States

> **فاز:** ۷ · یکپارچه‌سازی  
> **اولویت:** P0

---

## چک‌لیست Empty State

| صفحه | پیام | CTA |
|------|------|-----|
| Provider — خدمات | هنوز خدمتی ثبت نکرده‌اید | افزودن خدمت |
| Provider — درخواست جدید | درخواست جدیدی ندارید | — |
| Provider — گزارشات | هنوز درآمدی ثبت نشده | — |
| Consumer — زمین‌ها | زمینی ثبت نشده | افزودن زمین |
| Consumer — درخواست‌ها | درخواستی ندارید | جستجوی خدمات |
| Consumer — نتایج جستجو | یافت نشد | بازگشت |
| Consumer — گزارشات | هزینه‌ای ثبت نشده | — |

## چک‌لیست Loading

- [ ] Skeleton برای لیست RequestCard
- [ ] Skeleton برای StatCards داشبورد
- [ ] Spinner در جستجو (۵۰۰ms mock delay)
- [ ] Suspense boundary در layout (اختیاری)

## Error States

- [ ] فرم: پیام خطای Zod فارسی
- [ ] 404 درخواست نامعتبر
- [ ] Toast برای خطاهای action

---

## معیار پذیرش

- [ ] هیچ لیست خالی بدون Empty State نباشد
- [ ] جستجو loading نشان دهد
