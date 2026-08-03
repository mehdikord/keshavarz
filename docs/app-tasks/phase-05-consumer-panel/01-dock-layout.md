# ۵.۰۱ — Consumer Dock و Layout

> **فاز:** ۵ · پنل خدمات‌گیرنده  
> **اولویت:** P0

---

## تسک‌ها

### ۱. `users/layout.tsx`

- [ ] مشابه Provider اما Dock جدا
- [ ] `ConsumerDock` component

### ۲. آیتم‌های Dock (RTL)

| label | href | icon |
|-------|------|------|
| درخواست‌ها | `/users/requests` | ClipboardList |
| جستجوی خدمات | `/users/search` | Search |
| داشبورد | `/users/home` | LayoutDashboard |
| زمین‌ها | `/users/lands` | MapPin |
| گزارشات مالی | `/users/reports` | PieChart |

### ۳. تفاوت بصری با Provider Dock

- [ ] accent color کمی متفاوت (نارنجی بیشتر) برای تمایز نقش
- [ ] یا همان سبز با آیکون‌های متفاوت

---

## معیار پذیرش

- [ ] Dock مستقل — تغییر در Provider روی Consumer اثر نگذارد
- [ ] ترتیب RTL دقیق PRD
