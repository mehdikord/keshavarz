<template>
  <div class="requests-page">
    <n-tabs
      v-model:value="activeTab"
      type="segment"
      size="large"
      class="requests-tabs"
      :theme-overrides="tabThemeOverrides"
    >
      <n-tab-pane name="pending" tab="در انتظار">
        <div class="tab-pane-content tab-pane-content--list">
          <div class="tab-guide-text">
            <i class="fa-solid fa-circle-info tab-guide-icon"></i>
            <n-text class="tab-guide-label">برای مشاهده جزئیات درخواست روی آن کلیک کنید</n-text>
          </div>

          <template v-if="loadingPending">
            <div class="request-cards">
              <n-card v-for="i in 3" :key="i" bordered round class="request-card request-card--filled request-card--skeleton">
                <div class="request-card-body">
                  <n-skeleton text :repeat="3" />
                  <n-skeleton height="18" width="50%" class="request-card-skeleton-last" />
                </div>
              </n-card>
            </div>
          </template>
          <n-empty
            v-else-if="pendingList.length === 0"
            description="درخواستی در انتظار ندارید"
            class="tab-empty"
          />
          <div v-else class="request-cards">
            <router-link
              v-for="item in pendingList"
              :key="item.id"
              :to="`/users/requests/${item.id}`"
              class="request-card-link"
            >
              <n-card bordered round hoverable class="request-card request-card--filled">
                <div class="request-card-body">
                  <div class="request-card-header">
                    <n-tag type="info" size="small" round>در انتظار تأیید</n-tag>
                    <n-text depth="3" class="request-card-date">{{ formatCreatedAt(item.created_at) }}</n-text>
                  </div>
                  <n-text strong class="request-card-title">{{ item.implement?.name || '—' }}</n-text>
                  <n-text depth="2" class="request-card-land">
                    <i class="fa-solid fa-layer-group request-card-icon"></i>
                    {{ item.land?.title || '—' }}
                  </n-text>
                  <div class="request-card-footer">
                    <n-text depth="2" class="request-card-area">{{ formatArea(item.area) }} م‌م</n-text>
                    <i class="fa-solid fa-arrow-left request-card-arrow"></i>
                  </div>
                </div>
              </n-card>
            </router-link>
          </div>
        </div>
      </n-tab-pane>
      <n-tab-pane name="in_progress" tab="درحال انجام">
        <div class="tab-pane-content">
          <n-empty
            v-if="!loadingInProgress && inProgressList.length === 0"
            description="درخواستی در حال انجام ندارید"
            class="tab-empty"
          />
          <n-spin v-else-if="loadingInProgress" size="medium" class="tab-spin" />
          <n-list v-else bordered class="tab-list">
            <n-list-item v-for="item in inProgressList" :key="item.id">
              <template #prefix>
                <n-tag type="success" size="small" round>در حال انجام</n-tag>
              </template>
              <n-thing>
                <template #header>{{ item.title || 'درخواست' }}</template>
                <template #header-extra>
                  <n-text depth="2">{{ item.date }}</n-text>
                </template>
              </n-thing>
            </n-list-item>
          </n-list>
        </div>
      </n-tab-pane>
      <n-tab-pane name="completed" tab="پایان یافته">
        <div class="tab-pane-content">
          <n-empty
            v-if="!loadingCompleted && completedList.length === 0"
            description="درخواست پایان یافته‌ای ندارید"
            class="tab-empty"
          />
          <n-spin v-else-if="loadingCompleted" size="medium" class="tab-spin" />
          <n-list v-else bordered class="tab-list">
            <n-list-item v-for="item in completedList" :key="item.id">
              <template #prefix>
                <n-tag type="info" size="small" round>پایان یافته</n-tag>
              </template>
              <n-thing>
                <template #header>{{ item.title || 'درخواست' }}</template>
                <template #header-extra>
                  <n-text depth="2">{{ item.date }}</n-text>
                </template>
              </n-thing>
            </n-list-item>
          </n-list>
        </div>
      </n-tab-pane>
      <n-tab-pane name="cancelled" tab="لغو شده">
        <div class="tab-pane-content">
          <n-empty
            v-if="!loadingCancelled && cancelledList.length === 0"
            description="درخواست لغو شده‌ای ندارید"
            class="tab-empty"
          />
          <n-spin v-else-if="loadingCancelled" size="medium" class="tab-spin" />
          <n-list v-else bordered class="tab-list">
            <n-list-item v-for="item in cancelledList" :key="item.id">
              <template #prefix>
                <n-tag type="error" size="small" round>لغو شده</n-tag>
              </template>
              <n-thing>
                <template #header>{{ item.title || 'درخواست' }}</template>
                <template #header-extra>
                  <n-text depth="2">{{ item.date }}</n-text>
                </template>
              </n-thing>
            </n-list-item>
          </n-list>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import {
  NTabs,
  NTabPane,
  NEmpty,
  NSpin,
  NList,
  NListItem,
  NTag,
  NThing,
  NText,
  NCard,
  NSkeleton
} from 'naive-ui'
import api from '../../utils/api'

type TabName = 'pending' | 'in_progress' | 'completed' | 'cancelled'

const activeTab = ref<TabName>('pending')

const tabThemeOverrides = {
  tabColorSegment: 'transparent',
  tabTextColorActiveSegment: '#ffffff',
  tabBorderRadiusSegment: '12px'
}

interface RequestItem {
  id: number
  area: string
  status: string
  code: string
  dates: string[]
  created_at: string
  implement: { id: number; name: string; image: string | null }
  land: { id: number; title: string; area: number }
}

interface RequestPlaceholder {
  id: number
  title: string
  date: string
}

const pendingList = ref<RequestItem[]>([])
const inProgressList = ref<RequestPlaceholder[]>([])
const completedList = ref<RequestPlaceholder[]>([])
const cancelledList = ref<RequestPlaceholder[]>([])

const loadingPending = ref(false)
const loadingInProgress = ref(false)
const loadingCompleted = ref(false)
const loadingCancelled = ref(false)

function formatArea(area: string | undefined): string {
  if (area == null || area === '') return '—'
  const num = Number(area)
  if (isNaN(num)) return area
  return num.toLocaleString('fa-IR')
}

function formatCreatedAt(createdAt: string | undefined): string {
  if (!createdAt) return '—'
  try {
    const d = new Date(createdAt)
    return d.toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' })
  } catch {
    return createdAt
  }
}

async function fetchPending() {
  loadingPending.value = true
  try {
    const { data } = await api.get<{ result: RequestItem[] }>('/users/search/requests/pending')
    pendingList.value = data?.result ?? []
  } catch {
    pendingList.value = []
  } finally {
    loadingPending.value = false
  }
}

async function fetchInProgress() {
  loadingInProgress.value = true
  try {
    inProgressList.value = []
  } finally {
    loadingInProgress.value = false
  }
}

async function fetchCompleted() {
  loadingCompleted.value = true
  try {
    completedList.value = []
  } finally {
    loadingCompleted.value = false
  }
}

async function fetchCancelled() {
  loadingCancelled.value = true
  try {
    cancelledList.value = []
  } finally {
    loadingCancelled.value = false
  }
}

watch(activeTab, (name) => {
  if (name === 'pending') fetchPending()
  if (name === 'in_progress') fetchInProgress()
  if (name === 'completed') fetchCompleted()
  if (name === 'cancelled') fetchCancelled()
})

onMounted(() => {
  fetchPending()
})
</script>

<style scoped>
.requests-page {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 140px);
  padding: 0;
}

.requests-tabs {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
}

:deep(.n-tabs-nav) {
  padding: 12px 6px 0;
  margin-bottom: 0;
  flex-shrink: 0;
}

:deep(.n-tabs-tab) {
  font-size: 0.88rem;
}

:deep(.n-tabs-tab__label) {
  font-size: 0.90rem;
}

:deep(.n-tabs-tab-pad) {
  display: none;
}

/* کپسول متحرک را مخفی کن تا فقط دکمه فعال استایل بگیره (رفع باگ RTL) */
:deep(.n-tabs-capsule) {
  display: none;
}

/* فقط دکمه تب فعال: پس‌زمینه سبز و متن سفید */
:deep(.n-tabs-tab.n-tabs-tab--active) {
  background-color: #1e6b3f;
  color: #ffffff;
}

:deep(.n-tabs-pane-wrapper) {
  flex: 1;
  overflow: auto;
  padding: 16px 8px;
}

.tab-pane-content {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.tab-pane-content--list {
  align-items: stretch;
  justify-content: flex-start;
}

.tab-guide-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tab-guide-icon {
  font-size: 1.125rem;
  color: #1e6b3f;
  flex-shrink: 0;
}

.tab-guide-label {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1e6b3f;
}

.request-cards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.request-card-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.request-card {
  width: 100%;
  border-radius: 16px;
  transition: box-shadow 0.2s, transform 0.2s;
}

.request-card :deep(.n-card__content) {
  padding: 0.75rem 1rem;
}

.request-card--filled {
  background-color: rgba(30, 107, 63, 0.06);
}

.request-card-link:active .request-card {
  transform: scale(0.99);
}

.request-card--skeleton {
  pointer-events: none;
}

.request-card-skeleton-last {
  margin-top: 4px;
}

.request-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.request-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.request-card-date {
  font-size: 0.875rem;
}

.request-card-title {
  font-size: 0.9375rem;
  line-height: 1.35;
}

.request-card-land {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
}

.request-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.request-card-area {
  font-size: 0.9375rem;
}

.request-card-icon {
  width: 1rem;
  color: #1e6b3f;
  opacity: 0.9;
  flex-shrink: 0;
}

.request-card-arrow {
  color: #1e6b3f;
  font-size: 0.875rem;
}

.tab-empty {
  padding: 2rem 0;
}

.tab-spin {
  padding: 2rem 0;
}

.tab-list {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
}
</style>
