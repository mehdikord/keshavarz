<template>
  <n-card :bordered="false">
    <n-spin :show="loading">
      <n-space vertical :size="16">
        <!-- Title: وضعیت فعلی آب و هوا -->
        <n-text strong style="font-size: 1.125rem;">
          وضعیت فعلی آب و هوا
        </n-text>

        <!-- Header with city name and location button -->
        <n-space justify="space-between" align="center">
          <n-text strong style="font-size: 1.125rem;">
            {{ weatherData?.city || 'گرگان' }}
          </n-text>
          <n-button
            type="primary"
            size="small"
            round
            @click="handleGetLocation"
            :loading="loading"
          >
            <template #icon>
              <i class="fa-solid fa-location-crosshairs"></i>
            </template>
            موقعیت من
          </n-button>
        </n-space>

        <!-- Weather Icon and Temperature -->
        <n-space align="center" :size="16">
          <div v-if="weatherData?.icon">
            <img
              :src="`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`"
              :alt="weatherData.description"
              style="width: 80px; height: 80px;"
            />
          </div>
          <n-space vertical :size="4">
            <n-text strong style="font-size: 3rem; line-height: 1;">
              {{ weatherData?.temperature || '--' }}°
            </n-text>
            <n-text depth="3" style="font-size: 1rem;">
              {{ weatherData?.description || 'در حال دریافت...' }}
            </n-text>
          </n-space>
        </n-space>

        <!-- Weather Details -->
        <n-space justify="space-between" style="margin-top: 8px;">
          <n-space vertical :size="4" align="center">
            <n-text depth="3" style="font-size: 0.875rem;">
              احساس می‌شود
            </n-text>
            <n-text strong style="font-size: 1.125rem;">
              {{ weatherData?.feelsLike || '--' }}°
            </n-text>
          </n-space>

          <n-space vertical :size="4" align="center">
            <n-text depth="3" style="font-size: 0.875rem;">
              رطوبت
            </n-text>
            <n-text strong style="font-size: 0.75rem;">
              {{ weatherData?.humidity || '--' }}%
            </n-text>
          </n-space>

          <n-space vertical :size="4" align="center">
            <n-text depth="3" style="font-size: 0.875rem;">
              باد
            </n-text>
            <n-text strong style="font-size: 0.75rem;">
              {{ weatherData?.windSpeed || '--' }} کیلومتر/ساعت
            </n-text>
          </n-space>
        </n-space>

        <!-- Forecast Toggle Button -->
        <n-divider v-if="forecastData.length > 0" style="margin-top: 8px; margin-bottom: 3px;" />
        <n-button
          v-if="forecastData.length > 0"
          text
          block
          @click="showForecast = !showForecast"
          style="justify-content: space-between;"
        >
          <n-text strong style="font-size: 0.875rem;">
            پیش‌بینی روزهای آینده
          </n-text>
          <i 
            :class="['fa-solid', showForecast ? 'fa-chevron-up' : 'fa-chevron-down']"
            style="transition: transform 0.3s ease;"
          ></i>
        </n-button>

        <!-- Forecast Section with Animation -->
        <transition name="slide-fade">
          <n-space v-if="showForecast && forecastData.length > 0" vertical :size="12">
            <n-space vertical :size="8">
              <n-card
                v-for="(day, index) in forecastData"
                :key="index"
                size="small"
                :bordered="false"
              >
                <n-space justify="space-between" align="center">
                  <n-space align="center" :size="12">
                    <div v-if="day.icon">
                      <img
                        :src="`https://openweathermap.org/img/wn/${day.icon}.png`"
                        :alt="day.description"
                        style="width: 40px; height: 40px;"
                      />
                    </div>
                    <n-space vertical :size="2">
                      <n-text strong>{{ day.dayName }}</n-text>
                      <n-text depth="3" style="font-size: 0.75rem;">
                        {{ day.date }}
                      </n-text>
                    </n-space>
                  </n-space>
                  <n-space vertical :size="2" align="end">
                    <n-space align="center" :size="12">
                      <n-space align="center" :size="8">
                        <n-text depth="3" style="font-size: 0.875rem;">
                          {{ day.minTemp }}°
                        </n-text>
                        <n-text strong style="font-size: 1rem;">
                          {{ day.maxTemp }}°
                        </n-text>
                      </n-space>
                      <n-text depth="3" style="font-size: 0.75rem;">
                        {{ day.description }}
                      </n-text>
                    </n-space>
                  </n-space>
                </n-space>
              </n-card>
            </n-space>
          </n-space>
        </transition>

        <!-- Error Message -->
        <n-alert
          v-if="error && !loading"
          type="error"
          :title="error"
          closable
          @close="error = null"
        />
      </n-space>
    </n-spin>
  </n-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NCard, NSpace, NText, NButton, NSpin, NAlert, NDivider, useMessage } from 'naive-ui'
import { useWeather } from '../composables/useWeather'

const message = useMessage()
const showForecast = ref(false)

const { 
  loading, 
  weatherData, 
  forecastData, 
  error, 
  getWeatherByCity, 
  loadWeatherByUserLocation,
  getForecastByCity,
  loadForecastByUserLocation
} = useWeather()

const handleGetLocation = async () => {
  const result = await loadWeatherByUserLocation()
  if (result) {
    await loadForecastByUserLocation()
    message.success('اطلاعات هواشناسی بر اساس موقعیت شما به‌روزرسانی شد')
  } else if (error.value) {
    message.error(error.value)
  }
}

const loadWeatherAndForecast = async (cityName: string) => {
  await getWeatherByCity(cityName)
  await getForecastByCity(cityName)
}

onMounted(async () => {
  // Load default city (Gorgan) on mount
  await loadWeatherAndForecast('Gorgan')
})
</script>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>

