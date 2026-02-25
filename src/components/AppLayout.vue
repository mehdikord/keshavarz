<template>
  <div class="mobile-app-wrapper">
    <Navbar />
    <div class="mobile-container" :class="{ 'with-dock': showDockMenu }">
      <slot />
    </div>
    <DockMenu v-if="showDockMenu" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from './Navbar.vue'
import DockMenu from './DockMenu.vue'

const route = useRoute()

const showDockMenu = computed(() => {
  // نمایش منو در صفحات users و providers
  return route.path.startsWith('/users') || route.path.startsWith('/providers')
})
</script>

<style scoped>
.mobile-app-wrapper {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 0;
  width: 100%;
  margin: 0;
}

.mobile-container {
  width: 100%;
  max-width: 428px;
  min-height: 100vh;
  background-color: #ffffff;
  margin: 0 auto;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  position: relative;
  padding-top: 60px; /* Space for fixed navbar */
}

.mobile-container.with-dock {
  padding-bottom: 80px; /* Space for fixed dock menu */
}

@media (max-width: 428px) {
  .mobile-app-wrapper {
    padding: 0;
    background-color: #ffffff;
  }
  
  .mobile-container {
    box-shadow: none;
    max-width: 100%;
  }
}
</style>
