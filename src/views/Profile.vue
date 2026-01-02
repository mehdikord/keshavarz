<template>
  <div class="profile-page">
    <Loading v-if="loading" :fullscreen="true" text="در حال دریافت اطلاعات..." />
    
    <div v-else-if="error" class="error-container">
      <n-card>
        <n-space vertical :size="16">
          <n-text type="error" style="font-size: 1rem;">خطا در دریافت اطلاعات</n-text>
          <n-text depth="3">{{ error }}</n-text>
        </n-space>
      </n-card>
    </div>

    <div v-else-if="userData" class="profile-container">
      <n-space vertical :size="24">
        <!-- Profile Header Card -->
        <n-card>
          <n-space vertical :size="20" align="center">
            <div v-if="userData.profile" class="avatar-wrapper" @click="showEditModal = true" style="cursor: pointer;">
              <n-avatar
                :src="userData.profile"
                round
                :size="120"
              />
            </div>
            <div v-else class="avatar-placeholder" @click="showEditModal = true" style="cursor: pointer;">
              <i class="fa-solid fa-user-circle"></i>
            </div>
            
            <n-space vertical :size="8" align="center">
              <n-text strong style="font-size: 1.5rem; color: #1e6b3f;">
                {{ userData.name }}
              </n-text>
              <n-text depth="3" style="font-size: 1rem;">
                {{ userData.phone }}
              </n-text>
            </n-space>
          </n-space>
        </n-card>

        <!-- Activity Status Card -->
        <n-card title="وضعیت فعالیت">
          <n-space vertical :size="16">
            <n-space justify="space-between" align="center">
              <n-text>خدمات دهنده</n-text>
              <n-tag :type="userData.is_provider ? 'success' : 'default'" :bordered="false">
                {{ userData.is_provider ? 'فعال' : 'غیرفعال' }}
              </n-tag>
            </n-space>
            
            <n-space justify="space-between" align="center">
              <n-text>خدمات گیرنده</n-text>
              <n-tag :type="userData.is_customer ? 'success' : 'default'" :bordered="false">
                {{ userData.is_customer ? 'فعال' : 'غیرفعال' }}
              </n-tag>
            </n-space>
          </n-space>
        </n-card>

        <!-- Location Card -->
        <n-card title="موقعیت جغرافیایی">
          <n-space vertical :size="16">
            <n-space justify="space-between" align="center">
              <n-text>استان</n-text>
              <n-text :depth="userData.province?.name ? 1 : 3">
                {{ userData.province?.name || 'ثبت نشده' }}
              </n-text>
            </n-space>
            
            <n-space justify="space-between" align="center">
              <n-text>شهر</n-text>
              <n-text :depth="userData.city?.name ? 1 : 3">
                {{ userData.city?.name || 'ثبت نشده' }}
              </n-text>
            </n-space>
          </n-space>
        </n-card>

        <!-- Action Buttons Card -->
        <n-card>
          <n-space vertical :size="12">
            <n-button
              strong
              secondary
              round
              type="success"
              block
              size="large"
              @click="handleEditProfile"
            >
              ویرایش اطلاعات کاربری
            </n-button>
            
            <n-button
              strong
              secondary
              round
              type="error"
              block
              size="large"
              @click="handleLogout"
            >
              خروج از حساب
            </n-button>
          </n-space>
        </n-card>
      </n-space>
    </div>

    <!-- Edit Profile Info Modal -->
    <n-modal
      v-model:show="showEditInfoModal"
      preset="card"
      title="ویرایش اطلاعات کاربری"
      :bordered="false"
      size="medium"
      :mask-closable="false"
    >
      <template #header>
        <n-text strong style="font-size: 1.125rem;">ویرایش اطلاعات کاربری</n-text>
      </template>

      <n-form ref="editFormRef" :model="editFormData" :rules="editFormRules" :show-label="true" :show-feedback="true">
        <n-space vertical :size="20">
          <n-form-item 
            path="name" 
            label="نام"
            :validation-status="serverErrors.name ? 'error' : undefined"
            :feedback="serverErrors.name"
          >
            <n-input
              v-model:value="editFormData.name"
              placeholder="نام خود را وارد کنید"
              :maxlength="255"
              :status="serverErrors.name ? 'error' : undefined"
              @input="() => clearFieldError('name')"
            />
          </n-form-item>

          <n-form-item 
            path="national_code" 
            label="کد ملی"
            :validation-status="serverErrors.national_code ? 'error' : undefined"
            :feedback="serverErrors.national_code"
          >
            <n-input
              v-model:value="editFormData.national_code"
              placeholder="کد ملی خود را وارد کنید"
              :maxlength="10"
              :status="serverErrors.national_code ? 'error' : undefined"
              @input="() => clearFieldError('national_code')"
            />
          </n-form-item>

          <n-form-item 
            path="province_id" 
            label="استان"
            :validation-status="serverErrors.province_id ? 'error' : undefined"
            :feedback="serverErrors.province_id"
          >
            <n-select
              v-model:value="editFormData.province_id"
              :options="provinceOptions"
              placeholder="استان را انتخاب کنید"
              filterable
              :status="serverErrors.province_id ? 'error' : undefined"
              @update:value="() => { handleProvinceChange(); clearFieldError('province_id') }"
            />
          </n-form-item>

          <n-form-item 
            path="city_id" 
            label="شهر"
            :validation-status="serverErrors.city_id ? 'error' : undefined"
            :feedback="serverErrors.city_id"
          >
            <n-select
              v-model:value="editFormData.city_id"
              :options="cityOptions"
              placeholder="شهر را انتخاب کنید"
              :disabled="!editFormData.province_id"
              filterable
              :status="serverErrors.city_id ? 'error' : undefined"
              @update:value="() => clearFieldError('city_id')"
            />
          </n-form-item>
        </n-space>
      </n-form>

      <template #footer>
        <n-space justify="end" :size="12">
          <n-button strong secondary round @click="showEditInfoModal = false">انصراف</n-button>
          <n-button
            strong
            secondary
            round
            type="success"
            :loading="updateLoading"
            @click="handleUpdateProfile"
          >
            ذخیره تغییرات
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- Edit Profile Image Modal -->
    <n-modal
      v-model:show="showEditModal"
      preset="card"
      title="ویرایش تصویر پروفایل"
      :bordered="false"
      size="medium"
      :mask-closable="false"
    >
      <template #header>
        <n-text strong style="font-size: 1.125rem;">ویرایش تصویر پروفایل</n-text>
      </template>

      <n-space vertical :size="20">
        <n-upload
          :file-list="fileList"
          :max="1"
          accept="image/*"
          @change="handleFileChange"
          @remove="handleFileRemove"
        >
          <n-upload-dragger>
            <div style="margin-bottom: 12px">
              <n-icon size="48" :depth="3">
                <i class="fa-solid fa-cloud-arrow-up" style="font-size: 3rem; color: #1e6b3f;"></i>
              </n-icon>
            </div>
            <n-text style="font-size: 16px">
              کلیک کنید یا فایل را اینجا بکشید
            </n-text>
            <n-p depth="3" style="margin: 8px 0 0 0">
              فقط فایل‌های تصویری مجاز است
            </n-p>
          </n-upload-dragger>
        </n-upload>

        <div v-if="selectedFile && previewUrl" class="preview-container">
          <n-text depth="3">پیش‌نمایش:</n-text>
          <img :src="previewUrl" alt="Preview" class="preview-image" />
        </div>
      </n-space>

      <template #footer>
        <n-space justify="end" :size="12">
          <n-button strong secondary round @click="showEditModal = false">انصراف</n-button>
          <n-button
            strong
            secondary
            round
            type="error"
            :loading="deleteLoading"
            @click="handleDeleteImage"
          >
            حذف تصویر
          </n-button>
          <n-button
            strong
            secondary
            round
            type="success"
            :loading="uploadLoading"
            :disabled="!selectedFile"
            @click="handleUploadImage"
          >
            ویرایش تصویر
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NSpace, NAvatar, NText, NTag, NButton, NModal, NUpload, NIcon, NP, useMessage, NForm, NFormItem, NInput, NSelect } from 'naive-ui'
import type { UploadFileInfo, FormInst } from 'naive-ui'
import Loading from '../components/Loading.vue'
import api from '../utils/api'
import { useFormValidation } from '../composables/useFormValidation'

const router = useRouter()
const message = useMessage()
const editFormRef = ref<FormInst | null>(null)
const { serverErrors, handleValidationError, clearValidationErrors } = useFormValidation()

interface UserData {
  id: number
  name: string
  phone: string
  profile: string | null
  national_code: string | null
  province_id: number | null
  city_id: number | null
  is_provider: number
  is_customer: number
  province: {
    name: string
  } | null
  city: {
    name: string
  } | null
}

interface Province {
  id: number
  name: string
  cities: City[]
}

interface City {
  id: number
  province_id: number
  name: string
}

const loading = ref(true)
const userData = ref<UserData | null>(null)
const error = ref<string | null>(null)
const showEditModal = ref(false)
const showEditInfoModal = ref(false)
const fileList = ref<UploadFileInfo[]>([])
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const uploadLoading = ref(false)
const deleteLoading = ref(false)
const updateLoading = ref(false)
const provinces = ref<Province[]>([])
const loadingProvinces = ref(false)

const editFormData = ref({
  name: '',
  national_code: '',
  province_id: null as number | null,
  city_id: null as number | null
})

const editFormRules = computed(() => {
  const rules: any = {
    name: {
      required: true,
      message: 'لطفا نام خود را وارد کنید',
      trigger: ['input', 'blur'],
      validator: (_rule: any, value: any) => {
        if (serverErrors.value.name) {
          return new Error(serverErrors.value.name)
        }
        if (!value || value.trim() === '') {
          return new Error('لطفا نام خود را وارد کنید')
        }
        return true
      }
    },
    national_code: {
      required: false,
      trigger: ['input', 'blur'],
      validator: () => {
        if (serverErrors.value.national_code) {
          return new Error(serverErrors.value.national_code)
        }
        return true
      }
    },
    province_id: {
      required: false,
      trigger: ['change'],
      validator: () => {
        if (serverErrors.value.province_id) {
          return new Error(serverErrors.value.province_id)
        }
        return true
      }
    },
    city_id: {
      required: false,
      trigger: ['change'],
      validator: () => {
        if (serverErrors.value.city_id) {
          return new Error(serverErrors.value.city_id)
        }
        return true
      }
    }
  }

  return rules
})

const provinceOptions = computed(() => {
  return provinces.value.map(province => ({
    label: province.name.trim(),
    value: province.id
  }))
})

const cityOptions = computed(() => {
  if (!editFormData.value.province_id) {
    return []
  }
  const selectedProvince = provinces.value.find(p => p.id === editFormData.value.province_id)
  if (!selectedProvince) {
    return []
  }
  return selectedProvince.cities.map(city => ({
    label: city.name.trim(),
    value: city.id
  }))
})

const fetchProfile = async (showLoading = true) => {
  if (showLoading) {
    loading.value = true
  }
  error.value = null

  try {
    const response = await api.get('/users/profile')
    
    if (response.data && response.data.result) {
      userData.value = response.data.result
    } else {
      error.value = 'اطلاعات کاربری یافت نشد'
    }
  } catch (err: any) {
    console.error('Error fetching profile:', err)
    error.value = err.response?.data?.message || err.message || 'خطا در دریافت اطلاعات کاربری'
  } finally {
    if (showLoading) {
      loading.value = false
    }
  }
}

const fetchProvinces = async () => {
  loadingProvinces.value = true
  try {
    const response = await api.get('/public/provinces')
    if (response.data && response.data.result) {
      provinces.value = response.data.result
    }
  } catch (err: any) {
    console.error('Error fetching provinces:', err)
    message.error('خطا در دریافت لیست استان‌ها')
  } finally {
    loadingProvinces.value = false
  }
}

const handleEditProfile = async () => {
  if (provinces.value.length === 0) {
    await fetchProvinces()
  }
  
  // پر کردن فرم با اطلاعات فعلی
  if (userData.value) {
    editFormData.value = {
      name: userData.value.name || '',
      national_code: userData.value.national_code || '',
      province_id: userData.value.province_id,
      city_id: userData.value.city_id
    }
  }
  
  showEditInfoModal.value = true
}

const handleProvinceChange = () => {
  // وقتی استان تغییر می‌کند، شهر را ریست کن
  editFormData.value.city_id = null
}

const clearFieldError = (field: string) => {
  if (serverErrors.value[field]) {
    const newErrors = { ...serverErrors.value }
    delete newErrors[field]
    serverErrors.value = newErrors
  }
}

const handleUpdateProfile = async () => {
  if (!editFormRef.value) return
  
  // پاک کردن خطاهای قبلی
  clearValidationErrors()
  
  try {
    await editFormRef.value.validate()
  } catch (err) {
    return
  }

  updateLoading.value = true

  try {
    const response = await api.post('/users/profile', {
      name: editFormData.value.name,
      national_code: editFormData.value.national_code || null,
      province_id: editFormData.value.province_id,
      city_id: editFormData.value.city_id
    })

    if (response.data) {
      await fetchProfile(false)
      message.success('اطلاعات کاربری با موفقیت به‌روزرسانی شد')
      showEditInfoModal.value = false
      clearValidationErrors()
    }
  } catch (err: any) {
    console.error('Error updating profile:', err)
    
    // هندل کردن خطای validation
    if (err.response?.status === 422) {
      handleValidationError(err)
      // اعمال مجدد validation برای نمایش خطاها
      await nextTick()
      if (editFormRef.value) {
        // ابتدا validation را restore می‌کنیم
        editFormRef.value.restoreValidation()
        // سپس validate می‌کنیم تا خطاها نمایش داده شوند
        editFormRef.value.validate(
          (errors) => {
            // errors شامل خطاهای validation است
            console.log('Validation errors:', errors)
          },
          () => true // همه rules را اعمال می‌کنیم
        )
      }
    } else {
      message.error(err.response?.data?.message || 'خطا در به‌روزرسانی اطلاعات')
    }
  } finally {
    updateLoading.value = false
  }
}

const handleLogout = () => {
  // پاک کردن اطلاعات احراز هویت از localStorage
  localStorage.removeItem('keshavarz_auth_token')
  localStorage.removeItem('keshavarz_user')
  
  // Redirect به صفحه ورود
  router.push('/auth')
}

const handleFileChange = (options: { fileList: UploadFileInfo[] }) => {
  fileList.value = options.fileList
  if (options.fileList.length > 0) {
    const file = options.fileList[0].file
    if (file) {
      selectedFile.value = file as File
      // ایجاد preview URL
      previewUrl.value = URL.createObjectURL(file as File)
    }
  } else {
    selectedFile.value = null
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = null
    }
  }
}

const handleFileRemove = () => {
  selectedFile.value = null
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

const handleUploadImage = async () => {
  if (!selectedFile.value) return

  uploadLoading.value = true

  try {
    const formData = new FormData()
    formData.append('image', selectedFile.value)

    const response = await api.post('/users/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.data) {
      if (response.data.result) {
        // تصویر با موفقیت ویرایش شده - به‌روزرسانی اطلاعات
        await fetchProfile(false)
        message.success('تصویر پروفایل با موفقیت ویرایش شد')
        showEditModal.value = false
        // پاک کردن فایل انتخاب شده
        fileList.value = []
        if (previewUrl.value) {
          URL.revokeObjectURL(previewUrl.value)
          previewUrl.value = null
        }
        selectedFile.value = null
      } else {
        message.error('خطا در ویرایش تصویر')
      }
    }
  } catch (err: any) {
    console.error('Error uploading image:', err)
    message.error(err.response?.data?.message || 'خطا در ویرایش تصویر')
  } finally {
    uploadLoading.value = false
  }
}

const handleDeleteImage = async () => {
  deleteLoading.value = true

  try {
    const response = await api.post('/users/profile/image', null, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.data) {
      if (!response.data.result) {
        // تصویر حذف شده - به‌روزرسانی اطلاعات
        await fetchProfile(false)
        message.success('تصویر پروفایل با موفقیت حذف شد')
        showEditModal.value = false
      } else {
        message.error('خطا در حذف تصویر')
      }
    }
  } catch (err: any) {
    console.error('Error deleting image:', err)
    message.error(err.response?.data?.message || 'خطا در حذف تصویر')
  } finally {
    deleteLoading.value = false
  }
}

onMounted(() => {
  fetchProfile()
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  padding: 1.5rem;
  background-color: #f5f5f5;
}

.profile-container {
  max-width: 600px;
  margin: 0 auto;
}

.error-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 0 1.5rem;
}

:deep(.n-card) {
  border-radius: 12px;
}

:deep(.n-card-header) {
  font-family: 'Vazirmatn', sans-serif;
  font-weight: 600;
  font-size: 1.125rem;
  color: #1e6b3f;
}

:deep(.n-text) {
  font-family: 'Vazirmatn', sans-serif;
}

:deep(.n-tag) {
  font-family: 'Vazirmatn', sans-serif;
}

.avatar-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e6b3f 0%, #4ade80 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(30, 107, 63, 0.2);
}

.avatar-placeholder i {
  font-size: 4rem;
  color: #ffffff;
}

.preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #f9fafb;
}

.preview-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  object-fit: contain;
}

@media (max-width: 640px) {
  .profile-page {
    padding: 1rem;
  }
  
  .profile-container {
    max-width: 100%;
  }
}
</style>
