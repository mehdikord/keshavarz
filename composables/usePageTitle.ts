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
  }
  
  const pageTitle = computed(() => {
    const path = route.path
    
    // Check exact match first
    if (routeTitleMap[path]) {
      return routeTitleMap[path]
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
        'index': 'صفحه اصلی',
        'profile': 'پروفایل کاربری',
        'settings': 'تنظیمات',
        'farms': 'مزارع',
        'products': 'محصولات',
        'reports': 'گزارش‌ها',
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





