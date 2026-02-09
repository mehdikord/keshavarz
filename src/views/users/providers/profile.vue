<template>
  <div class="provider-profile-page">
    <!-- Loading State -->
    <n-space v-if="loading" vertical align="center" justify="center" class="loading-container">
      <n-spin size="large">
        <template #description>
          <n-text>در حال دریافت اطلاعات خدمات دهنده...</n-text>
        </template>
      </n-spin>
    </n-space>

    <!-- Error State -->
    <n-space v-else-if="error" vertical align="center" justify="center" class="error-container">
      <n-card>
        <n-space vertical :size="16" align="center">
          <n-icon size="48" color="#d03050">
            <i class="fa-solid fa-circle-exclamation"></i>
          </n-icon>
          <n-text type="error" style="font-size: 1rem;">خطا در دریافت اطلاعات</n-text>
          <n-text depth="3">{{ error }}</n-text>
          <n-button type="primary" round @click="fetchProviderProfile">
            تلاش مجدد
          </n-button>
        </n-space>
      </n-card>
    </n-space>

    <!-- Profile Content -->
    <n-space v-else-if="provider" vertical :size="20" class="profile-content">
      <!-- Profile Header Card -->
      <n-card :bordered="false" class="profile-header-card">
        <n-space vertical :size="20" align="center">
          <!-- Avatar -->
          <div v-if="provider.image" class="avatar-wrapper">
            <n-avatar
              :src="provider.image"
              round
              :size="110"
            />
          </div>
          <div v-else class="avatar-placeholder">
            <i class="fa-solid fa-user-circle"></i>
          </div>

          <!-- Name & Phone -->
          <n-space vertical :size="8" align="center">
            <n-text strong class="provider-name">
              {{ provider.name }}
            </n-text>
            <n-text depth="3" class="provider-phone" dir="ltr">
              {{ provider.phone }}
            </n-text>
          </n-space>
        </n-space>
      </n-card>

      <!-- Bio Card -->
      <n-card v-if="provider.bio" title="درباره" :bordered="true" size="small">
        <n-text class="provider-bio">
          {{ provider.bio }}
        </n-text>
      </n-card>

      <!-- Location Card -->
      <n-card title="موقعیت جغرافیایی" :bordered="true" size="small">
        <n-space vertical :size="16">
          <n-space justify="space-between" align="center">
            <n-space align="center" :size="8">
              <n-icon size="20" color="#1e6b3f">
                <i class="fa-solid fa-map"></i>
              </n-icon>
              <n-text>استان</n-text>
            </n-space>
            <n-tag :type="provider.province?.name ? 'success' : 'default'" :bordered="false" size="small">
              {{ provider.province?.name || 'ثبت نشده' }}
            </n-tag>
          </n-space>

          <n-space justify="space-between" align="center">
            <n-space align="center" :size="8">
              <n-icon size="20" color="#1e6b3f">
                <i class="fa-solid fa-city"></i>
              </n-icon>
              <n-text>شهر</n-text>
            </n-space>
            <n-tag :type="provider.city?.name ? 'info' : 'default'" :bordered="false" size="small">
              {{ provider.city?.name?.trim() || 'ثبت نشده' }}
            </n-tag>
          </n-space>
        </n-space>
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { NSpace, NSpin, NText, NCard, NAvatar, NIcon, NTag, NButton } from 'naive-ui'
import api from '../../../utils/api'

interface ProviderUser {
  id: number
  name: string
  phone: string
  image: string | null
  bio: string | null
  province: {
    id: number
    name: string
  } | null
  city: {
    id: number
    name: string
  } | null
}

const route = useRoute()
const provider = ref<ProviderUser | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

async function fetchProviderProfile() {
  const userId = route.params.id
  if (!userId) {
    error.value = 'شناسه خدمات دهنده یافت نشد'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    const { data } = await api.get(`users/search/providers/profile/${userId}`)
    if (data?.result?.user) {
      provider.value = data.result.user
    } else {
      error.value = 'اطلاعات خدمات دهنده یافت نشد'
    }
  } catch {
    error.value = 'خطا در ارتباط با سرور'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProviderProfile()
})
</script>

<style scoped>
.provider-profile-page {
  padding: 0.75rem;
  min-height: 80vh;
}

.loading-container {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-container {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.profile-content {
  width: 100%;
}

.profile-header-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 16px;
}

.avatar-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 0.5rem;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e6b3f 0%, #4ade80 100%);
  color: #ffffff;
  font-size: 4rem;
}

.provider-name {
  font-size: 1.5rem;
  color: #1e6b3f;
}

.provider-phone {
  font-size: 1rem;
  letter-spacing: 0.5px;
}

.provider-bio {
  font-size: 0.9rem;
  line-height: 1.7;
  color: #374151;
}
</style>
