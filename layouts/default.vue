<template>
  <div class="mobile-app-wrapper">
    <Navbar />
    <div class="mobile-container">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  meta: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
    }
  ]
})
</script>





