// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  modules: [
    // '@pinia/nuxt',
    // '@vueuse/nuxt',
    // '@nuxt/fonts'
  ],

  app: {
    head: {
      title: 'کشاورز',
      htmlAttrs: {
        lang: 'fa',
        dir: 'rtl'
      }
    }
  },

  css: ['~/assets/css/main.css']
})
