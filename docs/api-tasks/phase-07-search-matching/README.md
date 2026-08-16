# فاز ۰۷ — جستجو و تطبیق خدمات‌دهنده

> **هدف:** جستجوی Provider واجد شرایط بدون افشای اطلاعات تماس.  
> **وابستگی:** فاز ۰۵ + ۰۶  
> **منبع خواندن:** `v_searchable_provider_services`

## مراحل

### ۰۷.۰۱ — ورودی جستجو

- [ ] land متعلق به Consumer و active باشد.
- [ ] category/service فعال و رابطه آن‌ها معتبر باشد.
- [ ] حداقل یک تاریخ غیرتکراری و غیرگذشته
- [ ] consumer note با محدودیت طول
- [ ] ساخت search context کوتاه‌عمر یا signed criteria برای جلوگیری از tampering

### ۰۷.۰۲ — query تطبیق

- [ ] filter اولیه با `service_id`
- [ ] حذف provider profile متعلق به user جستجوکننده
- [ ] محاسبه Haversine با مختصات زمین
- [ ] شرط distance <= `work_radius_km`
- [ ] eligibility شامل user/profile/service/catalog/subscription active

### ۰۷.۰۳ — خروجی و مرتب‌سازی

- [ ] provider public id، نام، distance، price و pricing unit
- [ ] عدم نمایش phone، مختصات مرکز کار و اطلاعات خصوصی
- [ ] sort: price asc/desc و distance asc/desc
- [ ] pagination پایدار با tie-breaker
- [ ] نمایش status قبلی sent/rejected برای همان search/request در صورت وجود

### ۰۷.۰۴ — consistency و performance

- [ ] query plan و indexها با داده حجیم
- [ ] دقت Decimal و rounding فاصله فقط در presentation
- [ ] snapshot قیمت و فاصله هنگام ارسال Request
- [ ] revalidate eligibility هنگام ایجاد/ارسال Request، نه اعتماد به نتیجه قدیمی

## تست‌ها

- [ ] مرز دقیق شعاع
- [ ] اشتراک منقضی یا آینده
- [ ] provider unavailable/inactive
- [ ] service غیرفعال
- [ ] عدم نمایش خود کاربر
- [ ] sort و pagination بدون duplicate/missing

## معیار پذیرش

- [ ] شروط BR-04 و BR-05 در query و تست اثبات شده‌اند.
- [ ] هیچ شماره تماس یا work center خام در response نیست.
- [ ] نتیجه stale بدون revalidation قابل تبدیل به Request نیست.
