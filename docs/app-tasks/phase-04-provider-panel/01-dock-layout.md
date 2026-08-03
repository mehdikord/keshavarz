# ۴.۰۱ — Provider Dock و Layout

> **فاز:** ۴ · پنل خدمات‌دهنده  
> **اولویت:** P0

---

## هدف

Layout اختصاصی Provider با Dock Navigation حرفه‌ای.

---

## تسک‌ها

### ۱. `providers/layout.tsx`

- [ ] `MobileShell` + `AuthGuard`
- [ ] `ProviderDock` fixed bottom
- [ ] `PageContainer` با `pb-24`

### ۲. کامپوننت `DockNav`

```tsx
interface DockItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}
```

**آیتم‌ها (RTL):**

| label | href | icon |
|-------|------|------|
| ارائه خدمات | `/providers/services` | Wrench |
| درخواست‌ها | `/providers/requests` | Inbox |
| داشبورد | `/providers/home` | LayoutDashboard |
| گزارشات | `/providers/reports` | BarChart3 |
| اشتراک‌ها | `/providers/subscription` | CreditCard |

### ۳. طراحی Dock

- [ ] Glassmorphism: `backdrop-blur-xl bg-white/80`
- [ ] سایه بالا: `shadow-dock`
- [ ] Active: رنگ primary + scale icon
- [ ] Center item (داشبورد): بزرگ‌تر — FAB style
- [ ] Badge تعداد درخواست جدید روی «درخواست‌ها»
- [ ] Safe area inset bottom

### ۴. انیمیشن

- [ ] transition 200ms بین active states
- [ ] ripple on tap (اختیاری)

---

## فایل‌های خروجی

```
src/app/providers/layout.tsx
src/components/layout/dock-nav.tsx
src/components/providers-panel/provider-dock.tsx
```

---

## معیار پذیرش

- [ ] ترتیب RTL دقیق مطابق PRD
- [ ] active route highlight صحیح
- [ ] Dock روی تمام صفحات Provider ثابت
