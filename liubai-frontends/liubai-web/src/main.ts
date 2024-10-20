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
import 'vue-draggable-resizable/style.css'

import App from './App.vue'
import { i18n } from './locales'
import { createPinia } from 'pinia'
import { router } from './routes/router'
import SvgIcon from "./assets/svg-icon.vue"
import CustomBtn from "./components/custom-ui/custom-button/custom-button.vue"
import LiuSwitch from "./components/common/liu-switch/liu-switch.vue"
import LiuImg from "./components/common/liu-img/liu-img.vue"
import LiuCheckbox from "./components/common/liu-checkbox/liu-checkbox.vue"
import PlaceholderView from "./views/common/placeholder-view/placeholder-view.vue";
import FloatingVue from 'floating-vue'
import { plugin as Slicksort } from 'vue-slicksort';
import { liuShowDirective } from "~/utils/directives/v-liu-show"
import VueDraggableResizable from 'vue-draggable-resizable'
import { useSystemStore } from './hooks/stores/useSystemStore'
import { initSentry } from "~/utils/third-party/sentry/init-sentry"

const app = createApp(App)

app.component("SvgIcon", SvgIcon)
app.component("CustomBtn", CustomBtn)
app.component("LiuSwitch", LiuSwitch)
app.component("LiuImg", LiuImg)
app.component("LiuCheckbox", LiuCheckbox)
app.component("PlaceholderView", PlaceholderView)
app.component("LiuMenu", defineAsyncComponent(() => 
  import("./components/common/liu-menu/liu-menu.vue")
))
app.component("FloatingActionButton", defineAsyncComponent(() =>
  import("./components/level1/floating-action-button/floating-action-button.vue")
))
app.component("LiuTooltip", defineAsyncComponent(() => 
  import("./components/common/liu-tooltip/liu-tooltip.vue")
))
app.component("vue-draggable-resizable", VueDraggableResizable)

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

// 注册全局指令
app.directive('liu-show', liuShowDirective)

// 初始化主题，要在 pinia 之后
useSystemStore()

const runMain = () => {
  // initialize sentry
  initSentry(app)

  // mount app of Vue
  app.mount('#app')
}

runMain()