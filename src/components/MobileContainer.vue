<template>
  <div class="mobile-app-wrapper">
    <div class="mobile-container">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
// Mobile container component
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

































