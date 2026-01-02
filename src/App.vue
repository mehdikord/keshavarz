<template>
  <n-config-provider rtl :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <AppLayout v-if="!isAuthRoute">
          <router-view />
        </AppLayout>
        <div v-else class="auth-wrapper">
          <router-view />
        </div>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { NConfigProvider, NMessageProvider, NDialogProvider } from 'naive-ui'
import AppLayout from './components/AppLayout.vue'

const route = useRoute()

const isAuthRoute = computed(() => {
  return route.path === '/auth'
})

const themeOverrides = {
  common: {
    primaryColor: '#1e6b3f',
    primaryColorHover: '#15803d',
    primaryColorPressed: '#14532d',
    primaryColorSuppl: '#4ade80'
  }
}
</script>

<style>
.auth-wrapper {
  width: 100%;
  min-height: 100vh;
  position: relative;
}
</style>






