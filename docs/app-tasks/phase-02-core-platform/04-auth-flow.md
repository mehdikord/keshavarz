# ۲.۰۴ — جریان احراز هویت Mock

> **فاز:** ۲ · هسته پلتفرم  
> **اولویت:** P0

---

## هدف

ورود دو مرحله‌ای Mock + Route Guard.

---

## تسک‌ها

### ۱. صفحه `/auth`

**مرحله ۱ — شماره موبایل:**
- [ ] Input با mask `09XX XXX XXXX`
- [ ] اعتبارسنجی Zod
- [ ] دکمه «دریافت کد»

**مرحله ۲ — OTP:**
- [ ] `OTPInput` ۵ رقمی
- [ ] نمایش کد Mock در dev: «کد: 12345»
- [ ] تایمر ۱۲۰ ثانیه (نمایشی)
- [ ] دکمه «ورود»

### ۲. منطق login

```typescript
login(phone, otp) {
  if (otp !== '12345') return false;
  const existing = findUserByPhone(phone);
  if (existing) setUser(existing);
  else setUser({ id: uuid(), phone, displayName: 'کاربر کشاورز', ... });
  return true;
}
```

### ۳. Route Guard

- [ ] `middleware.ts` یا client-side `AuthGuard` component
- [ ] مسیرهای محافظت‌شده `/providers/*`, `/users/*`, `/profile` → redirect `/auth`
- [ ] `/auth` اگر لاگین → redirect `/`

**توجه:** Mock با client guard کافی است (بدون JWT).

### ۴. Logout

- [ ] دکمه خروج در Landing/Profile
- [ ] clear auth store (نه کل storage)

### ۵. UI طراحی صفحه Auth

- [ ] پس‌زمینه gradient کشاورزی
- [ ] لوگو کشاورز بالا
- [ ] کارت فرم سفید با shadow
- [ ] انیمیشن slide بین مراحل

---

## فایل‌های خروجی

```
src/app/(auth)/auth/page.tsx
src/components/shared/auth-guard.tsx
src/components/shared/otp-input.tsx
```

---

## معیار پذیرش

- [ ] `09123456789` + `12345` → ورود موفق
- [ ] کاربر جدید → نام «کاربر کشاورز»
- [ ] دسترسی `/providers/home` بدون login → `/auth`
- [ ] logout → `/auth`
