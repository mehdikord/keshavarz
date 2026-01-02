<template>
  <n-card :bordered="true" class="land-card" :style="{ '--bg-image': `url(${landItemBg})` }" :content-style="{ paddingBottom: '0.75rem' }">
    <n-space vertical :size="12">
      <!-- Card Header -->
      <n-space justify="space-between" align="center">
        <n-space vertical :size="4">
          <n-text strong style="font-size: 1.125rem; color: white;">
            {{ land.title }}
          </n-text>
          <n-text style="font-size: 0.875rem; color: white; opacity: 0.9;">
            مساحت: {{ formatArea(land.area) }} متر مربع
          </n-text>
        </n-space>
      </n-space>

      <!-- Action Buttons -->
      <n-space justify="end" :size="4">
        <n-button
          circle
          size="medium"
          secondary
          type="info"
          class="white-button"
          @click="toggleMap"
        >
          <template #icon>
            <i class="fa-solid fa-map" style="color: white !important;"></i>
          </template>
        </n-button>

        <n-button
          circle
          size="medium"
          secondary
          type="warning"
          class="white-button"
          @click="handleEdit"
        >
          <template #icon>
            <i class="fa-solid fa-pencil" style="color: white !important;"></i>
          </template>
        </n-button>

        <n-button
          circle
          size="medium"
          secondary
          type="error"
          class="white-button"
          @click="handleDelete"
        >
          <template #icon>
            <i class="fa-solid fa-trash" style="color: white !important;"></i>
          </template>
        </n-button>
      </n-space>

      <!-- Collapsible Map -->
      <n-collapse-transition :show="showMap">
        <div v-if="showMap" class="map-wrapper">
          <n-space vertical :size="8">
            <n-space justify="space-between" align="center">
              <n-text strong style="font-size: 0.875rem; color: white;">موقعیت روی نقشه</n-text>
              <n-button
                circle
                size="small"
                quaternary
                @click="toggleMap"
              >
                <template #icon>
                  <i class="fa-solid fa-xmark"></i>
                </template>
              </n-button>
            </n-space>
            <MapViewer :location="land.location" />
          </n-space>
        </div>
      </n-collapse-transition>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NSpace, NText, NButton, NCollapseTransition, useMessage, useDialog } from 'naive-ui'
import MapViewer from './MapViewer.vue'
import api from '../utils/api'
import landItemBg from '../assets/images/backgrounds/land-item-bg.png'

interface Land {
  id: number
  title: string
  location: string | [string, string]
  area: number
  description: string | null
  created_at: string
  updated_at: string
}

const props = defineProps<{
  land: Land
}>()

const emit = defineEmits<{
  delete: [id: number]
}>()

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const showMap = ref(false)

const formatArea = (area: number) => {
  return new Intl.NumberFormat('fa-IR').format(area)
}

const toggleMap = () => {
  showMap.value = !showMap.value
}

const handleEdit = () => {
  router.push(`/users/lands/edit/${props.land.id}`)
}

const handleDelete = () => {
  const d = dialog.warning({
    title: 'تایید حذف',
    content: `آیا برای حذف زمین ${props.land.title} مطمئن هستید؟`,
    action: () => h('div', { style: { display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' } }, [
      h(NButton, {
        strong: true,
        secondary: true,
        type: 'error',
        onClick: () => d.destroy()
      }, {
        default: () => [
          h('i', { class: 'fa-solid fa-xmark', style: { marginLeft: '0.5rem' } }),
          'انصراف'
        ]
      }),
      h(NButton, {
        strong: true,
        secondary: true,
        type: 'success',
        onClick: async () => {
          try {
            await api.delete(`/users/lands/${props.land.id}`)
            message.success('زمین با موفقیت حذف شد')
            emit('delete', props.land.id)
            d.destroy()
          } catch (err: any) {
            console.error('Error deleting land:', err)
            message.error(err.response?.data?.message || 'خطا در حذف زمین')
          }
        }
      }, {
        default: () => [
          h('i', { class: 'fa-solid fa-check', style: { marginLeft: '0.5rem' } }),
          'حذف'
        ]
      })
    ])
  })
}
</script>

<style scoped>
.land-card {
  border-radius: 1rem;
  position: relative;
  overflow: hidden;
}

.land-card::before {
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

.land-card :deep(.n-card__content) {
  position: relative;
  z-index: 1;
}

.map-wrapper {
  padding-top: 0.5rem;
}

.white-button :deep(.n-button) {
  background-color: rgba(255, 255, 255, 0.9) !important;
  color: white !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
}

.white-button :deep(.n-button:hover) {
  background-color: rgba(255, 255, 255, 1) !important;
}

.white-button :deep(.n-button i),
.white-button :deep(i),
.white-button i {
  color: white !important;
}

.white-button :deep(.n-button__icon) {
  color: white !important;
}
</style>

