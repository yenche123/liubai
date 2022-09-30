import { createApp } from 'vue'
import './styles/style.css'
import App from './App.vue'
import { i18n } from './locales'
import { createPinia } from 'pinia'
import { router } from './routes/router'

const app = createApp(App)

app.use(createPinia())
app.use(i18n)
app.use(router)

app.mount('#app')