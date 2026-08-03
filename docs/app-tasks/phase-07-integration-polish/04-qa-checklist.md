# ۷.۰۴ — چک‌لیست QA نهایی

> **فاز:** ۷ · تحویل Mock  
> **اولویت:** P0

---

## A. فنی

- [ ] `pnpm build` بدون error
- [ ] `pnpm lint` بدون error
- [ ] TypeScript strict — بدون `any` غیرضروری
- [ ] تمام routeهای PRD کار می‌کنند
- [ ] localStorage persist بعد از refresh
- [ ] PWA manifest معتبر

## B. UI/UX

- [ ] فونت Vazirmatn همه جا
- [ ] RTL صحیح — icon flip در صورت نیاز
- [ ] قاب ۴۳۰px در ۱۹۲۰px
- [ ] Dock ثابت و Safe Area
- [ ] اعداد فارسی
- [ ] تاریخ شمسی
- [ ] تم کشاورزی قابل تشخیص

## C. احراز هویت

- [ ] AUTH-01 تا AUTH-06
- [ ] کاربر جدید: «کاربر کشاورز»
- [ ] Route guard

## D. Provider

- [ ] Dock ترتیب RTL
- [ ] محدوده ۲۰–۱۰۰ km
- [ ] CRUD خدمات
- [ ] ۴ تب درخواست
- [ ] قبول/رد/لغو
- [ ] گزارشات نمودار
- [ ] اشتراک Mock

## E. Consumer

- [ ] Dock ترتیب RTL
- [ ] CRUD زمین
- [ ] جستجو + cascading + تقویم
- [ ] نتایج + مرتب‌سازی
- [ ] ارسال درخواست چندگانه
- [ ] ۴ تب درخواست
- [ ] پایان کار فقط Consumer
- [ ] گزارشات هزینه

## F. قوانین کسب‌وکار

- [ ] BR-01 تا BR-09

## G. دستگاه‌ها

- [ ] Chrome mobile emulation ۳۹۰×۸۴۴
- [ ] Safari iOS (اگر ممکن)
- [ ] Desktop centered shell

## H. مستندات

- [ ] README در `next/` با دستور اجرا
- [ ] OTP mock code در README

---

## تعریف Done

همه موارد P0 تیک خورده + سناریو ۱ E2E پاس شده = **Mock آماده تحویل**

---

## پس از تحویل

گزینه‌های فاز بعد:
1. Backend واقعی (Prisma + API)
2. SMS OTP (Kavenegar / ...)
3. Mapbox نقشه زنده
4. درگاه پرداخت اشتراک
5. Push notifications
