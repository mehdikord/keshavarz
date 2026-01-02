import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios'
import router from '../router'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.NUXT_PUBLIC_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Request interceptor - Add Bearer token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem('keshavarz_auth_token')
    
    // If token exists, add to Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear localStorage
      localStorage.removeItem('keshavarz_auth_token')
      localStorage.removeItem('keshavarz_user')
      
      // Redirect to auth page
      if (router) {
        router.push('/auth')
      } else {
        window.location.href = '/auth'
      }
    }
    
    // Reject promise for other errors
    return Promise.reject(error)
  }
)

export default api

