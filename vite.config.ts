import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      port: 3000,
      host: true
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false
    },
    optimizeDeps: {
      include: ['leaflet']
    },
    define: {
      'import.meta.env.NUXT_PUBLIC_API_BASE_URL': JSON.stringify(env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api'),
      'import.meta.env.NUXT_PUBLIC_WEATHER_API_KEY': JSON.stringify(env.NUXT_PUBLIC_WEATHER_API_KEY || '')
    }
  }
})










