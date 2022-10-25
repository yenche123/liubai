import 'virtual:svg-icons-register'
import { createApp } from 'vue'

// 引入 CSS
// 根据加载顺序 custom-style 可以使用 theme-light/dark 里的 CSS 变量
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
import CustomBtn from "./components/custom-ui/custom-button.vue"

const app = createApp(App)

app.component("SvgIcon", SvgIcon)
app.component("CustomBtn", CustomBtn)
app.use(createPinia())
app.use(i18n)
app.use(router)

app.mount('#app')