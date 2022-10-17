import 'virtual:svg-icons-register'
import { createApp } from 'vue'
import './styles/style.css'
import './styles/theme.css'
import './styles/theme-light.css'
import './styles/theme-dark.css'
import './styles/custom-style.css'
import App from './App.vue'
import { i18n } from './locales'
import { createPinia } from 'pinia'
import { router } from './routes/router'
import SvgIcon from "./assets/svg-icon.vue"

const app = createApp(App)

app.component("SvgIcon", SvgIcon)
app.use(createPinia())
app.use(i18n)
app.use(router)

app.mount('#app')