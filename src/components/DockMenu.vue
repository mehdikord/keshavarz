<template>
  <div class="dock-menu">
    <div class="dock-content">
      <div
        v-for="(item, index) in menuItems"
        :key="index"
        class="dock-item"
        :class="{ 'dock-item-active': activeIndex === index }"
        @click="handleItemClick(index)"
      >
        <div class="dock-item-content">
          <i :class="item.icon" class="dock-icon"></i>
          <span class="dock-label">{{ item.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const menuItems = [
  { icon: 'fa-solid fa-user', label: 'پروفایل', route: '/profile' },
  { icon: 'fa-solid fa-search', label: 'جستجو خدمات', route: '/users/search' },
  { icon: 'fa-solid fa-seedling', label: 'کشاورز', route: '/users' },
  { icon: 'fa-solid fa-list', label: 'درخواست‌ها', route: '/users/requests' },
  { icon: 'fa-solid fa-arrow-right-arrow-left', label: 'تغییر پنل', route: '/' }
]

// محاسبه activeIndex بر اساس route فعلی
const activeIndex = computed(() => {
  const currentPath = route.path
  const index = menuItems.findIndex(item => item.route === currentPath)
  return index >= 0 ? index : -1
})

const handleItemClick = (index: number) => {
  const item = menuItems[index]
  if (item.route) {
    router.push(item.route)
  }
}

// به‌روزرسانی activeIndex وقتی route تغییر می‌کنه
watch(() => route.path, () => {
  // activeIndex به صورت computed است و خودش به‌روز می‌شه
})
</script>

<style scoped>
.dock-menu {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 428px;
  z-index: 1000;
  border-radius: 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  background: #ffffff;
  padding: 0.5rem 0;
  border-top: 1px solid #e5e7eb;
}

.dock-content {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0 0.5rem;
  gap: 0.25rem;
}

.dock-item {
  flex: 1;
  height: auto;
  padding: 0.75rem 0.5rem;
  min-width: 0;
  border-radius: 0.75rem;
  transition: all 0.2s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
}

.dock-item:hover {
  background-color: #f0fdf4;
}

.dock-item-active {
  background-color: #1e6b3f;
}

.dock-item-active .dock-icon {
  color: #ffffff;
}

.dock-item-active .dock-label {
  color: #ffffff;
}

.dock-item-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
}

.dock-icon {
  font-size: 1.375rem;
  line-height: 1;
  color: #6b7280;
  transition: all 0.2s ease;
}

.dock-item:hover .dock-icon {
  color: #1e6b3f;
}

.dock-label {
  font-size: 0.6875rem;
  font-weight: 500;
  font-family: 'Vazirmatn', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  color: #6b7280;
  transition: all 0.2s ease;
}

.dock-item:hover .dock-label {
  color: #1e6b3f;
}

/* Safe area support for iOS */
@supports (padding: max(0px)) {
  .dock-menu {
    padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
  }
}

/* Mobile optimizations */
@media (max-width: 428px) {
  .dock-menu {
    max-width: 100%;
  }
  
  .dock-content {
    padding: 0 0.25rem;
  }
  
  .dock-item {
    padding: 0.5rem 0.125rem;
  }
  
  .dock-icon {
    font-size: 1.125rem;
  }
  
  .dock-label {
    font-size: 0.5625rem;
  }
}
</style>

