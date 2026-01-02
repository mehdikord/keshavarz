import { ref, Ref } from 'vue'
import { useMessage } from 'naive-ui'
import type { FormInst } from 'naive-ui'

/**
 * Composable for handling form validation errors from Laravel API
 * 
 * @example
 * const { serverErrors, handleValidationError, clearValidationErrors } = useFormValidation()
 * 
 * // در template، از serverErrors در rules استفاده کنید:
 * const rules = computed(() => ({
 *   field: {
 *     validator: () => !serverErrors.value.field,
 *     message: serverErrors.value.field || 'خطا',
 *     trigger: ['input', 'blur']
 *   }
 * }))
 * 
 * try {
 *   await api.post('/endpoint', data)
 * } catch (err: any) {
 *   if (err.response?.status === 422) {
 *     handleValidationError(err)
 *   }
 * }
 */
export const useFormValidation = () => {
  const message = useMessage()
  const serverErrors: Ref<Record<string, string>> = ref({})

  /**
   * Handle validation errors from API response
   * @param error - The error object from axios
   */
  const handleValidationError = (error: any) => {
    if (error.response?.status === 422) {
      // نمایش پیام toast
      message.error('اطلاعات ارسالی دارای نقص است !')

      // دریافت خطاهای validation از سرور
      const validationErrors = error.response?.data || {}

      // تبدیل خطاهای Laravel به فرمت ساده: { field: 'error message' }
      const errors: Record<string, string> = {}

      Object.keys(validationErrors).forEach((field) => {
        // Laravel validation errors معمولاً به صورت array هستند
        if (Array.isArray(validationErrors[field]) && validationErrors[field].length > 0) {
          errors[field] = validationErrors[field][0] // اولین خطا را می‌گیریم
        } else if (typeof validationErrors[field] === 'string') {
          errors[field] = validationErrors[field]
        }
      })

      serverErrors.value = errors
    }
  }

  /**
   * Clear all validation errors
   */
  const clearValidationErrors = () => {
    serverErrors.value = {}
  }

  /**
   * Get error message for a specific field
   * @param field - Field name
   * @returns Error message or empty string
   */
  const getFieldError = (field: string): string => {
    return serverErrors.value[field] || ''
  }

  return {
    serverErrors,
    handleValidationError,
    clearValidationErrors,
    getFieldError
  }
}

