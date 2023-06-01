import 'virtual:svg-icons-register'
import { createApp, defineAsyncComponent } from 'vue'

// 引入 CSS
// 根据加载顺序 custom-style 可以使用 theme-light/dark 里的 CSS 变量
import './styles/style.css'
import './styles/theme.css'
import './styles/theme-light.css'
import './styles/theme-dark.css'
import './styles/custom-style.css'
import 'floating-vue/dist/style.css'
import 'vue-draggable-resizable/dist/VueDraggableResizable.css'

import App from './App.vue'
import { i18n } from './locales'
import { createPinia } from 'pinia'
import { router } from './routes/router'
import SvgIcon from "./assets/svg-icon.vue"
import CustomBtn from "./components/custom-ui/custom-button.vue"
import LiuSwitch from "./components/common/liu-switch/liu-switch.vue"
import LiuImg from "./components/common/liu-img/liu-img.vue"
import LiuCheckbox from "./components/common/liu-checkbox/liu-checkbox.vue"
import FloatingVue from 'floating-vue'
import { plugin as Slicksort } from 'vue-slicksort';


const app = createApp(App)

app.component("SvgIcon", SvgIcon)
app.component("CustomBtn", CustomBtn)
app.component("LiuSwitch", LiuSwitch)
app.component("LiuImg", LiuImg)
app.component("LiuCheckbox", LiuCheckbox)
app.component("LiuMenu", defineAsyncComponent(() => 
  import("./components/common/liu-menu/liu-menu.vue")
))
app.component("FloatActionButton", defineAsyncComponent(() =>
  import("./components/level1/float-action-button/float-action-button.vue")
))
app.component("LiuTooltip", defineAsyncComponent(() => 
  import("./components/common/liu-tooltip/liu-tooltip.vue")
))

app.use(createPinia())
app.use(i18n)
app.use(router)
app.use(FloatingVue, {
  themes: {
    'emoji-select': {
      $extend: "dropdown",
      distance: 10,
      skidding: 10,
    },
    'liu-menu': {
      $extend: "dropdown",
    },
    'liu-tooltip': {
      $extend: "tooltip",
    }
  }
})
app.use(Slicksort)

// app.config.unwrapInjectedRef = true    
// vue 3.2.x 仍需要有上方这一行
// 来自 tiptap 解析 `codeBlock` 时的警告
// 详情请见: https://cn.vuejs.org/guide/components/provide-inject.html#working-with-reactivity
// 上述链接记得将 API 风格切换至: 选项式

app.mount('#app')