<template>
  <div class="requests-page">
    <n-tabs
      v-model:value="activeTab"
      type="segment"
      size="large"
      class="requests-tabs"
      :theme-overrides="tabThemeOverrides"
    >
      <n-tab-pane name="pending" tab="در انتظار">
        <div class="tab-pane-content">
          <n-empty description="محتوای این تب به زودی اضافه می‌شود" class="tab-empty" />
        </div>
      </n-tab-pane>
      <n-tab-pane name="in_progress" tab="درحال انجام">
        <div class="tab-pane-content">
          <n-empty description="محتوای این تب به زودی اضافه می‌شود" class="tab-empty" />
        </div>
      </n-tab-pane>
      <n-tab-pane name="completed" tab="پایان یافته">
        <div class="tab-pane-content">
          <n-empty description="محتوای این تب به زودی اضافه می‌شود" class="tab-empty" />
        </div>
      </n-tab-pane>
      <n-tab-pane name="cancelled" tab="لغو شده">
        <div class="tab-pane-content">
          <n-empty description="محتوای این تب به زودی اضافه می‌شود" class="tab-empty" />
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NTabs, NTabPane, NEmpty } from 'naive-ui'

type TabName = 'pending' | 'in_progress' | 'completed' | 'cancelled'

const activeTab = ref<TabName>('pending')

const tabThemeOverrides = {
  tabColorSegment: 'transparent',
  tabTextColorActiveSegment: '#ffffff',
  tabBorderRadiusSegment: '12px'
}
</script>

<style scoped>
.requests-page {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 140px);
  padding: 0;
}

.requests-tabs {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
}

:deep(.n-tabs-nav) {
  padding: 12px 6px 0;
  margin-bottom: 0;
  flex-shrink: 0;
}

:deep(.n-tabs-tab) {
  font-size: 0.88rem;
}

:deep(.n-tabs-tab__label) {
  font-size: 0.90rem;
}

:deep(.n-tabs-tab-pad) {
  display: none;
}

:deep(.n-tabs-capsule) {
  display: none;
}

:deep(.n-tabs-tab.n-tabs-tab--active) {
  background-color: #1e6b3f;
  color: #ffffff;
}

:deep(.n-tabs-pane-wrapper) {
  flex: 1;
  overflow: auto;
  padding: 16px 8px;
}

.tab-pane-content {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.tab-empty {
  padding: 2rem 0;
}
</style>
