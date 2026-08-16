# فاز ۱۱ — دامنه‌های اصلی اپ (پروفایل تا درخواست)

> **هدف:** اتصال صفحات Consumer/Provider موجود به API واقعی برای کاتالوگ، زمین، پروفایل Provider، جستجو و چرخه درخواست.  
> **خط:** B  
> **وابستگی:** فاز ۱۰  
> **اصل:** حفظ URL و UX فعلی؛ تعویض data source

## مراحل

### ۱۱.۰۱ — Profile & catalog

- [x] `/profile` و داده‌های کاربر از `/me` (+ image upload/delete)
- [x] کاتالوگ از `/catalog/*` به‌جای `lib/mock/catalog`
- [x] حذف persist کاتالوگ ثابت از store یا تبدیل به cache API

### ۱۱.۰۲ — Consumer lands

- [x] لیست/ایجاد/ویرایش/حذف زمین روی `/lands*`
- [x] نگه‌داشتن UI نقشه فعلی؛ ذخیره مختصات واقعی در API
- [x] pagination اگر لیست زمین رشد کند

### ۱۱.۰۳ — Provider profile & services

- [x] `/provider/profile`, `/provider/work-area`
- [x] CRUD خدمات Provider روی `/provider/services*`
- [x] داشبورد Provider از `/provider/dashboard`

### ۱۱.۰۴ — Search & matching

- [x] جایگزینی `lib/search/search-providers` با:
  - `POST /service-searches`
  - `GET /service-searches/{id}/providers`
- [x] حفظ فیلتر/مرتب‌سازی UI در چارچوب query API
- [x] cursor برای نتایج

### ۱۱.۰۵ — Request lifecycle

- [x] ایجاد درخواست: `POST /service-requests` (+ providers اضافه)
- [x] Consumer list/detail/cancel/complete
- [x] Provider inbox/view/accept/reject/cancel
- [x] حذف state machine تکراری که با BR سرور تعارض دارد؛ UI فقط transitionهای مجاز را نشان دهد

### ۱۱.۰۶ — پاکسازی تدریجی store

- [x] `consumer-store` / `provider-store` / `request-store` نازک شوند
- [x] داده دامنه از API خوانده شود نه seed

## معیار پذیرش

- [x] ایجاد زمین، جستجو، ارسال درخواست، قبول Provider، تکمیل Consumer روی DB واقعی end-to-end کار می‌کند.
- [x] همان درخواست در پنل ادمین `/admins/service-requests` دیده می‌شود.
- [x] کاتالوگ اپ با کاتالوگ ادمین یکی است.
- [x] منطق matching دیگر از آرایه mock کاربران تغذیه نمی‌شود.

## گام بعدی

[فاز ۱۲ — تجارت، اعلان، گزارش](../phase-12-app-commerce-notifications/)
