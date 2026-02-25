<template>
  <div class="request-detail-page">
    <!-- محتوا فعلاً خالی -->
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const requestId = route.params.id
</script>

<style scoped>
.request-detail-page {
  min-height: calc(100vh - 140px);
  padding: 1rem;
}
</style>
