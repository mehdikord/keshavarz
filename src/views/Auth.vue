<template>
  <div class="auth-page">
    <div class="auth-container" :class="{ 'fade-in': mounted }">
      <!-- Top Section: Logo and App Info -->
      <div class="top-section">
        <div class="icon-placeholder">
          <i class="fa-solid fa-seedling"></i>
        </div>
        <h1 class="app-name">کشاورز</h1>
        <p class="tagline">کشاورز همراه هوشمند شما از کاشت تا برداشت</p>
      </div>

      <!-- Middle Section: Form Card -->
      <div class="form-card">
        <div class="form-content">
          <h2 class="form-title">{{ step === 'phone' ? 'ورود به کشاورز' : 'بررسی کد تایید ارسال شده' }}</h2>
          
          <!-- Phone Step -->
          <div v-if="step === 'phone'">
          <div class="form-group">
            <input
              v-model="phoneNumber"
              type="tel"
              placeholder="09XX XXX XX"
              class="phone-input"
              maxlength="11"
                :disabled="loading"
            />
          </div>

          <button
              class="submit-button"
              :class="{ 'disabled': loading || !isPhoneValid }"
              :disabled="loading || !isPhoneValid"
              @click="handleSubmit"
            >
              <span v-if="loading">در حال ارسال...</span>
              <span v-else>ارسال کد تأیید</span>
            </button>

            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>
          </div>

          <!-- Code Step -->
          <div v-else>
            <div class="form-group">
              <input
                v-model="otpCode"
                type="text"
                placeholder="XXXXXX"
                class="otp-input"
                maxlength="6"
                :disabled="loading"
                @input="handleOtpInput"
              />
            </div>

            <button
            class="submit-button"
              :class="{ 'disabled': loading || !isOtpValid }"
              :disabled="loading || !isOtpValid"
              @click="handleVerifyCode"
          >
              <span v-if="loading">در حال بررسی...</span>
              <span v-else>بررسی کد و ورود</span>
          </button>

            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>

            <!-- لینک ویرایش شماره موبایل -->
            <div class="edit-phone-link" @click="handleEditPhone">
              <i class="fa-solid fa-pen-to-square"></i>
              <span>ویرایش شماره موبایل</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast Message -->
      <transition name="toast">
        <div v-if="showToast" class="toast-message" :class="{ 'toast-error': isToastError }">
          {{ toastMessage }}
        </div>
      </transition>

      <!-- Bottom Section: Terms -->
      <p class="terms-text">با ورود، شرایط و قوانین را می‌پذیرید</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../utils/api'

const router = useRouter()

const phoneNumber = ref('')
const otpCode = ref('')
const mounted = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const step = ref<'phone' | 'code'>('phone')
const showToast = ref(false)
const toastMessage = ref('')
const isToastError = ref(false)

const isPhoneValid = computed(() => {
  return phoneNumber.value.length === 11
})

const isOtpValid = computed(() => {
  return otpCode.value.length === 6
})

const showToastMessage = (message: string, isError: boolean = false) => {
  toastMessage.value = message
  isToastError.value = isError
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

const handleSubmit = async () => {
  console.log('دکمه ارسال کد تایید کلیک شد!')
  console.log('شماره تلفن وارد شده:', phoneNumber.value)
  
  if (!phoneNumber.value || phoneNumber.value.trim() === '') {
    console.log('شماره تلفن خالی است')
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    console.log('ارسال درخواست به /users/auth')
    const response = await api.post('/users/auth', { 
      phone: phoneNumber.value 
    })
    
    console.log('پاسخ سرور:', response.data)
    console.log('Status Code:', response.status)
    
    // بررسی status code - فقط 200 را قبول می‌کنیم
    if (response.status === 200) {
      // بررسی ساختار پاسخ
      if (response.data && response.data.result && response.data.message) {
        // ذخیره شماره موبایل در localStorage
        const phoneToStore = response.data.result.phone || phoneNumber.value
        localStorage.setItem('keshvarz_auth_phone', phoneToStore)
        console.log('شماره موبایل در localStorage ذخیره شد:', phoneToStore)
        
        // نمایش toast message موفقیت
        showToastMessage('کد احراز هویت با موفقیت ارسال شد')
        
        // تغییر به صفحه کد تایید
        step.value = 'code'
        phoneNumber.value = phoneToStore
        errorMessage.value = ''
      } else {
        errorMessage.value = 'خطا در انجام عملیات لطفا دوباره تلاش کنید'
      }
    } else {
      errorMessage.value = 'خطا در انجام عملیات لطفا دوباره تلاش کنید'
    }
  } catch (error: any) {
    console.error('خطا در ارسال درخواست:', error)
    console.error('پیام خطا:', error.response?.data || error.message)
    console.error('Status Code:', error.response?.status)
    
    // اگر status code غیر از 200 بود، پیام خطا نشون بده
    if (error.response && error.response.status !== 200) {
      errorMessage.value = 'خطا در انجام عملیات لطفا دوباره تلاش کنید'
    } else if (!error.response) {
      // اگر response وجود نداشت (مثلاً network error)
      errorMessage.value = 'خطا در انجام عملیات لطفا دوباره تلاش کنید'
    }
  } finally {
    loading.value = false
  }
}

const handleOtpInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  // فقط اعداد را قبول کن
  otpCode.value = target.value.replace(/\D/g, '')
}

// فانکشن برگشت به مرحله وارد کردن شماره موبایل
const handleEditPhone = () => {
  // پاک کردن شماره موبایل از localStorage
  localStorage.removeItem('keshvarz_auth_phone')
  
  // ریست کردن فرم
  phoneNumber.value = ''
  otpCode.value = ''
  errorMessage.value = ''
  
  // برگشت به مرحله اول
  step.value = 'phone'
}

const handleVerifyCode = async () => {
  console.log('بررسی کد تایید:', otpCode.value)
  
  if (!otpCode.value || otpCode.value.length !== 6) {
    console.log('کد تایید معتبر نیست')
    return
  }

  // دریافت شماره موبایل از localStorage
  const storedPhone = localStorage.getItem('keshvarz_auth_phone')
  if (!storedPhone) {
    errorMessage.value = 'شماره موبایل یافت نشد. لطفا دوباره تلاش کنید.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    console.log('ارسال درخواست به /users/auth/check')
    const response = await api.post('/users/auth/check', {
      phone: storedPhone,
      code: otpCode.value
    })
    
    console.log('پاسخ سرور:', response.data)
    console.log('Status Code:', response.status)
    
    // بررسی status code - فقط 200 را قبول می‌کنیم
    if (response.status === 200) {
      // بررسی ساختار پاسخ
      if (response.data && response.data.result) {
        const { user, token } = response.data.result
        
        // ذخیره token در localStorage
        if (token) {
          localStorage.setItem('keshavarz_auth_token', token)
          console.log('Token در localStorage ذخیره شد')
        }
        
        // ذخیره اطلاعات کاربر در localStorage
        if (user) {
          localStorage.setItem('keshavarz_user', JSON.stringify(user))
          console.log('اطلاعات کاربر در localStorage ذخیره شد:', user)
        }
        
        // حذف شماره موبایل موقت از localStorage
        localStorage.removeItem('keshvarz_auth_phone')
        
        // نمایش toast message موفقیت
        showToastMessage('ورود با موفقیت انجام شد')
        
        // redirect به صفحه اصلی
        setTimeout(() => {
          router.push('/')
        }, 1000)
      } else {
        errorMessage.value = 'خطا در انجام عملیات لطفا دوباره تلاش کنید'
      }
    } else {
      errorMessage.value = 'خطا در انجام عملیات لطفا دوباره تلاش کنید'
    }
  } catch (error: any) {
    console.error('خطا در بررسی کد تایید:', error)
    console.error('پیام خطا:', error.response?.data || error.message)
    console.error('Status Code:', error.response?.status)
    
    // بررسی status code 409
    if (error.response?.status === 409) {
      // نمایش پیام خطا به صورت toast message
      const errorMsg = error.response?.data?.error || 'خطا در انجام عملیات لطفا دوباره تلاش کنید'
      showToastMessage(errorMsg, true)
      // همچنین در error message هم نشون بده
      errorMessage.value = errorMsg
    } else if (error.response) {
      // برای خطاهای دیگر، پیام خطای سرور رو نشون بده
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'خطا در انجام عملیات لطفا دوباره تلاش کنید'
      errorMessage.value = errorMsg
    } else {
      // اگر response وجود نداشت (مثلاً network error)
      errorMessage.value = 'خطا در انجام عملیات لطفا دوباره تلاش کنید'
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  mounted.value = true
  
  // چک کردن اینکه آیا کاربر قبلاً احراز هویت شده است
  const authToken = localStorage.getItem('keshavarz_auth_token')
  if (authToken) {
    console.log('کاربر قبلاً احراز هویت شده است، redirect به صفحه اصلی')
    router.replace('/')
    return
  }
  
  // چک کردن localStorage برای شماره موبایل ذخیره شده
  const storedPhone = localStorage.getItem('keshvarz_auth_phone')
  if (storedPhone) {
    console.log('شماره موبایل از localStorage پیدا شد:', storedPhone)
    phoneNumber.value = storedPhone
    step.value = 'code'
  }
})
</script>

<style scoped>
.auth-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  background: linear-gradient(135deg, #1e6b3f 0%, #4ade80 100%);
  background-attachment: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 1;
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

.icon-placeholder {
  font-size: 120px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.icon-placeholder i {
  font-size: inherit;
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

.form-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e6b3f;
  margin: 0;
  text-align: center;
  font-family: 'Vazirmatn', sans-serif;
}

.form-group {
  width: 100%;
}

.phone-input,
.otp-input {
  width: 100%;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  outline: none;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-family: 'Vazirmatn', sans-serif;
  direction: ltr;
  text-align: left;
  background: #ffffff;
  transition: border-color 0.2s;
}

.otp-input {
  text-align: center;
  letter-spacing: 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.phone-input:focus,
.otp-input:focus {
  border-color: #1e6b3f;
}

.phone-input::placeholder,
.otp-input::placeholder {
  color: #9ca3af;
}

.phone-input:disabled,
.otp-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.submit-button {
  width: 100%;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Vazirmatn', sans-serif;
  color: #ffffff;
  background: #1e6b3f;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  height: 48px;
  margin-top: 1.5rem;
}

.submit-button:hover:not(.disabled) {
  background: #15803d;
}

.submit-button:active:not(.disabled) {
  transform: scale(0.98);
}

.submit-button.disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  text-align: center;
  font-family: 'Vazirmatn', sans-serif;
  padding: 0.75rem;
  background: #fef2f2;
  border-radius: 0.5rem;
  border: 1px solid #fecaca;
  margin-top: 0.5rem;
}

.edit-phone-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  color: #1e6b3f;
  font-size: 0.875rem;
  font-family: 'Vazirmatn', sans-serif;
  cursor: pointer;
  transition: color 0.2s, opacity 0.2s;
}

.edit-phone-link:hover {
  color: #15803d;
  opacity: 0.8;
}

.edit-phone-link i {
  font-size: 0.875rem;
}

.toast-message {
  position: fixed;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: #10b981;
  color: #ffffff;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  font-family: 'Vazirmatn', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  max-width: 90%;
  text-align: center;
}

.toast-message.toast-error {
  background: #ef4444;
}

.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
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

  .icon-placeholder {
    font-size: 80px;
  }

  .otp-input {
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
