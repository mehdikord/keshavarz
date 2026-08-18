# فاز ۱۱ — گزارش‌ها، تحلیل و Export

> **هدف:** گزارش‌های مالی مطابق PRD و گزارش مدیریتی قابل اتکا.  
> **وابستگی:** فاز ۰۸ + ۱۰  
> **منبع مالی اصلی:** `v_completed_service_request_financials`  
> **وضعیت:** ✅ تکمیل شده

## مراحل

### ۱۱.۰۱ — گزارش Consumer

- [x] جمع هزینه فقط Requestهای completed
- [x] هزینه ماهانه سال جاری
- [x] filter زمین و بازه تاریخ
- [x] پرهزینه‌ترین خدمت/زمین
- [x] timezone و ماه‌بندی شفاف

### ۱۱.۰۲ — گزارش Provider

- [x] جمع درآمد completed
- [x] درآمد ماهانه ۱۲ ماه
- [x] درآمد سالانه
- [x] پردرآمدترین خدمت
- [x] filter بازه و service

### ۱۱.۰۳ — گزارش مدیریت

- [x] GMV خدمات، درآمد اشتراک و refund
- [x] funnel pending → in-progress → completed/cancelled
- [x] کاربران/Providerهای فعال
- [x] failure rate پرداخت و اعلان
- [x] queryهای snapshot یا materialization در صورت نیاز

### ۱۱.۰۴ — Export

- [x] export async برای داده بزرگ
- [x] permission جداگانه، فیلتر ثابت و audit
- [x] CSV injection protection
- [x] signed download کوتاه‌عمر
- [x] retention و cleanup فایل

## معیار پذیرش

- [x] اعداد با query مرجع SQL reconcile می‌شوند.
- [x] cancelled/pending وارد درآمد و هزینه نمی‌شوند.
- [x] export باعث timeout Route Handler نمی‌شود.
- [x] دسترسی report و export مستقل قابل کنترل است.
