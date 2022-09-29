import { createApp } from 'vue'
import './styles/style.css'
import App from './App.vue'
import { i18n } from './locales'

const app = createApp(App)

app.use(i18n)

app.mount('#app')