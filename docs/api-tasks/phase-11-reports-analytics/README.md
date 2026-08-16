# فاز ۱۱ — گزارش‌ها، تحلیل و Export

> **هدف:** گزارش‌های مالی مطابق PRD و گزارش مدیریتی قابل اتکا.  
> **وابستگی:** فاز ۰۸ + ۱۰  
> **منبع مالی اصلی:** `v_completed_service_request_financials`

## مراحل

### ۱۱.۰۱ — گزارش Consumer

- [ ] جمع هزینه فقط Requestهای completed
- [ ] هزینه ماهانه سال جاری
- [ ] filter زمین و بازه تاریخ
- [ ] پرهزینه‌ترین خدمت/زمین
- [ ] timezone و ماه‌بندی شفاف

### ۱۱.۰۲ — گزارش Provider

- [ ] جمع درآمد completed
- [ ] درآمد ماهانه ۱۲ ماه
- [ ] درآمد سالانه
- [ ] پردرآمدترین خدمت
- [ ] filter بازه و service

### ۱۱.۰۳ — گزارش مدیریت

- [ ] GMV خدمات، درآمد اشتراک و refund
- [ ] funnel pending -> in-progress -> completed/cancelled
- [ ] کاربران/Providerهای فعال
- [ ] failure rate پرداخت و اعلان
- [ ] queryهای snapshot یا materialization در صورت نیاز

### ۱۱.۰۴ — Export

- [ ] export async برای داده بزرگ
- [ ] permission جداگانه، فیلتر ثابت و audit
- [ ] CSV injection protection
- [ ] signed download کوتاه‌عمر
- [ ] retention و cleanup فایل

## معیار پذیرش

- [ ] اعداد با query مرجع SQL reconcile می‌شوند.
- [ ] cancelled/pending وارد درآمد و هزینه نمی‌شوند.
- [ ] export باعث timeout Route Handler نمی‌شود.
- [ ] دسترسی report و export مستقل قابل کنترل است.
