import { createApp } from 'vue'
import { createPinia } from 'pinia'
import naive from 'naive-ui'
import router from './router'
import App from './App.vue'
import './assets/css/main.css'
import './assets/fontawesome/css/all.css'
import 'vue3-persian-datetime-picker/src/picker/assets/scss/style.scss'
import 'animate.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(naive)

app.mount('#app')












