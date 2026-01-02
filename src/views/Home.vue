<template>
  <div class="home-page">
    <div class="home-container">
      <div class="welcome-section">
        <h1 class="welcome-title">خوش آمدید به کشاورز</h1>
        <p class="welcome-subtitle">لطفا بخش مورد نظر خود را انتخاب کنید</p>
      </div>

      <div class="buttons-container">
        <router-link to="/users" class="section-button users-button">
          <div class="button-icon">
            <i class="fa-solid fa-users"></i>
          </div>
          <div class="button-content">
            <h2 class="button-title">بخش خدمات گیرندگان</h2>
            <p class="button-description">جستجو ادوات و درخواست خدمات </p>
          </div>
          <div class="button-arrow">
            <i class="fa-solid fa-arrow-left"></i>
          </div>
        </router-link>

        <router-link to="/providers" class="section-button providers-button">
          <div class="button-icon">
            <i class="fa-solid fa-building"></i>
          </div>
          <div class="button-content">
            <h2 class="button-title">بخش خدمات دهندگان</h2>
            <p class="button-description">ارائه خدمات کشاورزی و کسب درآمد</p>
          </div>
          <div class="button-arrow">
            <i class="fa-solid fa-arrow-left"></i>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// صفحه اصلی - انتخاب بخش
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e6b3f 0%, #4ade80 100%);
  background-attachment: fixed;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 3rem 2rem 2rem 2rem;
  position: relative;
  overflow: hidden;
}

/* Subtle texture overlay */
.home-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
  pointer-events: none;
}

.home-container {
  width: 100%;
  max-width: 800px;
  position: relative;
  z-index: 1;
}

.welcome-section {
  text-align: center;
  margin-bottom: 3rem;
}

.welcome-title {
  font-size: 3rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 1rem 0;
  font-family: 'Vazirmatn', sans-serif;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.welcome-subtitle {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-family: 'Vazirmatn', sans-serif;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-button {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  background: #ffffff;
  border-radius: 1rem;
  text-decoration: none;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
}

.section-button:hover {
  transform: translateY(-4px);
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
}

.users-button:hover {
  border-color: #1e6b3f;
}

.providers-button:hover {
  border-color: #f59e0b;
}

.button-icon {
  font-size: 3rem;
  line-height: 1;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1e6b3f;
}

.providers-button .button-icon {
  color: #f59e0b;
}

.button-content {
  flex: 1;
  text-align: right;
}

.button-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  font-family: 'Vazirmatn', sans-serif;
}

.providers-button .button-title {
  color: #92400e;
}

.button-description {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
  font-family: 'Vazirmatn', sans-serif;
}

.button-arrow {
  font-size: 1.5rem;
  color: #9ca3af;
  transition: all 0.3s ease;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-button:hover .button-arrow {
  color: #1e6b3f;
  transform: translateX(-4px);
}

.providers-button:hover .button-arrow {
  color: #f59e0b;
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .home-page {
    padding: 1rem;
  }

  .welcome-title {
    font-size: 2rem;
  }

  .welcome-subtitle {
    font-size: 1rem;
  }

  .section-button {
    padding: 1.5rem;
    gap: 1rem;
  }

  .button-icon {
    font-size: 2.5rem;
  }

  .button-title {
    font-size: 1rem;
  }

  .button-description {
    font-size: 0.875rem;
  }
}
</style>
