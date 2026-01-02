<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
// @ts-ignore - Leaflet types will be available after npm install
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Props {
  location: string | [string, string]
}

const props = defineProps<Props>()

const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let marker: L.Marker | null = null

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

// تبدیل location به [lat, lng]
const parseLocation = (location: string | [string, string]): [number, number] => {
  if (Array.isArray(location)) {
    return [parseFloat(location[0]), parseFloat(location[1])]
  }
  
  // اگر string است، split کن
  const parts = location.split(',')
  if (parts.length === 2) {
    return [parseFloat(parts[1].trim()), parseFloat(parts[0].trim())] // lat, lng
  }
  
  // fallback
  return [36.8427, 54.4319] // گرگان
}

const initMap = () => {
  if (!mapContainer.value) return

  setupLeafletIcon()

  const location = parseLocation(props.location)
  const center: [number, number] = location
  const zoom = 15

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

  // اضافه کردن لایه label فارسی
  const mapboxLabelsUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`
  
  const labelsLayer = L.tileLayer(mapboxLabelsUrl, {
    attribution: '',
    maxZoom: 20,
    tileSize: 512,
    zoomOffset: -1,
    opacity: 0.6,
  })
  
  labelsLayer.addTo(map)

  // اضافه کردن مارکر (فقط نمایش)
  marker = L.marker([location[0], location[1]], {
    draggable: false, // غیرفعال کردن drag
  }).addTo(map)
}

// تماشای تغییرات location
watch(() => props.location, (newLocation) => {
  if (map) {
    const location = parseLocation(newLocation)
    if (marker) {
      marker.setLatLng([location[0], location[1]])
    } else {
      marker = L.marker([location[0], location[1]], {
        draggable: false,
      }).addTo(map)
    }
    map.setView([location[0], location[1]], map.getZoom())
  }
})

onMounted(() => {
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
  height: 300px;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
</style>


