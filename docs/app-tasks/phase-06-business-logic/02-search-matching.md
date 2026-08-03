# ۶.۰۲ — الگوریتم جستجو و تطبیق

> **فاز:** ۶ · منطق کسب‌وکار  
> **اولویت:** P0

---

## تسک‌ها

### ۱. Haversine (`lib/geo.ts`)

```typescript
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number
```

### ۲. `searchProviders(params)`

```typescript
interface SearchParams {
  landId: string;
  serviceId: string;
  scheduledDates: string[];
  consumerId: string;
}

interface SearchResult {
  providerId: string;
  displayName: string;
  distanceKm: number;
  price: number;
}
```

### ۳. فیلترها (به ترتیب)

1. [ ] `hasActiveSubscription(provider)`
2. [ ] `offersService(provider, serviceId)`
3. [ ] `haversine(workCenter, land.location) <= workRadiusKm`
4. [ ] exclude خود consumer (اگر dual role)

### ۴. `createRequestFromSearch`

- [ ] پس از جستجو با ≥۱ نتیجه
- [ ] ایجاد Request با status `pending_provider`
- [ ] ذخیره search params در request
- [ ] BR-08

### ۵. `sendRequestToProvider`

- [ ] ایجاد `RequestProvider` با status `sent`
- [ ] اگر request ندارد → ایجاد
- [ ] notify provider

### ۶. Sort helpers

```typescript
sortByPrice(results, 'asc' | 'desc')
sortByDistance(results, 'asc' | 'desc')
```

---

## معیار پذیرش

- [ ] Provider با شعاع ۳۰km در فاصله ۴۰km نیاید (مثال PRD)
- [ ] Provider بدون اشتراک نیاید
- [ ] فاصله تا ۱ رقم اعشار
