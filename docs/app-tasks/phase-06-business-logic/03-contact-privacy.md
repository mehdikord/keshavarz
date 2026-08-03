# ۶.۰۳ — حریم تماس و نمایش شماره

> **فاز:** ۶ · منطق کسب‌وکار  
> **اولویت:** P0

---

## تسک‌ها

### ۱. Utility `canShowPhone(request, viewerRole)`

```typescript
// BR-03
return request.status === 'in_progress' || request.status === 'completed';
```

### ۲. `getContactInfo(request, viewerId)`

- [ ] اگر `canShowPhone` → return phone طرف مقابل
- [ ] else → return null + پیام «پس از قبول درخواست نمایش داده می‌شود»

### ۳. UI masking

- [ ] در ProviderResultCard: هیچ phone
- [ ] در Request detail pending: «مخفی»
- [ ] در in_progress: لینک `tel:`

### ۴. جلوگیری از leak

- [ ] audit: grep phone در search results components
- [ ] store همیشه phone دارد اما UI فیلتر می‌کند

---

## معیار پذیرش

- [ ] هیچ جایی در جستجو/نتایج شماره نباشد
- [ ] پس از accept هر دو طرف شماره ببینند
