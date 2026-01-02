<template>
  <nav class="navbar">
    <div class="navbar-content">
      <button class="menu-button" @click="toggleMenu" aria-label="منو">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      
      <h1 class="navbar-title">{{ pageTitle }}</h1>
      
      <div class="navbar-spacer"></div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const { pageTitle } = usePageTitle()

const toggleMenu = () => {
  // TODO: Implement menu toggle functionality
  console.log('Menu clicked')
}
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.navbar-content {
  max-width: 428px;
  margin: 0 auto;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  direction: rtl;
}

.menu-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1e6b3f;
  transition: opacity 0.2s;
  border-radius: 8px;
}

.menu-button:hover {
  opacity: 0.7;
  background-color: #f0fdf4;
}

.menu-button:active {
  opacity: 0.5;
}

.navbar-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e6b3f;
  margin: 0;
  text-align: center;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.navbar-spacer {
  width: 40px; /* Same width as menu button to center the title */
}

@media (max-width: 428px) {
  .navbar-content {
    max-width: 100%;
  }
}
</style>





