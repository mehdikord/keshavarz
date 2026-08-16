# فاز ۰۵ — پروفایل، کاتالوگ، زمین و خدمات Provider

> **هدف:** APIهای پایه مورد نیاز پنل Consumer و Provider.  
> **وابستگی:** فاز ۰۳  
> **جداول:** کاتالوگ، `provider_profiles`, `provider_services`, price histories و `lands`

## مراحل

### ۰۵.۰۱ — کاتالوگ خواندنی اپ

- [x] لیست categoryهای فعال با ترتیب
- [x] لیست services فعال یک category
- [x] cache کنترل‌شده و invalidation پس از تغییر مدیریت
- [x] عدم نمایش soft-deleted/inactive

### ۰۵.۰۲ — CRUD زمین

- [x] list/create/detail/update/soft-delete
- [x] ownership در query
- [x] اعتبارسنجی عنوان، مساحت مثبت، lat/lng و توضیحات
- [x] منع حذف یا تعریف policy برای زمینی که Request تاریخی دارد
- [x] serialization فقط `public_id`

### ۰۵.۰۳ — پروفایل Provider و محدوده

- [x] upsert profile برای همان user
- [x] work center باید هر دو مختصات یا هر دو null باشد.
- [x] شعاع فقط ۲۰ تا ۱۰۰ کیلومتر
- [x] availability مستقل از active/approved
- [x] عدم فعال شدن در search تا تکمیل شرایط eligibility

### ۰۵.۰۴ — خدمات قابل ارائه

- [x] add/update/deactivate خدمت
- [x] جلوگیری از service تکراری برای Provider
- [x] قیمت حداقل ۱۰۰۰ تومان و pricing unit معتبر
- [x] ثبت history قیمت با actor provider
- [x] اجازه خدمت فقط از catalog فعال

### ۰۵.۰۵ — Dashboard پایه

- [x] count درخواست‌های جدید/درحال‌انجام
- [x] درآمد ماه جاری از completed
- [x] unread notifications
- [x] هشدار نبود اشتراک/محدوده/خدمت

## تست‌ها

- [x] IDOR زمین و provider service
- [x] duplicate service race
- [x] soft-deleted catalog/land
- [x] decimal precision مختصات و مساحت
- [x] update قیمت history می‌سازد

## معیار پذیرش

- [x] تمام داده‌ها با user جاری scope می‌شوند.
- [x] user می‌تواند هم Consumer و هم Provider باشد.
- [x] داده تاریخی با حذف catalog/profile از بین نمی‌رود.

## گزارش تکمیل

- **وضعیت:** تکمیل‌شده در 2026-08-04
- کاتالوگ خواندنی با slug عمومی، فیلتر active/soft-delete و cache ۶۰ث + `invalidateCatalogCache` پیاده شد.
- CRUD زمین با ownership در query، validation مختصات/مساحت، soft-delete با منع حذف در صورت سابقه Request انجام شد.
- پروفایل/work-area Provider با قواعد مختصات و شعاع ۲۰–۱۰۰، availability مستقل و eligibility جستجو پوشش داده شد.
- خدمات Provider با unique constraint، قیمت ≥۱۰۰۰، history قیمت و deactivation؛ dashboard شمارنده‌ها/درآمد/هشدار اضافه شد.
