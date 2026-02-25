<template>
  <div class="services-page">
    <n-space vertical :size="16" class="services-page-space">
      <!-- محدوده جغرافیایی کار -->
      <n-card bordered round class="service-card service-card--geo" content-style="padding: 1rem 1.25rem;">
        <div class="service-card-inner">
          <div class="service-card-icon service-card-icon--geo">
            <i class="fa-solid fa-location-dot"></i>
          </div>
          <div class="service-card-body">
            <n-text strong class="service-card-title">محدوده جغرافیایی کار</n-text>
            <n-text depth="2" class="service-card-desc">منطقه‌های تحت پوشش خدمات شما</n-text>
          </div>
          <i class="fa-solid fa-chevron-left service-card-arrow"></i>
        </div>
      </n-card>

      <!-- خدمات قابل ارائه -->
      <n-card bordered round class="service-card service-card--services" content-style="padding: 1rem 1.25rem;">
        <div class="service-card-inner">
          <div class="service-card-icon service-card-icon--services">
            <i class="fa-solid fa-screwdriver-wrench"></i>
          </div>
          <div class="service-card-body">
            <n-text strong class="service-card-title">خدمات قابل ارائه</n-text>
            <n-text depth="2" class="service-card-desc">ادوات و خدمات کشاورزی شما</n-text>
          </div>
          <i class="fa-solid fa-chevron-left service-card-arrow"></i>
        </div>
      </n-card>

      <!-- گالری تصاویر -->
      <n-card bordered round class="service-card service-card--gallery" content-style="padding: 1rem 1.25rem;">
        <div class="service-card-inner">
          <div class="service-card-icon service-card-icon--gallery">
            <i class="fa-solid fa-images"></i>
          </div>
          <div class="service-card-body">
            <n-text strong class="service-card-title">گالری تصاویر</n-text>
            <n-text depth="2" class="service-card-desc">تصاویر دستگاه‌ها و نمونه کارها</n-text>
          </div>
          <i class="fa-solid fa-chevron-left service-card-arrow"></i>
        </div>
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { NSpace, NCard, NText } from 'naive-ui'
</script>

<style scoped>
.services-page {
  min-height: calc(100vh - 140px);
}

.services-page-space {
  padding: 0.65rem;
}

.service-card {
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.service-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.service-card-inner {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.service-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.service-card-icon--geo {
  background-color: rgba(59, 130, 246, 0.15);
  color: #2563eb;
}

.service-card-icon--services {
  background-color: rgba(30, 107, 63, 0.15);
  color: #1e6b3f;
}

.service-card-icon--gallery {
  background-color: rgba(168, 85, 247, 0.15);
  color: #7c3aed;
}

.service-card-body {
  flex: 1;
  min-width: 0;
}

.service-card-title {
  font-size: 1rem;
  display: block;
  margin-bottom: 0.25rem;
}

.service-card-desc {
  font-size: 0.8125rem;
  display: block;
}

.service-card-arrow {
  font-size: 0.875rem;
  color: #9ca3af;
  flex-shrink: 0;
  transition: color 0.2s ease, transform 0.2s ease;
}

.service-card:hover .service-card-arrow {
  color: #6b7280;
  transform: translateX(-2px);
}
</style>
