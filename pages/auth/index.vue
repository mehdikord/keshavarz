<template>
  <n-config-provider :rtl="true" :theme-overrides="themeOverrides">
    <div class="auth-page">
      <div class="auth-container" :class="{ 'fade-in': mounted }">
        <!-- Top Section: Logo and App Info -->
        <div class="top-section">
          <n-icon :size="120" :color="'#ffffff'">
            <LeafIcon />
          </n-icon>
          <h1 class="app-name">کشاورز</h1>
          <p class="tagline">کشاورز همراه هوشمند شما از کاشت تا برداشت</p>
        </div>

        <!-- Middle Section: Form Card -->
        <n-card class="form-card" :bordered="false">
          <n-space vertical :size="24">
            <!-- Phone Step -->
            <div v-if="step === 'phone'">
              <h2 class="form-title">ورود به کشاورز</h2>
              
              <n-form>
                <n-form-item>
                  <n-input-group>
                    <template #prefix>
                      <span class="phone-prefix">+98</span>
                    </template>
                    <n-input
                      v-model:value="phone"
                      type="tel"
                      placeholder="شماره موبایل خود را وارد کنید"
                      size="large"
                      :clearable="true"
                      :maxlength="11"
                      class="phone-input"
                      :disabled="loading"
                    />
                  </n-input-group>
                </n-form-item>

                <n-form-item>
                  <n-button
                    type="primary"
                    size="large"
                    block
                    :round="true"
                    :loading="loading"
                    :disabled="loading"
                    class="submit-button"
                    @click="handleSendPhone"
                  >
                    ارسال کد تأیید
                  </n-button>
                </n-form-item>
              </n-form>
            </div>

            <!-- Code Step -->
            <div v-else>
              <h2 class="form-title">ارسال کد تأیید</h2>
              <p class="code-description">کد ارسال شده به {{ phone }} را وارد کنید</p>
              
              <n-form>
                <n-form-item>
                  <n-input
                    v-model:value="otpCode"
                    type="text"
                    placeholder="XXXXXX"
                    size="large"
                    :maxlength="6"
                    class="otp-input"
                    :disabled="loading"
                    @input="handleOtpInput"
                  />
                </n-form-item>

                <n-form-item>
                  <n-button
                    type="primary"
                    size="large"
                    block
                    :round="true"
                    :disabled="otpCode.length !== 6 || loading"
                    class="submit-button"
                  >
                    بررسی کد و ورود
                  </n-button>
                </n-form-item>

                <n-form-item>
                  <n-button
                    text
                    type="primary"
                    class="edit-phone-button"
                    @click="editPhone"
                  >
                    ویرایش شماره / ارسال مجدد
                  </n-button>
                </n-form-item>
              </n-form>
            </div>

            <!-- Error Message -->
            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>
          </n-space>
        </n-card>

        <!-- Bottom Section: Terms -->
        <p class="terms-text">با ورود، شرایط و قوانین را می‌پذیرید</p>
      </div>
    </div>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NConfigProvider, NCard, NForm, NFormItem, NInput, NInputGroup, NButton, NIcon, NSpace } from 'naive-ui'
import { Leaf as LeafIcon } from '@vicons/ionicons5'
import api from '../../src/utils/api'

console.log('=== SCRIPT LOADED ===')

// State
const step = ref<'phone' | 'code'>('phone')
const phone = ref('')
const otpCode = ref('')
const loading = ref(false)
const errorMessage = ref('')
const mounted = ref(false)

const themeOverrides = {
  common: {
    primaryColor: '#1e6b3f',
    primaryColorHover: '#15803d',
    primaryColorPressed: '#14532d',
    primaryColorSuppl: '#4ade80'
  }
}

// Functions
const handleSendPhone = () => {
  console.log('=== handleSendPhone CALLED ===')
  console.log('Phone value:', phone.value)
  console.log('Phone length:', phone.value.length)
  
  sendPhone()
}

const sendPhone = async () => {
  console.log('=== sendPhone STARTED ===')
  console.log('Phone:', phone.value)
  console.log('Phone length:', phone.value.length)
  
  // Basic validation - just check if phone is not empty
  if (!phone.value || phone.value.trim() === '') {
    console.log('Phone is empty')
    errorMessage.value = 'لطفا شماره موبایل را وارد کنید'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    console.log('Making API call to /users/auth')
    console.log('Request data:', { phone: phone.value })
    console.log('API instance:', api)
    console.log('API baseURL:', api.defaults.baseURL)
    
    const res = await api.post('/users/auth', { phone: phone.value })
    
    console.log('API Response received:', res)
    console.log('Response data:', res.data)
    
    // Check response structure: { result: { phone: "..." }, message: "..." }
    if (res.data && res.data.message && res.data.message.includes('ارسال شد')) {
      console.log('Success! Message contains "ارسال شد"')
      // Store phone from result or use current phone value
      const phoneToStore = res.data.result?.phone || phone.value
      console.log('Storing phone:', phoneToStore)
      localStorage.setItem('pending_phone', phoneToStore)
      phone.value = phoneToStore
      step.value = 'code'
      errorMessage.value = ''
      console.log('Step changed to code')
    } else {
      console.log('Unexpected response structure')
      errorMessage.value = res.data?.message || 'پاسخ غیرمنتظره از سرور دریافت شد.'
    }
  } catch (err: any) {
    console.error('=== ERROR in sendPhone ===')
    console.error('Error object:', err)
    console.error('Error message:', err.message)
    console.error('Error response:', err.response)
    console.error('Error response data:', err.response?.data)
    errorMessage.value = err.response?.data?.message || err.message || 'خطا در ارسال کد. دوباره امتحان کنید.'
  } finally {
    loading.value = false
    console.log('Loading set to false')
  }
}

const editPhone = () => {
  console.log('=== editPhone CALLED ===')
  localStorage.removeItem('pending_phone')
  step.value = 'phone'
  phone.value = ''
  otpCode.value = ''
  errorMessage.value = ''
}

const handleOtpInput = (value: string) => {
  // Only allow numbers
  otpCode.value = value.replace(/\D/g, '')
}

onMounted(() => {
  console.log('=== Component Mounted ===')
  console.log('Initial step:', step.value)
  console.log('Initial phone:', phone.value)
  
  mounted.value = true
  
  // Check for stored phone on page load/refresh
  const storedPhone = localStorage.getItem('pending_phone')
  console.log('Stored phone from localStorage:', storedPhone)
  if (storedPhone) {
    phone.value = storedPhone
    step.value = 'code'
    console.log('Restored phone and set step to code')
  }
  
  console.log('Final step:', step.value)
  console.log('Final phone:', phone.value)
  console.log('=== Mount Complete ===')
})
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  background: linear-gradient(135deg, #1e6b3f 0%, #4ade80 100%);
  background-attachment: fixed;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Subtle texture overlay */
.auth-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.03) 0%, transparent 50%);
  pointer-events: none;
}

.auth-container {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  position: relative;
  z-index: 1;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.auth-container.fade-in {
  opacity: 1;
  transform: translateY(0);
}

.top-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  width: 100%;
}

.app-name {
  font-size: 3rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  font-family: 'Vazirmatn', sans-serif;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.tagline {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-family: 'Vazirmatn', sans-serif;
  font-weight: 400;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

.form-card {
  width: 100%;
  border-radius: 1rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  background: #ffffff;
  padding: 2rem;
}

.form-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e6b3f;
  margin: 0;
  text-align: center;
  font-family: 'Vazirmatn', sans-serif;
}

.code-description {
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  margin: 0 0 1.5rem 0;
  font-family: 'Vazirmatn', sans-serif;
}

.phone-prefix {
  color: #6b7280;
  font-weight: 500;
  font-family: 'Vazirmatn', sans-serif;
  padding: 0 0.5rem;
}

.phone-input {
  font-family: 'Vazirmatn', sans-serif;
}

.phone-input :deep(.n-input__input-el) {
  font-family: 'Vazirmatn', sans-serif;
}

.otp-input {
  font-family: 'Vazirmatn', sans-serif;
  text-align: center;
  letter-spacing: 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.otp-input :deep(.n-input__input-el) {
  font-family: 'Vazirmatn', sans-serif;
  text-align: center;
  letter-spacing: 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.submit-button {
  font-family: 'Vazirmatn', sans-serif;
  font-weight: 600;
  font-size: 1rem;
  height: 48px;
}

.submit-button :deep(.n-button__content) {
  font-family: 'Vazirmatn', sans-serif;
}

.edit-phone-button {
  font-family: 'Vazirmatn', sans-serif;
  width: 100%;
  text-align: center;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  text-align: center;
  font-family: 'Vazirmatn', sans-serif;
  padding: 0.5rem;
  background: #fef2f2;
  border-radius: 0.5rem;
  border: 1px solid #fecaca;
}

.terms-text {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  margin: 0;
  font-family: 'Vazirmatn', sans-serif;
}

/* Mobile optimizations */
@media (max-width: 480px) {
  .auth-page {
    padding: 1rem 0.75rem;
  }

  .app-name {
    font-size: 2.5rem;
  }

  .tagline {
    font-size: 1rem;
  }

  .form-card {
    padding: 1.5rem;
  }

  .form-title {
    font-size: 1.25rem;
  }

  .otp-input {
    font-size: 1.25rem;
  }

  .otp-input :deep(.n-input__input-el) {
    font-size: 1.25rem;
  }
}

/* Safe area support */
@supports (padding: max(0px)) {
  .auth-page {
    padding-left: max(1rem, env(safe-area-inset-left));
    padding-right: max(1rem, env(safe-area-inset-right));
    padding-top: max(1rem, env(safe-area-inset-top));
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }
}
</style>
