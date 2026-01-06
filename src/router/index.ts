import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Auth from '../views/Auth.vue'
import UsersIndex from '../views/users/index.vue'
import ProvidersIndex from '../views/providers/index.vue'
import Profile from '../views/Profile.vue'
import LandsIndex from '../views/users/lands/index.vue'
import LandsAdd from '../views/users/lands/add.vue'
import LandsEdit from '../views/users/lands/edit.vue'
import UsersSearch from '../views/users/search.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: { requiresAuth: true }
    },
    {
      path: '/auth',
      name: 'auth',
      component: Auth,
      meta: { requiresAuth: false }
    },
    {
      path: '/users',
      name: 'users',
      component: UsersIndex,
      meta: { requiresAuth: true }
    },
    {
      path: '/providers',
      name: 'providers',
      component: ProvidersIndex,
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: Profile,
      meta: { requiresAuth: true }
    },
    {
      path: '/users/lands',
      name: 'lands',
      component: LandsIndex,
      meta: { requiresAuth: true }
    },
    {
      path: '/users/lands/add',
      name: 'lands-add',
      component: LandsAdd,
      meta: { requiresAuth: true }
    },
    {
      path: '/users/lands/edit/:id',
      name: 'lands-edit',
      component: LandsEdit,
      meta: { requiresAuth: true }
    },
    {
      path: '/users/search',
      name: 'users-search',
      component: UsersSearch,
      meta: { requiresAuth: true }
    }
  ]
})

// Global navigation guard برای چک کردن احراز هویت
router.beforeEach((to, from, next) => {
  const authToken = localStorage.getItem('keshavarz_auth_token')
  const isAuthenticated = !!authToken
  
  // اگر صفحه نیاز به احراز هویت داره و کاربر لاگین نکرده
  if (to.meta.requiresAuth && !isAuthenticated) {
    // redirect به صفحه auth
    next({ name: 'auth', replace: true })
  } 
  // اگر کاربر لاگین کرده و می‌خواد بره صفحه auth
  else if (to.name === 'auth' && isAuthenticated) {
    // redirect به صفحه اصلی
    next({ name: 'home', replace: true })
  } 
  else {
    // اجازه دسترسی
    next()
  }
})

export default router










