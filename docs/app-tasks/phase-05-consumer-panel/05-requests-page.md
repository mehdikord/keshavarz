# ۵.۰۵ — صفحه درخواست‌ها (Consumer)

> **مسیر:** `/users/requests`  
> **اولویت:** P0

---

## تسک‌ها

### Tabs

| تب | فیلتر |
|----|--------|
| در انتظار تایید | `pending_provider` |
| در حال انجام | `in_progress` |
| پایان‌یافته | `completed` |
| لغوشده | `cancelled` |

### RequestCard (Consumer view)

- [ ] نام خدمت
- [ ] زمین
- [ ] تاریخ‌ها
- [ ] تعداد Providerهای در انتظار (در pending)
- [ ] نام Provider (در in_progress)
- [ ] قیمت
- [ ] دکمه جزئیات

### تب pending — اقدامات

- [ ] لغو کل درخواست
- [ ] لینک به نتایج جستجو (ارسال به Providerهای بیشتر)

### Empty States

- [ ] هر تب پیام اختصاصی

---

## معیار پذیرش

- [ ] فقط درخواست‌های consumerId = me
- [ ] لغو pending → حذف از همه Providerها
