<template>
  <n-space vertical :size="16" style="padding: 0.75rem 0.25rem;">
    <!-- Title and Back Button -->
    <n-space justify="space-between" align="center">
      <n-text strong style="font-size: 1.25rem;">
        ثبت زمین جدید
      </n-text>
      <router-link to="/users/lands" style="text-decoration: none;">
        <n-button
          circle
          size="medium"
          quaternary
        >
          <template #icon>
            <i class="fa-solid fa-arrow-left"></i>
          </template>
        </n-button>
      </router-link>
    </n-space>

    <!-- Map Selector -->
    <MapSelector v-model="selectedLocation" />

    <!-- Form Fields -->
    <n-space vertical :size="12">
      <n-space vertical :size="4">
        <n-input
          v-model:value="name"
          placeholder="نام زمین"
          size="large"
          :status="getFieldError('title') ? 'error' : undefined"
        />
        <n-text v-if="getFieldError('title')" type="error" style="font-size: 0.875rem;">
          {{ getFieldError('title') }}
        </n-text>
      </n-space>
      
      <n-space vertical :size="4">
        <n-input-number
          v-model:value="area"
          placeholder="مساحت زمین (متر مربع)"
          size="large"
          :min="0"
          style="width: 100%;"
          :status="getFieldError('area') ? 'error' : undefined"
        />
        <n-text v-if="getFieldError('area')" type="error" style="font-size: 0.875rem;">
          {{ getFieldError('area') }}
        </n-text>
      </n-space>
      
      <n-text v-if="getFieldError('location')" type="error" style="font-size: 0.875rem;">
        {{ getFieldError('location') }}
      </n-text>
      
      <n-button
        strong
        secondary
        round
        type="success"
        block
        size="large"
        :loading="submitting"
        :disabled="submitting || !isFormValid"
        style="font-size: 1rem; padding: 1.2rem 1.5rem; gap: 0.5rem;"
        @click="handleSubmit"
      >
        <template #icon>
          <i class="fa-solid fa-plus"></i>
        </template>
        ثبت زمین جدید
      </n-button>
    </n-space>
  </n-space>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { NSpace, NText, NInput, NInputNumber, NButton, useMessage } from 'naive-ui'
import MapSelector from '../../../components/MapSelector.vue'
import api from '../../../utils/api'
import { useFormValidation } from '../../../composables/useFormValidation'

interface Location {
  lat: number
  lng: number
}

const router = useRouter()
const message = useMessage()
const { handleValidationError, clearValidationErrors, getFieldError } = useFormValidation()

const selectedLocation = ref<Location | null>(null)
const name = ref('')
const area = ref<number | null>(null)
const submitting = ref(false)

// بررسی اعتبار فرم
const isFormValid = computed(() => {
  const hasName = name.value && name.value.trim().length > 0
  const hasArea = area.value !== null && area.value !== undefined && Number(area.value) > 0
  const hasLocation = selectedLocation.value !== null
  
  return hasName && hasArea && hasLocation
})

// تابع ارسال فرم
const handleSubmit = async () => {
  if (!isFormValid.value) {
    message.warning('لطفا تمام فیلدها را پر کنید')
    return
  }

  // پاک کردن خطاهای قبلی
  clearValidationErrors()
  submitting.value = true

  try {
    const response = await api.post('/users/lands', {
      title: name.value.trim(),
      area: String(area.value),
      location: `${selectedLocation.value!.lng},${selectedLocation.value!.lat}`
    })

    if (response.data) {
      message.success('زمین جدید با موفقیت ثبت شد')
      // بازگشت به صفحه لیست زمین‌ها
      router.push('/users/lands')
    }
  } catch (err: any) {
    console.error('Error creating land:', err)
    
    // هندل کردن خطای validation
    if (err.response?.status === 422) {
      handleValidationError(err)
    } else {
      message.error(err.response?.data?.message || 'خطا در ثبت زمین')
    }
  } finally {
    submitting.value = false
  }
}
</script>

