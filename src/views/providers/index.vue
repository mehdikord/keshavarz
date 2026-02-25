<template>
  <div class="providers-page">
    <n-space vertical :size="24" class="providers-index-space">
      <!-- محتوای صفحه اصلی پنل خدمات‌دهندگان به زودی -->
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { NSpace } from 'naive-ui'
</script>

<style scoped>
.providers-page {
  min-height: calc(100vh - 140px);
}

.providers-index-space {
  padding: 0.65rem;
}
</style>
