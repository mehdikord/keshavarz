# ۵.۰۴ — جریان جستجوی خدمات (Consumer)

> **مسیر:** `/users/search` · `/users/search/results`  
> **اولویت:** P0 — **مهم‌ترین بخش**

---

## صفحه فرم `/users/search`

### فیلدها

- [ ] Select زمین (از lands کاربر)
- [ ] Select دسته‌بندی
- [ ] Select خدمت (cascading — disabled تا دسته انتخاب شود)
- [ ] `PersianCalendar` — multi-date
- [ ] نمایش chips تاریخ‌های انتخاب‌شده
- [ ] دکمه «جستجوی خدمات» full-width

### اعتبارسنجی

- [ ] اگر lands خالی → redirect یا modal «ابتدا زمین اضافه کنید»
- [ ] حداقل ۱ تاریخ
- [ ] Zod `searchFormSchema`

### UI

- [ ] کارت فرم با آیکون Search
- [ ] انیمیشن cascading select

---

## صفحه نتایج `/users/search/results`

### هدر

- [ ] خلاصه: خدمت + زمین
- [ ] تعداد نتایج

### مرتب‌سازی

- [ ] Select: کمترین قیمت · بیشترین قیمت · کمترین فاصله · بیشترین فاصله

### ProviderResultCard

هر کارت:
- [ ] نام Provider (displayName)
- [ ] فاصله (km) — `DistanceDisplay`
- [ ] قیمت — `PriceDisplay`
- [ ] **بدون شماره موبایل**
- [ ] دکمه «ارسال درخواست»

### حالت‌های دکمه

| حالت | UI |
|------|-----|
| اولیه | «ارسال درخواست» primary |
| ارسال‌شده | «در انتظار تایید» disabled amber |
| رد شده | غیرفعال + «درخواست توسط خدمات‌دهنده پذیرفته نشد» |
| قبول شده (توسط دیگری) | حذف از لیست یا «تخصیص به Provider دیگر» |

### Empty Results

- [ ] «خدمات‌دهنده‌ای در محدوده یافت نشد»
- [ ] پیشنهاد: افزایش محدوده / خدمت دیگر

### منطق (فاز ۶ وصل می‌شود)

- [ ] `searchProviders(land, serviceId)` 
- [ ] ایجاد Request در store
- [ ] `sendRequestToProvider(requestId, providerId)`

---

## معیار پذیرش

- [ ] BR-04, BR-05, BR-08 رعایت شود
- [ ] شماره Provider نمایش داده نشود
- [ ] مرتب‌سازی درست کار کند
