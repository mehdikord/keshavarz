# ۵.۰۶ — جزئیات درخواست (Consumer)

> **مسیر:** `/users/requests/[id]`  
> **اولویت:** P0

---

## تسک‌ها

### اطلاعات

- [ ] خدمت، زمین، تاریخ‌ها، وضعیت، قیمت
- [ ] Provider assign‌شده (در in_progress+)

### شماره تماس

- [ ] شماره Provider: فقط `in_progress` | `completed`
- [ ] BR-03

### اقدامات

| وضعیت | اقدام |
|--------|-------|
| `pending_provider` | لغو درخواست |
| `in_progress` | لغو (با دلیل) · **پایان کار** |
| `completed` | readonly |
| `cancelled` | نمایش دلیل |

### پایان کار

- [ ] دکمه سبز «پایان کار»
- [ ] ConfirmDialog
- [ ] فقط Consumer — BR-06
- [ ] → status `completed`

### لیست Providerها (در pending)

- [ ] وضعیت هر Provider: ارسال‌شده / رد / در انتظار

---

## معیار پذیرش

- [ ] پایان کار فقط Consumer
- [ ] لغو in_progress نیاز به دلیل
