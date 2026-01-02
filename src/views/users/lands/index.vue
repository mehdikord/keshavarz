<template>
  <n-space vertical :size="16" style="padding: 0.75rem;">
    <!-- Title -->
    <n-text strong style="font-size: 1.125rem;">
      لیست زمین های من
    </n-text>

    <!-- Add New Land Button -->
    <router-link to="/users/lands/add" style="text-decoration: none; display: block;">
      <n-button strong secondary round type="success" block size="large" style="font-size: 1rem; padding: 1.2rem 1.5rem;">
        ثبت زمین جدید
      </n-button>
    </router-link>

    <!-- Loading State -->
    <n-spin v-if="loading" style="width: 100%; padding: 2rem;">
      <template #description>در حال دریافت لیست زمین‌ها...</template>
    </n-spin>

    <!-- Lands List -->
    <template v-else>
      <!-- Debug Info (remove in production) -->
      <n-text v-if="lands.length === 0" depth="3" style="font-size: 0.875rem;">
        تعداد زمین‌ها: {{ lands.length }}
      </n-text>
      
      <n-space v-if="lands.length > 0" vertical :size="12">
        <LandCard
          v-for="land in lands"
          :key="land.id"
          :land="land"
          @delete="handleDelete"
        />
      </n-space>

      <!-- Empty State -->
      <n-empty v-else description="زمینی ثبت نشده است" />
    </template>
  </n-space>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NSpace, NText, NButton, NSpin, NEmpty, useMessage } from 'naive-ui'
import api from '../../../utils/api'
import LandCard from '../../../components/LandCard.vue'

interface Land {
  id: number
  title: string
  location: string | [string, string]
  area: number
  description: string | null
  created_at: string
  updated_at: string
}

const loading = ref(false)
const lands = ref<Land[]>([])
const message = useMessage()

const fetchLands = async () => {
  loading.value = true
  try {
    const response = await api.get('/users/lands')
    console.log('API Response:', response.data)
    
    if (response.data) {
      // بررسی ساختار response
      if (Array.isArray(response.data.result)) {
        lands.value = response.data.result
        console.log('Lands loaded:', lands.value.length, 'items')
      } else if (Array.isArray(response.data)) {
        lands.value = response.data
        console.log('Lands loaded (direct array):', lands.value.length, 'items')
      } else if (response.data.result && Array.isArray(response.data.result)) {
        lands.value = response.data.result
        console.log('Lands loaded:', lands.value.length, 'items')
      } else {
        console.log('Unexpected response structure:', response.data)
        lands.value = []
      }
    } else {
      console.log('No data in response')
      lands.value = []
    }
  } catch (err: any) {
    console.error('Error fetching lands:', err)
    console.error('Error response:', err.response?.data)
    message.error(err.response?.data?.message || 'خطا در دریافت لیست زمین‌ها')
    lands.value = []
  } finally {
    loading.value = false
  }
}

const handleDelete = (landId: number) => {
  lands.value = lands.value.filter(land => land.id !== landId)
}

onMounted(() => {
  fetchLands()
})
</script>

