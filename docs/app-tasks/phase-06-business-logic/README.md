# فاز ۶ — منطق کسب‌وکار

> **هدف:** اتصال Provider و Consumer با state machine و قوانین BR.  
> **مدت تخمینی:** ۲–۳ روز  
> **وابستگی:** [فاز ۴](../phase-04-provider-panel/) + [فاز ۵](../phase-05-consumer-panel/)

---

## مراحل

| # | موضوع | سند |
|---|--------|-----|
| ۱ | ماشین وضعیت درخواست | [01-request-state-machine.md](./01-request-state-machine.md) |
| ۲ | الگوریتم جستجو و تطبیق | [02-search-matching.md](./02-search-matching.md) |
| ۳ | حریم تماس و نمایش شماره | [03-contact-privacy.md](./03-contact-privacy.md) |
| ۴ | سیستم نوتیفیکیشن Mock | [04-notifications.md](./04-notifications.md) |

---

## قوانین حیاتی (BR)

| # | قانون |
|---|-------|
| BR-01 | فقط یک Provider per Request |
| BR-02 | قبول → حذف سایرین |
| BR-03 | شماره فقط در in_progress |
| BR-04 | اشتراک فعال برای جستجو |
| BR-05 | فاصله ≤ workRadiusKm |
| BR-06 | پایان کار فقط Consumer |
| BR-07 | لغو in_progress → دلیل اجباری |
| BR-08 | جستجو با نتیجه → ایجاد Request |
| BR-09 | رد Provider → غیرفعال در نتایج |

---

## چک‌لیست فاز

- [ ] تمام ۹ قانون BR پیاده‌سازی شده
- [ ] transitionهای invalid مسدود شده
- [ ] Haversine distance صحیح
- [ ] نوتیف برای رویدادهای کلیدی

---

## گام بعدی

→ [فاز ۷: یکپارچه‌سازی و پولیش](../phase-07-integration-polish/)
