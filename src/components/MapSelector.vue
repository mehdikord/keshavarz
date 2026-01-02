<template>
  <n-card :bordered="false" :content-style="{ padding: '0.5rem' }">
    <n-space vertical :size="6">
      <n-space justify="space-between" align="center">
        <n-text strong style="font-size: 1rem;">
          انتخاب موقعیت زمین روی نقشه
        </n-text>
        <n-button 
          size="small" 
          strong
          secondary
          round
          type="info"
          :loading="gettingLocation"
          @click="getUserLocation"
          style="gap: 0.5rem;"
        >
          <template #icon>
            <i class="fa-solid fa-location-crosshairs"></i>
          </template>
          موقعیت من
        </n-button>
      </n-space>
      
      <div ref="mapContainer" class="map-container"></div>
      
      <!-- Success Message -->
      <div v-if="selectedLocation" class="success-message">
        <n-space align="center" :size="8">
          <i class="fa-solid fa-circle-check" style="color: #18a058; font-size: 1rem;"></i>
          <n-text style="color: #18a058; font-size: 14px;">
            موقعیت زمین انتخاب شد
          </n-text>
        </n-space>
      </div>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { NCard, NSpace, NText, NButton, useMessage } from 'naive-ui'
// @ts-ignore - Leaflet types will be available after npm install
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Location {
  lat: number
  lng: number
}

const props = defineProps<{
  modelValue?: Location | null
  defaultCenter?: [number, number]
  defaultZoom?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Location | null]
}>()

const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let marker: L.Marker | null = null
let userLocationMarker: L.Marker | null = null
const selectedLocation = ref<Location | null>(props.modelValue || null)
const gettingLocation = ref(false)
const message = useMessage()

// @ts-ignore
const MAPBOX_ACCESS_TOKEN = (import.meta as any).env?.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoibWVoZGlrb3JkIiwiYSI6ImNscDVvNjVoYzFxbW4ycXM2c3M1eDhucG0ifQ.noGyn-O38M9CXKLZFk9FNA'

// تنظیم آیکون پیش‌فرض Leaflet
const setupLeafletIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

const initMap = () => {
  if (!mapContainer.value) return

  setupLeafletIcon()

  // مرکز پیش‌فرض: ایران (گرگان)
  const center: [number, number] = props.defaultCenter || [36.8427, 54.4319]
  const zoom = props.defaultZoom || 13

  // ایجاد نقشه
  map = L.map(mapContainer.value, {
    center,
    zoom,
    zoomControl: true,
  })

  // اضافه کردن Mapbox Satellite tiles (پس‌زمینه)
  const mapboxSatelliteUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`
  
  L.tileLayer(mapboxSatelliteUrl, {
    attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 20,
    tileSize: 512,
    zoomOffset: -1,
  }).addTo(map)

  // اضافه کردن لایه label فارسی (نام مکان‌ها و خیابان‌ها)
  // استفاده از Mapbox Streets tiles با opacity کم برای نمایش label ها
  const mapboxLabelsUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`
  
  const labelsLayer = L.tileLayer(mapboxLabelsUrl, {
    attribution: '',
    maxZoom: 20,
    tileSize: 512,
    zoomOffset: -1,
    opacity: 0.6,
  })
  
  // اضافه کردن لایه label به نقشه
  labelsLayer.addTo(map)

  // اضافه کردن رویداد کلیک
  map.on('click', (e: any) => {
    const location: Location = {
      lat: e.latlng.lat,
      lng: e.latlng.lng,
    }
    
    selectedLocation.value = location
    emit('update:modelValue', location)
    
    // اضافه یا جابجایی مارکر
    if (marker) {
      marker.setLatLng([location.lat, location.lng])
    } else {
      marker = L.marker([location.lat, location.lng], {
        draggable: true,
      }).addTo(map!)
      
      // رویداد drag برای جابجایی مارکر
      marker.on('dragend', (e: any) => {
        const draggedLocation: Location = {
          lat: e.target.getLatLng().lat,
          lng: e.target.getLatLng().lng,
        }
        selectedLocation.value = draggedLocation
        emit('update:modelValue', draggedLocation)
      })
    }
  })

  // اگر موقعیت اولیه وجود دارد، مارکر را اضافه کن
  if (selectedLocation.value) {
    marker = L.marker([selectedLocation.value.lat, selectedLocation.value.lng], {
      draggable: true,
    }).addTo(map)
    
    marker.on('dragend', (e: any) => {
      const draggedLocation: Location = {
        lat: e.target.getLatLng().lat,
        lng: e.target.getLatLng().lng,
      }
      selectedLocation.value = draggedLocation
      emit('update:modelValue', draggedLocation)
    })
  }
}

// تماشای تغییرات modelValue از خارج
watch(() => props.modelValue, (newValue) => {
  if (newValue && map) {
    selectedLocation.value = newValue
    if (marker) {
      marker.setLatLng([newValue.lat, newValue.lng])
    } else {
      marker = L.marker([newValue.lat, newValue.lng], {
        draggable: true,
      }).addTo(map)
      
      marker.on('dragend', (e: any) => {
        const draggedLocation: Location = {
          lat: e.target.getLatLng().lat,
          lng: e.target.getLatLng().lng,
        }
        selectedLocation.value = draggedLocation
        emit('update:modelValue', draggedLocation)
      })
    }
    map.setView([newValue.lat, newValue.lng], 15)
  } else if (!newValue && marker && map) {
    map.removeLayer(marker)
    marker = null
    selectedLocation.value = null
  }
})

// تابع دریافت موقعیت GPS کاربر
const getUserLocation = () => {
  if (!map) return

  gettingLocation.value = true

  // استفاده از Geolocation API مرورگر
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude
        const userLng = position.coords.longitude

        // انتقال نقشه به موقعیت کاربر
        map!.setView([userLat, userLng], 15)

        // حذف مارکر قبلی موقعیت کاربر (اگر وجود داشت)
        if (userLocationMarker && map) {
          map.removeLayer(userLocationMarker)
        }

        // اضافه کردن مارکر جدید برای موقعیت کاربر
        const userIcon = L.divIcon({
          className: 'user-location-marker',
          html: '<div style="width: 20px; height: 20px; background-color: #1e6b3f; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })

        userLocationMarker = L.marker([userLat, userLng], {
          icon: userIcon,
          zIndexOffset: 1000,
        }).addTo(map!)

        gettingLocation.value = false
        message.success('موقعیت شما روی نقشه نمایش داده شد')
      },
      (error) => {
        gettingLocation.value = false
        let errorMessage = 'خطا در دریافت موقعیت'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'دسترسی به موقعیت رد شد. لطفا مجوز دسترسی را فعال کنید'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'اطلاعات موقعیت در دسترس نیست'
            break
          case error.TIMEOUT:
            errorMessage = 'زمان دریافت موقعیت به پایان رسید'
            break
        }
        
        message.error(errorMessage)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  } else {
    gettingLocation.value = false
    message.error('مرورگر شما از Geolocation پشتیبانی نمی‌کند')
  }
}

onMounted(() => {
  // کمی تاخیر برای اطمینان از render شدن DOM
  setTimeout(() => {
    initMap()
  }, 100)
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 400px;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.success-message {
  padding: 0.5rem;
  background-color: rgba(24, 160, 88, 0.1);
  border-radius: 0.5rem;
  border: 1px solid rgba(24, 160, 88, 0.2);
}

/* استایل‌های Leaflet */
:deep(.leaflet-container) {
  font-family: 'Vazirmatn', sans-serif;
}

:deep(.leaflet-control-zoom) {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

:deep(.leaflet-control-zoom a) {
  background-color: #ffffff;
  color: #1e6b3f;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

:deep(.leaflet-control-zoom a:hover) {
  background-color: #1e6b3f;
  color: #ffffff;
}
</style>

