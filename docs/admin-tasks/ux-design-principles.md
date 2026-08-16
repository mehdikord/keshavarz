# اصول UX/UI پنل ادمین (سطح Metronic)

> هدف: پنل مدیریت **حرفه‌ای، مدرن، سریع و کاربرپسند** شبیه admin templateهای سطح بالا (Metronic / مشابه)، با هویت بصری کشاورز و RTL کامل.

## ۱) شخصیت محصول ادمین

- **Desktop-first** (حداقل ۱۴۴۰px طراحی اصلی؛ tablet قابل استفاده؛ موبایل فقط برای مشاهده اضطراری)
- تراکم اطلاعات بالا ولی بدون شلوغی؛ hierarchy واضح
- اپراتور باید در کمتر از ۳ کلیک به اکشن اصلی برسد
- جدا از Mobile Shell اپ؛ بدون Dock پایین

## ۲) ساختار Layout (الزامی)

```
┌──────────────────────────────────────────────────────────┐
│ Topbar: brand · breadcrumbs · global search · user menu  │
├────────────┬─────────────────────────────────────────────┤
│ Sidebar    │ Page header + primary actions               │
│ (collaps.) ├─────────────────────────────────────────────┤
│            │ Toolbar: search · filters · view options    │
│            ├─────────────────────────────────────────────┤
│            │ Content: DataTable / charts / detail        │
│            ├─────────────────────────────────────────────┤
│            │ Footer pagination / meta                    │
└────────────┴─────────────────────────────────────────────┘
```

الزامات:

- Sidebar جمع‌شو با حالت icon-only و حافظه preference
- Nested menu بر اساس دامنه (کاربران، عملیات، مالی، دسترسی، سیستم)
- Itemهای بدون permission نمایش داده نشوند (یا disabled با tooltip)
- Breadcrumb همیشه مسیر فعلی را نشان دهد
- Topbar ثابت؛ content scroll مستقل

## ۳) زبان بصری

- فونت: **Vazirmatn** (مشترک با اپ)
- رنگ‌ها: از design tokens پروژه + پالت admin خنثی برای سطوح زیاد داده (surface/muted/border)
- از تم‌های کلیشه‌ای AI (بنفش گرادیان، glow زیاد، pillهای متعدد) پرهیز شود
- Radius و shadow کنترل‌شده؛ DataTable لبه‌های تمیز
- Dark mode ادمین: اختیاری فاز ۱۳؛ MVP می‌تواند light حرفه‌ای باشد
- آیکون‌ها: lucide/consistent set؛ نه emoji

## ۴) الگوهای تعامل کلیدی (Metronic-like)

### ۴.۱ DataTable حرفه‌ای

- ستون‌های sticky برای actions
- Row hover + selected state
- Column visibility و density (comfortable/compact)
- Sort روی allow-list API
- Bulk actions فقط وقتی API پشتیبانی می‌کند (فعلاً بیشتر تک‌رکوردی)
- Copy public_id با یک کلیک

### ۴.۲ فیلترسازی حرفه‌ای

- جستجوی سریع همیشه در toolbar
- **Advanced Filter panel/drawer** برای فیلترهای چندفیلدی
- Active filter chips با حذف تکی و Clear all
- Apply/Reset صریح؛ فیلتر سنگین بدون Apply زده نشود مگر debounce جستجو
- همه فیلترها در URL (`nuqs` یا sync دستی searchParams)

### ۴.۳ صفحه‌بندی production-safe

- Cursor-based: دکمه «بعدی» بر اساس `meta.nextCursor` / `hasMore`
- انتخاب `limit`: ۲۰ / ۵۰ / ۱۰۰
- نمایش تقریبی تعداد فقط اگر API بدهد؛ در غیر این صورت «صفحه جاری از نتایج»
- هرگز کل دیتاست را client-side load نکن

### ۴.۴ Detail experience

- برای رکوردهای پیچیده (user/provider/request/payment): **صفحه جزئیات تب‌دار**
- برای اکشن سریع: Sheet/Drawer
- Timeline برای moderation / request history / audit

### ۴.۵ Forms و اکشن‌های حساس

- Zod + React Hook Form (یا الگوی موجود پروژه)
- Destructive actions: Dialog تأیید + دلیل اجباری در صورت نیاز API
- Optimistic UI ممنوع برای money/status transition؛ منتظر پاسخ API
- Toast موفق/خطا با `error.message` سرور؛ field errors کنار فیلد

## ۵) حالت‌های سیستم

هر صفحه لیست/جزئیات باید این‌ها را داشته باشد:

| State | رفتار |
|---|---|
| Loading | Skeleton هم‌شکل جدول/کارت |
| Empty | پیام اقدام‌پذیر |
| Error | Retry + requestId قابل کپی |
| Forbidden | توضیح کمبود مجوز، بدون لو دادن داده |
| Stale | Revalidate واضح بعد از mutation |

## ۶) دسترس‌پذیری و RTL

- RTL کامل؛ sidebar در راست
- Focus ring و keyboard navigation در جدول/منو
- Contrast مناسب برای متن ثانویه
- تاریخ شمسی در نمایش؛ ISO در payload

## ۷) عملکرد ادراک‌شده

- Route-level `loading.tsx` برای صفحات سنگین
- Prefetch جزئیات ردیف hovered (اختیاری، با احتیاط)
- Chartها lazy
- جلوگیری از waterfall: layout داده‌های permission را یک‌بار بگیرد

## ۸) چیزهایی که نباید انجام شود

- کارت‌های تزئینی بی‌کاربرد در داشبورد
- لود ۱۰۰۰ ردیف برای «فیلتر کلاینتی»
- مخفی کردن خطاهای API
- استفاده از id عددی داخلی در URL
- کپی عین قالب خارجی با برند Metronic؛ فقط الگو و کیفیت UX الهام گرفته شود
