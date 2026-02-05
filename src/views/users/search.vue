<template>
  <!-- Loading State -->
  <n-space v-if="loadingPendingRequests" vertical :size="16" style="padding: 0.75rem; align-items: center; justify-content: center; min-height: 50vh;">
    <n-spin size="large">
      <template #description>
        <n-text>در حال بررسی درخواست‌های در انتظار...</n-text>
      </template>
    </n-spin>
  </n-space>

  <!-- Search Form -->
  <n-space v-else-if="!showResults" vertical :size="16" style="padding: 0.75rem;">
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
        :loading="searchLoading"
        :disabled="!selectedLandId || !selectedServiceId || !workArea || selectedDates.length === 0"
        @click="handleSearch"
        style="font-size: 1rem; gap: 10px; margin-top: 40px;"
      >
        <template #icon>
          <i class="fa-solid fa-search"></i>
        </template>
        جستجو خدمات
      </n-button>
    </n-space>
  </n-space>

  <!-- Search Results -->
  <n-space v-else vertical :size="16" style="padding: 0.75rem;">
    <!-- Header -->
    <n-text strong type="error" style="font-size: 1.25rem;">
      نتایج جستجو
    </n-text>

    <!-- Subtitle -->
    <n-space vertical :size="4">
      <n-text depth="3" style="font-size: 0.875rem;">
        برای : {{ searchResults?.implement?.name }}
      </n-text>
      <n-text depth="3" style="font-size: 0.875rem;">
        زمین : {{ searchResults?.land?.name }} ({{ formatNumber(searchResults?.land?.area || 0) }})
      </n-text>
      <n-text depth="3" style="font-size: 0.875rem;">
        تعداد <n-text type="error" strong>{{ searchResults?.data?.length || 0 }}</n-text> نفر برای انجام این خدمت یافت شد
      </n-text>
    </n-space>

    <!-- Filter and Sort Select -->
    <n-space vertical :size="8" style="margin-top: 1rem; margin-bottom: 1rem;">
      <n-text strong style="color: #1e6b3f; font-weight: 600;">فیلتر و مرتب سازی</n-text>
      <n-select
        v-model:value="sortType"
        :options="sortOptions"
        placeholder="فیلتر و مرتب سازی را انتخاب کنید"
        size="large"
        @update:value="handleSortChange"
      />
    </n-space>

    <!-- Provider Cards -->
    <transition-group
      name="list"
      tag="div"
      class="provider-cards-container"
    >
      <n-card
        v-for="item in sortedResults"
        :key="`${item.user.id}-${item.implement.id}`"
        :bordered="false"
        hoverable
        :content-style="{ padding: '1rem', border: '1px solid rgba(55, 123, 78, 0.32)', borderRadius: '15px', marginBottom: '1.25rem' }"
      >
        <n-space vertical :size="16">
          <!-- Header: User Name with Avatar -->
          <n-space align="center" :size="12">
            <n-avatar
              v-if="item.user.image"
              :src="item.user.image"
              round
              size="small"
            />
            <n-icon
              v-else
              size="28"
              color="#1e6b3f"
            >
              <i class="fa-duotone fa-user"></i>
            </n-icon>
            <n-text strong style="font-size: 0.9375rem;">
              {{ item.user.name }}
            </n-text>
          </n-space>

          <!-- Details Row -->
          <n-space vertical :size="8">
            <!-- Implement Name -->
            <n-space align="center" :size="8">
              <n-icon size="20" color="#f59e0b">
                <i class="fa-solid fa-tractor"></i>
              </n-icon>
              <n-text style="font-size: 0.875rem; color: #000; padding-right: 8px;">
                {{ item.implement.name }}
              </n-text>
            </n-space>

            <!-- Distance -->
            <n-space align="center" :size="8">
              <n-icon size="20" color="#d03050">
                <i class="fa-solid fa-location-dot"></i>
              </n-icon>
              <n-text style="font-size: 0.875rem; color: #000;padding-right: 8px;">
                {{ item.dis }} کیلومتر
              </n-text>
            </n-space>

            <!-- Price -->
            <n-space align="center" :size="8">
              <n-icon size="20" color="#18a058">
                <i class="fa-solid fa-money-bill"></i>
              </n-icon>
              <n-space align="baseline" :size="4">
                <n-text strong style="font-size: 0.9rem; font-weight: 600; color: #d03050; padding-right: 8px;">
                  {{ formatNumber(parseInt(item.price)) }}
                </n-text>
                <n-text style="font-size: 0.75rem; color: #000;">
                  تومان {{ item.price_type }}
                </n-text>
              </n-space>
            </n-space>
          </n-space>

          <!-- در انتظار تایید (بعد از ارسال درخواست) -->
          <n-space v-if="isRequestSentForUser(item.user.id)" align="center" :size="8">
            <n-icon size="20" color="#f59e0b">
              <i class="fa-solid fa-spinner fa-spin"></i>
            </n-icon>
            <n-text strong style="font-size: 0.875rem;">
              در انتظار تایید خدمات دهنده
            </n-text>
          </n-space>

          <!-- Card Footer Buttons -->
          <n-space vertical :size="8" style="border-top: 1px solid var(--n-dividerColor); margin-top: 0.5rem;">
            <n-button
              v-if="!isRequestSentForUser(item.user.id)"
              secondary
              type="success"
              round
              size="medium"
              strong
              block
              :loading="sendRequestLoadingUserId === item.user.id"
              @click="handleSendRequest(item)"
            >
              <template #icon>
                <i class="fa-solid fa-check" style="padding-left:5px;"></i>
              </template>
              ارسال درخواست
            </n-button>
            <n-button
              v-else
              secondary
              type="error"
              round
              size="medium"
              strong
              block
              @click="openDeleteConfirm(item)"
            >
              <template #icon>
                <i class="fa-solid fa-trash" style="padding-left:5px;"></i>
              </template>
              حذف از لیست
            </n-button>
          </n-space>
        </n-space>
      </n-card>
    </transition-group>

    <!-- Action Buttons -->
    <n-space justify="center" :size="12" style="margin-top: 1.5rem;">
      <n-button
        secondary
        type="error"
        round
        size="large"
        strong
      >
        <template #icon>
          <i class="fa-solid fa-times"></i>
        </template>
        لغو درخواست
      </n-button>
      <n-button
        secondary
        type="info"
        round
        size="large"
        strong
        @click="handleNewRequest"
      >
        <template #icon>
          <i class="fa-solid fa-plus"></i>
        </template>
        درخواست جدید
      </n-button>
    </n-space>
  </n-space>

  <!-- No Results Modal -->
  <n-modal
    v-model:show="showNoResultsModal"
    preset="card"
    title="نتیجه جستجو"
    :bordered="false"
    size="medium"
    :mask-closable="false"
  >
    <template #header>
      <n-space vertical :size="16" style="text-align: center; width: 100%;">
        <n-icon size="64" color="#d03050">
          <i class="fa-solid fa-circle-exclamation"></i>
        </n-icon>
        <n-text strong style="font-size: 1.125rem;">
          نتیجه جستجو
        </n-text>
      </n-space>
    </template>

    <n-space vertical :size="16" style="text-align: center; padding: 1rem 0;">
      <n-text style="font-size: 1rem;">
        متاسفانه هیچ خدمات دهنده ای برای خدمت مورد نظر در محدوده شما یافت نشد
      </n-text>
    </n-space>

    <template #footer>
      <n-space justify="center" style="width: 100%;">
        <n-button
          secondary
          round
          size="large"
          strong
          @click="showNoResultsModal = false"
        >
          بستن
        </n-button>
      </n-space>
    </template>
  </n-modal>

  <!-- Error Modal (409) -->
  <n-modal
    v-model:show="showErrorModal"
    preset="card"
    title="خطا"
    :bordered="false"
    size="medium"
    :mask-closable="false"
    style="max-width: calc(100% - 3rem); margin: 0 1.5rem;"
  >
    <template #header>
      <n-space vertical :size="16" style="text-align: center; width: 100%;">
        <n-icon size="64" color="#d03050">
          <i class="fa-solid fa-circle-exclamation"></i>
        </n-icon>
        <n-text strong type="error" style="font-size: 1.125rem;">
          خطا
        </n-text>
      </n-space>
    </template>

    <n-space vertical :size="16" style="text-align: center; padding: 1rem 0;">
      <n-text style="font-size: 1rem;">
        {{ errorMessage }}
      </n-text>
    </n-space>

    <template #footer>
      <n-space justify="center" style="width: 100%;">
        <n-button
          secondary
          type="error"
          round
          size="large"
          strong
          @click="showErrorModal = false"
        >
          بستن
        </n-button>
      </n-space>
    </template>
  </n-modal>

  <!-- Delete from list confirmation modal -->
  <n-modal
    v-model:show="showDeleteConfirmModal"
    preset="card"
    title="تأیید حذف"
    :bordered="false"
    size="medium"
    :mask-closable="!cancelLoading"
    :close-on-esc="!cancelLoading"
  >
    <n-text>
      آیا از حذف {{ deleteTargetItem?.user?.name }} از لیست جستجو اطمینان دارید؟
    </n-text>
    <template #footer>
      <n-space justify="center" :size="12" style="width: 100%;">
        <n-button
          secondary
          round
          size="large"
          :disabled="cancelLoading"
          @click="showDeleteConfirmModal = false; deleteTargetItem = null"
        >
          خیر
        </n-button>
        <n-button
          type="error"
          round
          size="large"
          :loading="cancelLoading"
          @click="confirmRemoveFromList"
        >
          بله
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h, TransitionGroup } from 'vue'
import { NSpace, NText, NSelect, NInputNumber, NButton, NIcon, NAvatar, NCard, NModal, NSpin, useMessage } from 'naive-ui'
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

interface SearchResultUser {
  id: number
  name: string
  phone: string | null
  image: string | null
}

interface SearchResultCategory {
  id: number
  name: string
  description: string | null
  image: string | null
  num: number
  created_at: string
  updated_at: string
}

interface SearchResultImplement {
  id: number
  name: string
  code: string | null
  image: string
  category: SearchResultCategory
}

interface SearchResultItem {
  dis: number
  price_type: string
  price: string
  implement: SearchResultImplement
  user: SearchResultUser
}

interface SearchResultLand {
  id: number
  name: string
  area: number
}

interface SearchResultImplementInfo {
  id: number
  name: string
  image: string
  form_ids: number[]
}

interface SearchResponse {
  result: {
    data: SearchResultItem[]
    land: SearchResultLand
    implement: SearchResultImplementInfo
    request_id?: number
  }
  message: string | null
}

interface PendingRequestItem {
  id: number
  user_id: number
  implement_id: number
  user_land_id: number
  provider_id: number | null
  location: string
  area: string
  price: string | null
  status: string
  search_result: SearchResultItem[]
  code: string
  dates: string[]
  done_at: string | null
  created_at: string
  updated_at: string
  users_count: number
  implement: Service
  land: {
    id: number
    user_id: number
    title: string
    description: string | null
    image: string | null
    area: number
    location: string
    created_at: string
    updated_at: string
  }
}

interface PendingRequestsResponse {
  result: PendingRequestItem[]
  message: string | null
}

/** آیتم برگشتی از GET /users/search/requests/users/{request-id} */
interface RequestUserItem {
  id: number
  request_id: number
  user_id: number
  user_implement_id: number
  price: string
  distance: string
  status: string
  created_at: string
  updated_at: string
}

interface RequestUsersResponse {
  result: RequestUserItem[]
  message: string | null
}

const selectedCategoryId = ref<number | null>(null)
const selectedServiceId = ref<number | null>(null)
const selectedLandId = ref<number | null>(null)
const workArea = ref<number | null>(null)
const selectedDates = ref<string[]>([])

// Search state
const showResults = ref(false)
const searchResults = ref<SearchResponse['result'] | null>(null)
const currentRequestId = ref<number | null>(null)
const searchLoading = ref(false)
const showNoResultsModal = ref(false)
const showErrorModal = ref(false)
const errorMessage = ref<string>('')
const loadingPendingRequests = ref(false)

// Delete from list (cancel user) state
const showDeleteConfirmModal = ref(false)
const deleteTargetItem = ref<SearchResultItem | null>(null)
const cancelLoading = ref(false)

// ارسال درخواست به خدمات‌دهنده: کاربرانی که درخواست براشون ارسال شده
const requestSentUserIds = ref<number[]>([])
const sendRequestLoadingUserId = ref<number | null>(null)

// Sort state
const sortType = ref<string>('random')
const sortOptions = [
  { label: 'تصادفی', value: 'random' },
  { label: 'کمترین فاصله', value: 'distance_asc' },
  { label: 'کمترین هزینه', value: 'price_asc' },
  { label: 'بیشترین هزینه', value: 'price_desc' },
  { label: 'بیشترین فاصله', value: 'distance_desc' }
]

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

// Handle search
const handleSearch = async () => {
  if (!selectedLandId.value || !selectedServiceId.value || !workArea.value || selectedDates.value.length === 0) {
    message.warning('لطفا تمام فیلدها را پر کنید')
    return
  }

  searchLoading.value = true

  try {
    const requestData = {
      user_land_id: selectedLandId.value,
      area: workArea.value.toString(),
      implement_id: selectedServiceId.value,
      dates: datesForServer.value
    }

    const response = await api.post<SearchResponse>('/users/search/providers', requestData)

    if (response.data && response.data.result) {
      if (response.data.result.data && response.data.result.data.length > 0) {
        // Has results - show results view
        searchResults.value = response.data.result
        currentRequestId.value = response.data.result.request_id ?? null
        requestSentUserIds.value = []
        sortType.value = 'random' // Reset sort to default
        showResults.value = true
      } else {
        // No results - show modal
        showNoResultsModal.value = true
      }
    } else {
      message.error('خطا در دریافت نتایج جستجو')
    }
  } catch (error: any) {
    console.error('Error searching providers:', error)
    
    // Handle 409 status code
    if (error.response?.status === 409 && error.response?.data?.error) {
      errorMessage.value = error.response.data.error
      showErrorModal.value = true
    } else {
      message.error('خطا در جستجو خدمات. لطفا دوباره تلاش کنید.')
    }
  } finally {
    searchLoading.value = false
  }
}

// Handle new request - return to search form
const handleNewRequest = () => {
  showResults.value = false
  searchResults.value = null
  currentRequestId.value = null
  requestSentUserIds.value = []
  sortType.value = 'random'
}

// Sorted results based on sort type
const sortedResults = computed(() => {
  if (!searchResults.value || !searchResults.value.data) {
    return []
  }

  const data = [...searchResults.value.data]

  switch (sortType.value) {
    case 'distance_asc':
      // کمترین فاصله (از کم به زیاد)
      return data.sort((a, b) => a.dis - b.dis)
    
    case 'distance_desc':
      // بیشترین فاصله (از زیاد به کم)
      return data.sort((a, b) => b.dis - a.dis)
    
    case 'price_asc':
      // کمترین هزینه (از کم به زیاد)
      return data.sort((a, b) => parseInt(a.price) - parseInt(b.price))
    
    case 'price_desc':
      // بیشترین هزینه (از زیاد به کم)
      return data.sort((a, b) => parseInt(b.price) - parseInt(a.price))
    
    case 'random':
    default:
      // تصادفی (حالت اصلی - بدون تغییر)
      return data
  }
})

// Handle sort change (optional - for any side effects if needed)
const handleSortChange = () => {
  // Computed property will automatically update
}

// ارسال درخواست به خدمات‌دهنده (یک آیتم)
const handleSendRequest = async (item: SearchResultItem) => {
  if (!currentRequestId.value) return
  const userId = item.user.id
  sendRequestLoadingUserId.value = userId
  try {
    await api.post('/users/search/requests', {
      request_id: currentRequestId.value,
      user_id: userId
    })
    message.success('درخواست با موفقیت ارسال شد')
    requestSentUserIds.value = [...requestSentUserIds.value, userId]
  } catch (err: any) {
    if (err.response?.status === 409 && err.response?.data?.error) {
      message.error(err.response.data.error)
    } else {
      message.error(err.response?.data?.message || 'خطا در ارسال درخواست')
    }
  } finally {
    sendRequestLoadingUserId.value = null
  }
}

const isRequestSentForUser = (userId: number) => requestSentUserIds.value.includes(userId)

// Open delete-from-list confirmation for an item
const openDeleteConfirm = (item: SearchResultItem) => {
  deleteTargetItem.value = item
  showDeleteConfirmModal.value = true
}

// Confirm remove user from list: call cancel API then remove item from list
const confirmRemoveFromList = async () => {
  if (!currentRequestId.value || !deleteTargetItem.value || !searchResults.value?.data) return
  const requestId = currentRequestId.value
  const userId = deleteTargetItem.value.user.id

  cancelLoading.value = true
  try {
    await api.post('/users/search/requests/user/cancel', {
      request_id: requestId,
      user_id: userId
    })
    searchResults.value.data = searchResults.value.data.filter(
      (i) => i.user.id !== userId
    )
    requestSentUserIds.value = requestSentUserIds.value.filter((id) => id !== userId)
    message.success('حذف با موفقیت انجام شد')
    showDeleteConfirmModal.value = false
    deleteTargetItem.value = null
  } catch (err: any) {
    message.error(err.response?.data?.message || 'خطا در حذف از لیست')
  } finally {
    cancelLoading.value = false
  }
}

// Map pending request to search results format
const mapPendingRequestToSearchResults = (pendingRequest: PendingRequestItem): SearchResponse['result'] => {
  return {
    data: pendingRequest.search_result || [],
    land: {
      id: pendingRequest.land.id,
      name: pendingRequest.land.title,
      area: pendingRequest.land.area
    },
    implement: {
      id: pendingRequest.implement.id,
      name: pendingRequest.implement.name,
      image: pendingRequest.implement.image || '',
      form_ids: pendingRequest.implement.form_ids || []
    },
    request_id: pendingRequest.id
  }
}

// Fetch pending requests
const fetchPendingRequests = async () => {
  loadingPendingRequests.value = true
  try {
    const response = await api.get<PendingRequestsResponse>('/users/search/requests/pending')
    
    if (response.data && response.data.result && response.data.result.length > 0) {
      // Get first pending request
      const firstPendingRequest = response.data.result[0]
      
      // Map to search results format
      const mappedResults = mapPendingRequestToSearchResults(firstPendingRequest)
      
      // Set search results
      searchResults.value = mappedResults
      currentRequestId.value = firstPendingRequest.id
      sortType.value = 'random' // Reset sort to default
      showResults.value = true

      // دریافت لیست کاربرانی که برایشان درخواست ارسال شده (وضعیت در انتظار تایید)
      try {
        const usersRes = await api.get<RequestUsersResponse>(
          `/users/search/requests/users/${firstPendingRequest.id}`
        )
        if (usersRes.data?.result?.length) {
          const sentIds = usersRes.data.result
            .filter((row) => row.status === 'pending')
            .map((row) => row.user_id)
          requestSentUserIds.value = sentIds
        } else {
          requestSentUserIds.value = []
        }
      } catch (_) {
        requestSentUserIds.value = []
      }
    } else {
      // No pending requests - show search form
      showResults.value = false
    }
  } catch (error: any) {
    console.error('Error fetching pending requests:', error)
    // On error, show search form
    showResults.value = false
  } finally {
    loadingPendingRequests.value = false
  }
}

onMounted(async () => {
  // First check for pending requests
  await fetchPendingRequests()
  
  // Always fetch categories and lands (needed for search form)
  fetchCategories()
  fetchLands()
})
</script>

<style scoped>
/* Provider Cards Container */
.provider-cards-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* List Transition Animations */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.list-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(-30px) scale(0.95);
}

.list-leave-active {
  position: absolute;
  width: 100%;
}

/* Smooth move animation for reordering */
.list-move {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Add a subtle scale effect on hover during transition */
.list-enter-active .n-card {
  animation: slideInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
