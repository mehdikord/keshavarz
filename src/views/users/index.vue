<template>
  <n-space vertical :size="24" style="padding: 0.65rem;">
    <!-- Weather Widget -->
    <WeatherWidget />

    <!-- Lands Card -->
    <router-link to="/users/lands" style="text-decoration: none; display: block;">
      <n-card :bordered="false" class="lands-card" :style="{ '--bg-image': `url(${landsBg})` }">
        <div class="lands-card-content">
          <n-text strong style="font-size: 1.5rem; color: #ffffff;">
            زمین های من
          </n-text>
          <n-text style="font-size: 1rem; color: rgba(255, 255, 255, 0.9); display: block; margin-top: 0.5rem;">
            لیست زمین های کشاورزی
          </n-text>
        </div>
      </n-card>
    </router-link>

    <!-- Active Request Card -->
    <div class="active-request-wrapper">
      <!-- Card Header -->
      <div class="active-request-header">
        <i class="fa-solid fa-clipboard-list active-request-header-icon"></i>
        <span class="active-request-header-title">درخواست فعال</span>
      </div>

      <!-- Loading -->
      <div v-if="loadingRequest" class="active-request-loading">
        <n-spin size="small" />
      </div>

      <!-- Has active request -->
      <router-link v-else-if="activeRequest" to="/users/search" class="active-request-link">
        <div class="active-request-body">
          <div class="request-row request-row-between">
            <div class="request-row-right">
              <div class="request-icon-wrap request-icon-green">
                <i class="fa-solid fa-layer-group"></i>
              </div>
              <div class="request-row-text">
                <span class="request-label">زمین</span>
                <span class="request-value">{{ activeRequest.land?.title || '-' }}</span>
              </div>
            </div>
            <div class="request-area-badge">
              <i class="fa-solid fa-ruler-combined request-area-badge-icon"></i>
              <span>{{ formatNumber(Number(activeRequest.area)) }} م‌م</span>
            </div>
          </div>

          <div class="request-row">
            <div class="request-icon-wrap request-icon-red">
              <i class="fa-solid fa-tractor"></i>
            </div>
            <div class="request-row-text">
              <span class="request-label">دستگاه</span>
              <span class="request-value">{{ activeRequest.implement?.name || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="active-request-footer">
          <span class="active-request-footer-text">مشاهده جزئیات</span>
          <i class="fa-solid fa-arrow-left active-request-footer-icon"></i>
        </div>
      </router-link>

      <!-- No active request -->
      <div v-else class="active-request-empty">
        <i class="fa-solid fa-inbox active-request-empty-icon"></i>
        <span class="active-request-empty-text">درخواست فعالی ندارید</span>
      </div>
    </div>
  </n-space>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NSpace, NCard, NText, NIcon, NSpin } from 'naive-ui'
import WeatherWidget from '../../components/WeatherWidget.vue'
import landsBg from '../../assets/images/backgrounds/lands-bg.png'
import api from '../../utils/api'

interface ActiveRequestItem {
  id: number
  area: string
  land: {
    id: number
    title: string
    area: number
  }
  implement: {
    id: number
    name: string
    image: string | null
  }
}

const loadingRequest = ref(true)
const activeRequest = ref<ActiveRequestItem | null>(null)

const formatNumber = (value: number | null): string => {
  if (value === null || value === undefined || isNaN(value)) return '-'
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

async function fetchActiveRequest() {
  loadingRequest.value = true
  try {
    const { data } = await api.get('/users/search/requests/pending')
    if (data?.result?.length > 0) {
      activeRequest.value = data.result[0]
    } else {
      activeRequest.value = null
    }
  } catch {
    activeRequest.value = null
  } finally {
    loadingRequest.value = false
  }
}

onMounted(() => {
  fetchActiveRequest()
})
</script>

<style scoped>
.lands-card {
  width: 100%;
  position: relative;
  overflow: hidden;
  background-image: var(--bg-image);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 1rem;
}

.lands-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: var(--bg-image);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(1px);
  z-index: 0;
}

.lands-card-content {
  position: relative;
  z-index: 1;
  padding: 1rem 1.5rem 1.5rem 1.5rem;
}

.active-request-wrapper {
  border-radius: 1rem;
  overflow: hidden;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 60%, #bbf7d0 100%);
  box-shadow: 0 4px 20px rgba(30, 107, 63, 0.12);
}

.active-request-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.25rem 0.75rem;
}

.active-request-header-icon {
  font-size: 1.1rem;
  color: #1e6b3f;
}

.active-request-header-title {
  font-size: 1rem;
  font-weight: 700;
  color: #14532d;
  font-family: 'Vazirmatn', sans-serif;
}

.active-request-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.active-request-body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 0.5rem 1.25rem 0.75rem;
}

.request-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.request-row-between {
  justify-content: space-between;
}

.request-row-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.request-area-badge {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(245, 158, 11, 0.15);
  color: #b45309;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.3rem 0.6rem;
  border-radius: 8px;
  font-family: 'Vazirmatn', sans-serif;
  white-space: nowrap;
}

.request-area-badge-icon {
  font-size: 0.7rem;
}

.request-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.request-icon-green {
  background: rgba(30, 107, 63, 0.15);
  color: #1e6b3f;
}

.request-icon-amber {
  background: rgba(245, 158, 11, 0.15);
  color: #b45309;
}

.request-icon-red {
  background: rgba(208, 48, 80, 0.15);
  color: #d03050;
}

.request-row-text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.request-label {
  font-size: 0.7rem;
  color: #6b7280;
  font-family: 'Vazirmatn', sans-serif;
}

.request-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1f2937;
  font-family: 'Vazirmatn', sans-serif;
}

.active-request-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  background: rgba(30, 107, 63, 0.08);
  border-top: 1px solid rgba(30, 107, 63, 0.12);
  transition: background 0.2s;
}

.active-request-link:hover .active-request-footer {
  background: rgba(30, 107, 63, 0.14);
}

.active-request-footer-text {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e6b3f;
  font-family: 'Vazirmatn', sans-serif;
}

.active-request-footer-icon {
  font-size: 0.75rem;
  color: #1e6b3f;
  transition: transform 0.2s;
}

.active-request-link:hover .active-request-footer-icon {
  transform: translateX(-4px);
}

.active-request-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
}

.active-request-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem 1rem;
}

.active-request-empty-icon {
  font-size: 2.5rem;
  color: #9ca3af;
}

.active-request-empty-text {
  font-size: 0.875rem;
  color: #9ca3af;
  font-family: 'Vazirmatn', sans-serif;
}
</style>
