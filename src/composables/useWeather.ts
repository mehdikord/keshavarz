import { ref } from 'vue'
import { Geolocation } from '@capacitor/geolocation'

export interface WeatherData {
  city: string
  temperature: number
  description: string
  humidity: number
  windSpeed: number
  icon: string
  feelsLike: number
}

export interface ForecastDay {
  date: string
  dayName: string
  minTemp: number
  maxTemp: number
  icon: string
  description: string
}

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || ''
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'
const FORECAST_API_URL = 'https://api.openweathermap.org/data/2.5/forecast'

export const useWeather = () => {
  const loading = ref(false)
  const weatherData = ref<WeatherData | null>(null)
  const forecastData = ref<ForecastDay[]>([])
  const error = ref<string | null>(null)

  const getWeatherByCity = async (cityName: string) => {
    if (!API_KEY) {
      error.value = 'API Key هواشناسی تنظیم نشده است. لطفا API Key را در فایل .env تنظیم کنید'
      return null
    }

    loading.value = true
    error.value = null

    try {
      const response = await fetch(
        `${API_BASE_URL}?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric&lang=fa`
      )

      if (!response.ok) {
        if (response.status === 404) {
          error.value = 'شهر یافت نشد'
          return null
        }
        throw new Error('خطا در دریافت اطلاعات هواشناسی')
      }

      const data = await response.json()

      weatherData.value = {
        city: data.name,
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // تبدیل از m/s به km/h
        icon: data.weather[0].icon,
        feelsLike: Math.round(data.main.feels_like)
      }

      return weatherData.value
    } catch (err: any) {
      console.error('Error fetching weather:', err)
      error.value = err.message || 'خطا در دریافت اطلاعات هواشناسی'
      return null
    } finally {
      loading.value = false
    }
  }

  const getWeatherByLocation = async (lat: number, lon: number) => {
    if (!API_KEY) {
      error.value = 'API Key هواشناسی تنظیم نشده است. لطفا API Key را در فایل .env تنظیم کنید'
      return null
    }

    loading.value = true
    error.value = null

    try {
      const response = await fetch(
        `${API_BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=fa`
      )

      if (!response.ok) {
        throw new Error('خطا در دریافت اطلاعات هواشناسی')
      }

      const data = await response.json()

      weatherData.value = {
        city: data.name,
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6),
        icon: data.weather[0].icon,
        feelsLike: Math.round(data.main.feels_like)
      }

      return weatherData.value
    } catch (err: any) {
      console.error('Error fetching weather:', err)
      error.value = err.message || 'خطا در دریافت اطلاعات هواشناسی'
      return null
    } finally {
      loading.value = false
    }
  }

  const getUserLocation = async (): Promise<{ lat: number; lon: number } | null> => {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      })

      return {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      }
    } catch (err: any) {
      console.error('Error getting location:', err)
      let errorMessage = 'خطا در دریافت موقعیت جغرافیایی'
      
      if (err.code === 1) {
        errorMessage = 'دسترسی به موقعیت جغرافیایی رد شد. لطفا مجوز دسترسی را فعال کنید'
      } else if (err.code === 2) {
        errorMessage = 'موقعیت جغرافیایی در دسترس نیست'
      } else if (err.code === 3) {
        errorMessage = 'زمان دریافت موقعیت به پایان رسید'
      }

      error.value = errorMessage
      return null
    }
  }

  const loadWeatherByUserLocation = async () => {
    const location = await getUserLocation()
    if (location) {
      return await getWeatherByLocation(location.lat, location.lon)
    }
    return null
  }

  const getDayName = (date: Date): string => {
    const days = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه']
    return days[date.getDay()]
  }

  const formatDate = (date: Date): string => {
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}/${day}`
  }

  const getForecastByCity = async (cityName: string) => {
    if (!API_KEY) {
      error.value = 'API Key هواشناسی تنظیم نشده است. لطفا API Key را در فایل .env تنظیم کنید'
      return null
    }

    const wasLoading = loading.value
    if (!wasLoading) {
      loading.value = true
    }
    error.value = null

    try {
      const response = await fetch(
        `${FORECAST_API_URL}?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric&lang=fa`
      )

      if (!response.ok) {
        if (response.status === 404) {
          error.value = 'شهر یافت نشد'
          return null
        }
        throw new Error('خطا در دریافت پیش‌بینی هواشناسی')
      }

      const data = await response.json()
      const forecastDays: ForecastDay[] = []
      const dailyData: { [key: string]: any[] } = {}

      // گروه‌بندی داده‌ها بر اساس روز
      data.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000)
        const dateKey = date.toDateString()
        
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = []
        }
        dailyData[dateKey].push(item)
      })

      // تبدیل به آرایه و مرتب‌سازی
      const sortedDates = Object.keys(dailyData).sort((a, b) => {
        return new Date(a).getTime() - new Date(b).getTime()
      })

      // برای هر روز، حداقل و حداکثر دما را محاسبه می‌کنیم
      sortedDates.slice(0, 5).forEach((dateKey) => {
        const dayItems = dailyData[dateKey]
        const date = new Date(dateKey)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        date.setHours(0, 0, 0, 0)

        // فقط روزهای آینده را نمایش می‌دهیم
        if (date.getTime() > today.getTime()) {
          const temps = dayItems.map((item: any) => item.main.temp)
          const minTemp = Math.round(Math.min(...temps))
          const maxTemp = Math.round(Math.max(...temps))
          
          // آیکون و توضیحات را از وسط روز می‌گیریم
          const midDayItem = dayItems[Math.floor(dayItems.length / 2)]
          
          forecastDays.push({
            date: formatDate(date),
            dayName: getDayName(date),
            minTemp,
            maxTemp,
            icon: midDayItem.weather[0].icon,
            description: midDayItem.weather[0].description
          })
        }
      })

      forecastData.value = forecastDays
      return forecastDays
    } catch (err: any) {
      console.error('Error fetching forecast:', err)
      error.value = err.message || 'خطا در دریافت پیش‌بینی هواشناسی'
      return null
    } finally {
      if (!wasLoading) {
        loading.value = false
      }
    }
  }

  const getForecastByLocation = async (lat: number, lon: number) => {
    if (!API_KEY) {
      error.value = 'API Key هواشناسی تنظیم نشده است. لطفا API Key را در فایل .env تنظیم کنید'
      return null
    }

    const wasLoading = loading.value
    if (!wasLoading) {
      loading.value = true
    }
    error.value = null

    try {
      const response = await fetch(
        `${FORECAST_API_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=fa`
      )

      if (!response.ok) {
        throw new Error('خطا در دریافت پیش‌بینی هواشناسی')
      }

      const data = await response.json()
      const forecastDays: ForecastDay[] = []
      const dailyData: { [key: string]: any[] } = {}

      // گروه‌بندی داده‌ها بر اساس روز
      data.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000)
        const dateKey = date.toDateString()
        
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = []
        }
        dailyData[dateKey].push(item)
      })

      // تبدیل به آرایه و مرتب‌سازی
      const sortedDates = Object.keys(dailyData).sort((a, b) => {
        return new Date(a).getTime() - new Date(b).getTime()
      })

      // برای هر روز، حداقل و حداکثر دما را محاسبه می‌کنیم
      sortedDates.slice(0, 5).forEach((dateKey) => {
        const dayItems = dailyData[dateKey]
        const date = new Date(dateKey)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        date.setHours(0, 0, 0, 0)

        // فقط روزهای آینده را نمایش می‌دهیم
        if (date.getTime() > today.getTime()) {
          const temps = dayItems.map((item: any) => item.main.temp)
          const minTemp = Math.round(Math.min(...temps))
          const maxTemp = Math.round(Math.max(...temps))
          
          // آیکون و توضیحات را از وسط روز می‌گیریم
          const midDayItem = dayItems[Math.floor(dayItems.length / 2)]
          
          forecastDays.push({
            date: formatDate(date),
            dayName: getDayName(date),
            minTemp,
            maxTemp,
            icon: midDayItem.weather[0].icon,
            description: midDayItem.weather[0].description
          })
        }
      })

      forecastData.value = forecastDays
      return forecastDays
    } catch (err: any) {
      console.error('Error fetching forecast:', err)
      error.value = err.message || 'خطا در دریافت پیش‌بینی هواشناسی'
      return null
    } finally {
      if (!wasLoading) {
        loading.value = false
      }
    }
  }

  const loadForecastByUserLocation = async () => {
    const location = await getUserLocation()
    if (location) {
      return await getForecastByLocation(location.lat, location.lon)
    }
    return null
  }

  return {
    loading,
    weatherData,
    forecastData,
    error,
    getWeatherByCity,
    getWeatherByLocation,
    getUserLocation,
    loadWeatherByUserLocation,
    getForecastByCity,
    getForecastByLocation,
    loadForecastByUserLocation
  }
}

