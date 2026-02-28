<template>
  <div class="services-page">
    <n-spin :show="loadingProfile">
      <n-space vertical :size="16" class="services-page-space">
        <!-- محدوده جغرافیایی کار -->
        <n-card
          bordered
          round
          class="service-card service-card--geo"
          content-style="padding: 1rem 1.25rem;"
          @click="openGeoModal"
        >
          <div class="service-card-inner">
            <div class="service-card-icon service-card-icon--geo">
              <i class="fa-solid fa-location-dot"></i>
            </div>
            <div class="service-card-body">
              <div class="service-card-title-row">
                <n-text strong class="service-card-title">محدوده جغرافیایی کار</n-text>
                <i
                  v-if="!loadingProfile && !hasSearchLocation"
                  class="fa-solid fa-triangle-exclamation geo-warning-icon"
                  aria-hidden="true"
                />
              </div>
              <n-text depth="2" class="service-card-desc">منطقه‌های تحت پوشش خدمات شما</n-text>
            </div>
            <i class="fa-solid fa-chevron-left service-card-arrow"></i>
          </div>
        </n-card>

        <!-- خدمات قابل ارائه -->
        <n-card
          bordered
          round
          class="service-card service-card--services"
          content-style="padding: 1rem 1.25rem;"
          @click="goToMyServices"
        >
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

        <!-- هشدار محدوده جغرافیایی تنظیم نشده -->
        <n-alert
          v-if="!loadingProfile && !hasSearchLocation"
          type="error"
          class="geo-alert-card"
        >
          برای ارائه خدمات محدود جغرافیایی کار خود را با کلیک روی قسمت مورد نظر در بالا ثبت کنید
        </n-alert>
      </n-space>
    </n-spin>

    <!-- مودال مکان و محدوده کار -->
    <n-modal
      v-model:show="showGeoModal"
      preset="card"
      title="مکان و محدوده کار شما"
      :bordered="false"
      :mask-closable="false"
      size="large"
      :content-style="geoModalContentStyle"
      display-directive="show"
    >
      <div class="geo-modal-body">
        <n-text class="geo-map-label">مکان خود را روی نقشه انتخاب کنید</n-text>
        <div v-if="showGeoModal" class="geo-map-wrapper">
          <MapSelector
            :key="geoMapKey"
            v-model="modalLocation"
            :default-center="mapDefaultCenter"
            :default-zoom="modalLocation ? 14 : 11"
          />
        </div>
        <n-text v-if="modalLocation" depth="2" class="geo-marker-caption">مکان شما</n-text>

        <n-space vertical :size="12" class="geo-range-section">
          <n-text strong class="geo-range-label">محدوده کار (کیلومتر)</n-text>
          <n-slider
            v-model:value="rangeValue"
            :min="20"
            :max="100"
            :step="5"
            :marks="rangeMarks"
          />
          <n-text depth="2" class="geo-range-value">{{ rangeValue }} کیلومتر</n-text>
        </n-space>
      </div>

      <template #footer>
        <n-space justify="end" :size="12" class="geo-modal-footer">
          <n-button strong secondary round @click="showGeoModal = false">
            بستن
          </n-button>
          <n-button
            strong
            secondary
            round
            type="primary"
            :loading="updateGeoLoading"
            @click="onUpdateGeo"
          >
            بروزرسانی اطلاعات
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { NSpace, NCard, NText, NSpin, NAlert, NModal, NButton, NSlider, useMessage } from 'naive-ui'
import api from '../../utils/api'
import MapSelector from '../../components/MapSelector.vue'

const router = useRouter()

interface Location {
  lat: number
  lng: number
}

interface ProfileResult {
  search_location?: string | null
  search_range?: number | null
}

interface ProfileResponse {
  result?: ProfileResult
}

const loadingProfile = ref(true)
const hasSearchLocation = ref(false)
const profileData = ref<ProfileResult | null>(null)

const message = useMessage()
const showGeoModal = ref(false)
const modalLocation = ref<Location | null>(null)
const rangeValue = ref(30)
const geoMapKey = ref(0)
const updateGeoLoading = ref(false)

const IRAN_CENTER: [number, number] = [36.8427, 54.4319]

function parseSearchLocation(value: string | null | undefined): Location | null {
  if (value == null || String(value).trim() === '') return null
  let s = String(value).trim()
  // حذف کوتیشن اضافی در صورت وجود مثلاً: "36.84,54.42"
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    s = s.slice(1, -1).trim()
  }
  const parts = s.split(',')
  if (parts.length < 2) return null
  const a = parseFloat(parts[0].trim())
  const b = parseFloat(parts[1].trim())
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  // پشتیبانی از هر دو فرمت: "lat,lng" یا "lng,lat" (محدوده تقریبی ایران: lat 25–40، lng 44–63)
  const asLatLng = a >= 25 && a <= 40 && b >= 44 && b <= 63
  const asLngLat = b >= 25 && b <= 40 && a >= 44 && a <= 63
  if (asLatLng) return { lat: a, lng: b }
  if (asLngLat) return { lat: b, lng: a }
  return { lat: a, lng: b }
}

const mapDefaultCenter = computed<[number, number]>(() => {
  if (modalLocation.value) return [modalLocation.value.lat, modalLocation.value.lng]
  return IRAN_CENTER
})

const rangeMarks = computed(() => ({
  20: '۲۰',
  50: '۵۰',
  80: '۸۰',
  100: '۱۰۰',
}))

const geoModalContentStyle = {
  maxHeight: 'calc(100vh - 120px)',
  overflow: 'auto',
  padding: '1rem 1.25rem',
}

function goToMyServices() {
  router.push({ name: 'providers-my-services' })
}

function openGeoModal() {
  const result = profileData.value
  modalLocation.value = parseSearchLocation(result?.search_location ?? undefined)
  rangeValue.value = result?.search_range != null && result.search_range >= 20 && result.search_range <= 100
    ? result.search_range
    : 30
  geoMapKey.value += 1
  showGeoModal.value = true
}

async function onUpdateGeo() {
  const loc = modalLocation.value
  const locationStr = loc ? `${loc.lat},${loc.lng}` : ''
  updateGeoLoading.value = true
  try {
    await api.post('/users/provider/range', {
      range: rangeValue.value,
      location: locationStr,
    })
    message.success('اطلاعات محدوده جغرافیایی کار با موفقیت بروزرسانی شد')
    showGeoModal.value = false
    await fetchProfile()
  } catch {
    message.error('بروزرسانی محدوده جغرافیایی انجام نشد. دوباره تلاش کنید.')
  } finally {
    updateGeoLoading.value = false
  }
}

async function fetchProfile() {
  loadingProfile.value = true
  try {
    const { data } = await api.get<ProfileResponse>('/users/profile')
    profileData.value = data?.result ?? null
    const loc = data?.result?.search_location
    hasSearchLocation.value = !!loc && String(loc).trim() !== ''
  } catch {
    hasSearchLocation.value = false
    profileData.value = null
  } finally {
    loadingProfile.value = false
  }
}

onMounted(fetchProfile)
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

.service-card-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.service-card-title {
  font-size: 1rem;
  display: block;
}

.geo-warning-icon {
  color: var(--n-error-color, #d03050);
  font-size: 1.125rem;
  flex-shrink: 0;
  animation: geo-blink 1.2s ease-in-out infinite;
}

@keyframes geo-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.geo-alert-card {
  border-radius: 12px;
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

/* مودال مکان و محدوده - محتوا */
.geo-modal-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.geo-map-label {
  font-size: 0.9375rem;
  display: block;
}

.geo-map-wrapper {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--n-border-color);
}

.geo-map-wrapper .map-container {
  height: 300px;
}

.geo-marker-caption {
  font-size: 0.8125rem;
  display: block;
}

.geo-range-section {
  margin-top: 0.5rem;
}

.geo-range-label {
  font-size: 0.9375rem;
}

.geo-range-value {
  font-size: 0.875rem;
}

.geo-modal-footer {
  width: 100%;
}
</style>
