<template>
  <n-space vertical :size="24" style="padding: 0.65rem;">
    <!-- Weather Widget -->
    <WeatherWidget />

    <!-- Lands Card -->
    <router-link to="/users/lands" style="text-decoration: none; display: block;">
      <n-card :bordered="false" class="lands-card" :style="{ '--bg-image': `url(${landsBg})` }">
        <div class="lands-card-content">
          <n-text strong style="font-size: 1.5rem; color: #ffffff;">
            زمین های من
          </n-text>
          <n-text style="font-size: 1rem; color: rgba(255, 255, 255, 0.9); display: block; margin-top: 0.5rem;">
            لیست زمین های کشاورزی
          </n-text>
        </div>
      </n-card>
    </router-link>
  </n-space>
</template>

<script setup lang="ts">
import { NSpace, NCard, NText } from 'naive-ui'
import WeatherWidget from '../../components/WeatherWidget.vue'
import landsBg from '../../assets/images/backgrounds/lands-bg.png'
</script>

<style scoped>
.lands-card {
  width: 100%;
  position: relative;
  overflow: hidden;
  background-image: var(--bg-image);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 1rem;
}

.lands-card::before {
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

.lands-card-content {
  position: relative;
  z-index: 1;
  padding: 1rem 1.5rem 1.5rem 1.5rem;
}
</style>
