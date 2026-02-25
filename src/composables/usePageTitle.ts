import { computed } from 'vue'
import { useRoute } from 'vue-router'

export const usePageTitle = () => {
  const route = useRoute()
  
  // Mapping route paths to Persian titles
  const routeTitleMap: Record<string, string> = {
    '/': 'صفحه اصلی',
    '/index': 'صفحه اصلی',
    '/profile': 'پروفایل کاربری',
    '/settings': 'تنظیمات',
    '/farms': 'مزارع',
    '/products': 'محصولات',
    '/reports': 'گزارش‌ها',
    '/users/lands': 'مدیریت زمین ها',
    '/users/lands/add': 'ثبت زمین جدید',
    '/users/lands/edit': 'ویرایش زمین',
    '/users/search': 'جستجو خدمات',
    '/users/providers': 'پروفایل خدمات دهنده',
    '/users/requests': 'درخواست‌ها',
    '/providers': 'پنل خدمات‌دهندگان',
    '/providers/requests': 'درخواست‌ها',
    '/providers/services': 'خدمات من',
    '/news': 'اخبار',
  }
  
  const pageTitle = computed(() => {
    const path = route.path
    
    // Check exact match first
    if (routeTitleMap[path]) {
      return routeTitleMap[path]
    }
    // جزئیات درخواست: /users/requests/123
    if (path.startsWith('/users/requests/') && path !== '/users/requests') {
      return 'جزئیات درخواست'
    }
    
    // Check for dynamic routes (e.g., /profile/:id)
    for (const [routePath, title] of Object.entries(routeTitleMap)) {
      if (path.startsWith(routePath) && path !== '/') {
        return title
      }
    }
    
    // Extract title from route name if available
    if (route.name && typeof route.name === 'string') {
      // Convert route name to Persian (simple mapping)
      const nameTitleMap: Record<string, string> = {
        'home': 'صفحه اصلی',
        'index': 'صفحه اصلی',
        'profile': 'پروفایل کاربری',
        'settings': 'تنظیمات',
        'farms': 'مزارع',
        'products': 'محصولات',
        'reports': 'گزارش‌ها',
        'lands': 'مدیریت زمین ها',
        'lands-add': 'ثبت زمین جدید',
        'lands-edit': 'ویرایش زمین',
        'users-search': 'جستجو خدمات',
        'provider-profile': 'پروفایل خدمات دهنده',
        'users-requests': 'درخواست‌ها',
        'users-request-detail': 'جزئیات درخواست',
        'providers': 'پنل خدمات‌دهندگان',
        'providers-requests': 'درخواست‌ها',
        'providers-services': 'خدمات من',
        'news': 'اخبار',
      }
      
      if (nameTitleMap[route.name]) {
        return nameTitleMap[route.name]
      }
    }
    
    // Fallback: use path segments
    const segments = path.split('/').filter(Boolean)
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1]
      // Simple fallback - could be improved
      return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
    }
    
    return 'کشاورز'
  })
  
  return {
    pageTitle
  }
}
