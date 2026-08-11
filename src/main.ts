import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize the auth store's onAuthStateChange listener on app startup.
// This must happen after Pinia is installed so the store can be accessed.
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
authStore.initialize()

app.mount('#app')
