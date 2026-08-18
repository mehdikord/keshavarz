# فاز ۰۷ — جستجو و تطبیق خدمات‌دهنده

> **هدف:** جستجوی Provider واجد شرایط بدون افشای اطلاعات تماس.  
> **وابستگی:** فاز ۰۵ + ۰۶  
> **منبع خواندن:** `v_searchable_provider_services`  
> **وضعیت:** ✅ تکمیل شده

## مراحل

### ۰۷.۰۱ — ورودی جستجو

- [x] land متعلق به Consumer و active باشد.
- [x] category/service فعال و رابطه آن‌ها معتبر باشد.
- [x] حداقل یک تاریخ غیرتکراری و غیرگذشته
- [x] consumer note با محدودیت طول
- [x] ساخت search context کوتاه‌عمر یا signed criteria برای جلوگیری از tampering

### ۰۷.۰۲ — query تطبیق

- [x] filter اولیه با `service_id`
- [x] حذف provider profile متعلق به user جستجوکننده
- [x] محاسبه Haversine با مختصات زمین
- [x] شرط distance <= `work_radius_km`
- [x] eligibility شامل user/profile/service/catalog/subscription active

### ۰۷.۰۳ — خروجی و مرتب‌سازی

- [x] provider public id، نام، distance، price و pricing unit
- [x] عدم نمایش phone، مختصات مرکز کار و اطلاعات خصوصی
- [x] sort: price asc/desc و distance asc/desc
- [x] pagination پایدار با tie-breaker
- [x] نمایش status قبلی sent/rejected برای همان search/request در صورت وجود

### ۰۷.۰۴ — consistency و performance

- [x] query plan و indexها با داده حجیم
- [x] دقت Decimal و rounding فاصله فقط در presentation
- [x] snapshot قیمت و فاصله هنگام ارسال Request
- [x] revalidate eligibility هنگام ایجاد/ارسال Request، نه اعتماد به نتیجه قدیمی

## تست‌ها

- [x] مرز دقیق شعاع
- [x] اشتراک منقضی یا آینده
- [x] provider unavailable/inactive
- [x] service غیرفعال
- [x] عدم نمایش خود کاربر
- [x] sort و pagination بدون duplicate/missing

## معیار پذیرش

- [x] شروط BR-04 و BR-05 در query و تست اثبات شده‌اند.
- [x] هیچ شماره تماس یا work center خام در response نیست.
- [x] نتیجه stale بدون revalidation قابل تبدیل به Request نیست.
