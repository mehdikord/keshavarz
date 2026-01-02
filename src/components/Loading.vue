<template>
  <div :class="['loading-container', { 'loading-fullscreen': fullscreen, 'loading-inline': !fullscreen }]">
    <n-space vertical :size="16" align="center">
      <div class="loading-icon-wrapper">
        <i class="fa-solid fa-seedling loading-icon"></i>
      </div>
      <n-text v-if="text" depth="3" class="loading-text">{{ text }}</n-text>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { NSpace, NText } from 'naive-ui'

interface Props {
  fullscreen?: boolean
  text?: string
}

withDefaults(defineProps<Props>(), {
  fullscreen: true,
  text: ''
})
</script>

<style scoped>
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.95);
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.loading-inline {
  padding: 2rem;
  min-height: 200px;
}

.loading-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-icon {
  font-size: 4rem;
  color: #1e6b3f;
  animation: spin 2s linear infinite;
}

.loading-text {
  font-family: 'Vazirmatn', sans-serif;
  font-size: 1rem;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

