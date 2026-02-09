<template>
  <div class="news-page">
    <n-space vertical :size="16" class="news-content">
      <n-space vertical :size="1" align="center" class="news-header">
        <n-h1 class="news-title">آخرین خبرهای حوزه کشاورزی</n-h1>
        <n-text class="news-header-hint">برای مشاهده کامل اخبار روی آن کلیک کنید</n-text>
      </n-space>

      <n-spin :show="loading" size="large">
        <template #description>
          در حال دریافت اخبار...
        </template>
        <n-space v-if="!loading && newsList.length" vertical :size="16" class="news-list">
          <a
            v-for="item in newsList"
            :key="item.id"
            :href="item.link"
            target="_blank"
            rel="noopener noreferrer"
            class="news-card-link"
          >
            <n-card :bordered="true" size="small" class="news-card" hoverable>
              <div class="news-card-inner">
                <div class="news-card-image-wrap">
                  <img
                    v-if="item.image"
                    :src="item.image"
                    :alt="item.title"
                    class="news-card-image"
                  />
                  <div v-else class="news-card-image-placeholder">
                    <i class="fa-solid fa-newspaper news-placeholder-icon" aria-hidden="true"></i>
                  </div>
                </div>
                <div class="news-card-body">
                  <n-text class="news-card-title" strong>{{ item.title }}</n-text>
                  <n-text class="news-card-description" depth="2">{{ truncateWords(item.description, 10) }}</n-text>
                </div>
              </div>
            </n-card>
          </a>
        </n-space>
        <n-empty v-else-if="!loading && !newsList.length" description="خبری یافت نشد" class="news-empty" />

        <div v-if="!loading && pagination.lastPage > 1" class="news-pagination">
          <n-pagination
            v-model:page="pagination.currentPage"
            :page-count="pagination.lastPage"
            :page-slot="5"
            show-quick-jumper
            @update:page="onPageChange"
          >
            <template #prev>
              <span>قبلی</span>
            </template>
            <template #next>
              <span>بعدی</span>
            </template>
          </n-pagination>
        </div>
      </n-spin>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { NSpace, NH1, NSpin, NCard, NText, NEmpty, NPagination } from 'naive-ui'
import api from '../utils/api'

interface NewsItem {
  id: number
  title: string
  image: string | null
  description: string
  link: string
  created_at: string
  updated_at: string
}

interface NewsResponse {
  result: {
    data: NewsItem[]
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
  message: string | null
}

const newsList = ref<NewsItem[]>([])
const loading = ref(true)
const pagination = reactive({
  currentPage: 1,
  lastPage: 1,
  total: 0,
  perPage: 10
})

function truncateWords(text: string, maxWords: number): string {
  if (!text || !text.trim()) return ''
  const words = text.trim().split(/\s+/)
  if (words.length <= maxWords) return text
  return words.slice(0, maxWords).join(' ') + ' ...'
}

async function fetchNews(page = 1) {
  loading.value = true
  try {
    const { data } = await api.get<NewsResponse>('public/news', { params: { page } })
    const result = data?.result
    if (result?.data) {
      newsList.value = result.data
      pagination.currentPage = result.current_page
      pagination.lastPage = result.last_page
      pagination.total = result.total
      pagination.perPage = result.per_page ?? 10
    } else {
      newsList.value = []
    }
  } catch {
    newsList.value = []
  } finally {
    loading.value = false
  }
}

function onPageChange(page: number) {
  fetchNews(page)
}

onMounted(() => {
  fetchNews(1)
})
</script>

<style scoped>
.news-page {
  min-height: 100vh;
  padding: 0.5rem 1rem 2rem;
}

.news-content {
  width: 100%;
  max-width: 100%;
}

.news-header {
  padding-top: 0.25rem;
}

.news-title {
  text-align: center;
  font-weight: 600;
  font-size: 1.1rem;
}

.news-header-hint {
  font-size: 0.8rem;
  text-align: center;

}

.news-card-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.news-card-link:hover {
  color: inherit;
}

.news-card :deep(.n-card__content) {
  padding: 0.75rem 1rem;
}

.news-card-inner {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  direction: rtl;
}

.news-card-image-wrap {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background: #0d843cb3;
}

.news-card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.news-card-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0d843cb3;
  color: var(--n-border-color);
}

.news-placeholder-icon {
  font-size: 2.5rem;
  color: var(--n-border-color);
}

.news-card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.news-card-title {
  font-size: 14px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-card-description {
  font-size: 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-list {
  padding-bottom: 1rem;
}

.news-empty {
  padding: 2rem;
}

.news-pagination {
  display: flex;
  justify-content: center;
  padding: 1.5rem 0 1rem;
}

.news-pagination :deep(.n-pagination) {
  flex-wrap: wrap;
  justify-content: center;
}
</style>
