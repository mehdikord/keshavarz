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
      component: Home
    },
    {
      path: '/auth',
      name: 'auth',
      component: Auth,
      beforeEnter: (to, from, next) => {
        // چک کردن اینکه آیا کاربر قبلاً احراز هویت شده است
        const authToken = localStorage.getItem('keshavarz_auth_token')
        if (authToken) {
          // اگر احراز هویت شده بود، به صفحه اصلی redirect کن و history رو replace کن
          next({ path: '/', replace: true })
        } else {
          // در غیر این صورت، اجازه دسترسی به صفحه auth بده
          next()
        }
      }
    },
    {
      path: '/users',
      name: 'users',
      component: UsersIndex
    },
    {
      path: '/providers',
      name: 'providers',
      component: ProvidersIndex
    },
    {
      path: '/profile',
      name: 'profile',
      component: Profile
    },
    {
      path: '/users/lands',
      name: 'lands',
      component: LandsIndex
    },
    {
      path: '/users/lands/add',
      name: 'lands-add',
      component: LandsAdd
    },
    {
      path: '/users/lands/edit/:id',
      name: 'lands-edit',
      component: LandsEdit
    },
    {
      path: '/users/search',
      name: 'users-search',
      component: UsersSearch
    }
  ]
})

export default router










