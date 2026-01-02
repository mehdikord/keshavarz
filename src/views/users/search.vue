<template>
  <n-space vertical :size="16" style="padding: 0.75rem;">
    <!-- Title -->
    <n-text strong style="font-size: 16px;">
      انتخاب خدمت مورد نظر
    </n-text>

    <!-- Category Select -->
    <n-space vertical :size="8">
      <n-text strong style="color: #1e6b3f; font-weight: 600;">دسته بندی خدمات</n-text>
      <n-select
        v-model:value="selectedCategoryId"
        :options="categoryOptions"
        placeholder="دسته بندی را انتخاب کنید"
        :loading="loadingCategories"
        filterable
        clearable
        placement="bottom"
        consistent-menu-width
        size="large"
        @update:value="handleCategoryChange"
      />
    </n-space>

    <n-space vertical :size="'small'"></n-space>
    <!-- Service Select -->
    <n-space vertical :size="8">
      <n-text strong style="color: #1e6b3f; font-weight: 600;">انتخاب خدمت</n-text>
      <n-select
        v-model:value="selectedServiceId"
        :options="serviceOptions"
        placeholder="خدمت را انتخاب کنید"
        :loading="loadingServices"
        :disabled="!selectedCategoryId"
        filterable
        clearable
        :render-label="renderServiceLabel"
        :render-tag="renderServiceTag"
        placement="bottom"
        size="large"
      />
    </n-space>

    <!-- Land Select -->
    <n-space vertical :size="'small'"></n-space>

     <div dir="rtl">
    <n-space vertical :size="8">
      <n-text strong style="color: #1e6b3f; font-weight: 600;">انتخاب زمین</n-text>
      <n-select
        v-model:value="selectedLandId"
        :options="landOptions"
        placeholder="زمین را انتخاب کنید"
        :loading="loadingLands"
        filterable
        clearable
        placement="bottom"
        consistent-menu-width
        size="large"
        @update:value="handleLandChange"
      />
    </n-space>
</div>
<n-space vertical :size="'small'"></n-space>

    <!-- Area Input -->
    <n-space vertical  :size="8">
      <n-text strong style="color: #1e6b3f; font-weight: 600;">
        متراژ کار
        <span style="font-size: 12px; color: #6b7280;">(میتوانید متراژ دلخواه از زمین را وارد کنید)</span>
      </n-text>

      <n-input-number
        v-model:value="workArea"
        placeholder="متراژ کار (متر مربع)"
        :min="0"
        :disabled="!selectedLandId"
        size="large"
        :format="formatNumber"
        :parse="parseNumber"
      />
    </n-space>
    <n-space vertical :size="'small'"></n-space>

    <!-- Date Picker -->
    <n-space vertical :size="8">
      <n-text strong style="color: #1e6b3f; font-weight: 600;">تاریخ های مورد نظر شما برای انجام کار</n-text>
      <date-picker
        v-model="selectedDates"
        format="jYYYY/jMM/jDD"
        display-format="jYYYY/jMM/jDD"
        placeholder="تاریخ های مورد نظر را انتخاب کنید"
        input-class="n-input n-input--large"
        color="#18a058"
        multiple
        :min="minDate"
      />
    </n-space>
    <n-space vertical :size="'small'"></n-space>
    <!-- Search Button -->
    <n-space vertical class="mt-5" :size="40">
      <n-button
        secondary
        type="success"
        size="large"
        block
        strong
        
        style="font-size: 1rem; gap: 10px; margin-top: 40px;"
      >
        <template #icon>
          <i class="fa-solid fa-search"></i>
        </template>
        جستجو خدمات
      </n-button>
    </n-space>
  </n-space>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { NSpace, NText, NSelect, NInputNumber, NButton, NIcon, NAvatar, useMessage } from 'naive-ui'
import type { SelectOption, SelectRenderLabel, SelectRenderTag } from 'naive-ui'
import DatePicker from 'vue3-persian-datetime-picker'
// @ts-ignore - moment-jalaali doesn't have type definitions
import moment from 'moment-jalaali'
import api from '../../utils/api'

const message = useMessage()

interface Category {
  id: number
  name: string
  image: string | null
  num: number
  implements_count: number
}

interface Service {
  id: number
  implement_category_id: number
  name: string
  code: string | null
  is_special: number
  price_type: string
  image: string | null
  short_description: string | null
  long_description: string | null
  created_at: string
  updated_at: string
  form_ids: number[]
}

interface Land {
  id: number
  title: string
  location: string | [string, string]
  area: number
  description: string | null
  created_at: string
  updated_at: string
}

const selectedCategoryId = ref<number | null>(null)
const selectedServiceId = ref<number | null>(null)
const selectedLandId = ref<number | null>(null)
const workArea = ref<number | null>(null)
const selectedDates = ref<string[]>([])

// Get today's date in Jalali format (jYYYY/jMM/jDD)
const minDate = computed(() => {
  const today = moment()
  return today.format('jYYYY/jMM/jDD')
})

// Convert dates to format DD/MM/YYYY for server
const datesForServer = computed(() => {
  return selectedDates.value.map(date => {
    // date format is jYYYY/jMM/jDD, convert to DD/MM/YYYY
    const parts = date.split('/')
    if (parts.length === 3) {
      const [year, month, day] = parts
      return `${day}/${month}/${year}`
    }
    return date
  })
})
const categories = ref<Category[]>([])
const services = ref<Service[]>([])
const lands = ref<Land[]>([])
const loadingCategories = ref(false)
const loadingServices = ref(false)
const loadingLands = ref(false)

const categoryOptions = ref<SelectOption[]>([])
const serviceOptions = computed(() => {
  return services.value.map(service => ({
    label: service.name,
    value: service.id
  }))
})
const landOptions = computed(() => {
  return lands.value.map(land => ({
    label: land.title,
    value: land.id
  }))
})

// Format number with thousand separators (comma)
const formatNumber = (value: number | null): string => {
  if (value === null || value === undefined) return ''
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// Parse formatted number back to number
const parseNumber = (value: string): number | null => {
  if (!value) return null
  const cleaned = value.replace(/,/g, '')
  const parsed = Number(cleaned)
  return isNaN(parsed) ? null : parsed
}

// Fetch categories
const fetchCategories = async () => {
  loadingCategories.value = true
  try {
    const response = await api.get('/public/implements/categories')
    if (response.data && response.data.result) {
      categories.value = response.data.result
      // Sort by num field
      categories.value.sort((a, b) => a.num - b.num)
      // Create options
      categoryOptions.value = categories.value.map(cat => ({
        label: cat.name,
        value: cat.id
      }))
    }
  } catch (error: any) {
    message.error('خطا در دریافت دسته‌بندی‌ها')
    console.error('Error fetching categories:', error)
  } finally {
    loadingCategories.value = false
  }
}

// Fetch services based on selected category
const fetchServices = async (categoryId: number) => {
  loadingServices.value = true
  try {
    const response = await api.get(`/public/implements/implements?category=${categoryId}`)
    if (response.data && response.data.result) {
      services.value = response.data.result
    }
  } catch (error: any) {
    message.error('خطا در دریافت خدمات')
    console.error('Error fetching services:', error)
  } finally {
    loadingServices.value = false
  }
}

// Handle category change
const handleCategoryChange = (categoryId: number | null) => {
  selectedServiceId.value = null
  services.value = []
  
  if (categoryId) {
    fetchServices(categoryId)
  }
}

// Fetch lands
const fetchLands = async () => {
  loadingLands.value = true
  try {
    const response = await api.get('/users/lands')
    if (response.data) {
      if (Array.isArray(response.data.result)) {
        lands.value = response.data.result
      } else if (Array.isArray(response.data)) {
        lands.value = response.data
      } else if (response.data.result && Array.isArray(response.data.result)) {
        lands.value = response.data.result
      } else {
        lands.value = []
      }
    } else {
      lands.value = []
    }
  } catch (error: any) {
    message.error('خطا در دریافت لیست زمین‌ها')
    console.error('Error fetching lands:', error)
    lands.value = []
  } finally {
    loadingLands.value = false
  }
}

// Handle land change
const handleLandChange = (landId: number | null) => {
  if (landId) {
    const selectedLand = lands.value.find(land => land.id === landId)
    if (selectedLand) {
      workArea.value = selectedLand.area
    }
  } else {
    workArea.value = null
  }
}

// Find service by id
const findServiceById = (id: number | null): Service | undefined => {
  if (!id) return undefined
  return services.value.find(s => s.id === id)
}

// Render service label (for dropdown menu options)
const renderServiceLabel: SelectRenderLabel = (option) => {
  const serviceId = option.value as number
  const service = findServiceById(serviceId)
  
  if (!service) {
    return option.label as string
  }

  return h(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center'
      }
    },
    [
      service.image
        ? h(NAvatar, {
            src: service.image,
            round: true,
            size: 'small',
            style: {
              marginLeft: '14px',
              flexShrink: 0
            }
          })
        : h(NIcon, {
            size: 20,
            color: '#6b7280',
            style: {
              marginLeft: '14px',
              flexShrink: 0
            }
          }, {
            default: () => h('i', {
              class: 'fa-solid fa-tractor'
            })
          }),
      h(
        'div',
        {
          style: {
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            padding: '4px 0'
          }
        },
        [service.name]
      )
    ]
  )
}

// Render service tag (for selected value in input)
const renderServiceTag: SelectRenderTag = ({ option }) => {
  const serviceId = option.value as number
  const service = findServiceById(serviceId)
  
  if (!service) {
    return option.label as string
  }

  return h(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center'
      }
    },
    [
      service.image
        ? h(NAvatar, {
            src: service.image,
            round: true,
            size: 24,
            style: {
              marginLeft: '8px',
              flexShrink: 0
            }
          })
        : h(NIcon, {
            size: 20,
            color: '#6b7280',
            style: {
              marginLeft: '8px',
              flexShrink: 0
            }
          }, {
            default: () => h('i', {
              class: 'fa-solid fa-tractor'
            })
          }),
      h('span', {
        style: {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }
      }, service.name)
    ]
  )
}

onMounted(() => {
  fetchCategories()
  fetchLands()
})
</script>

