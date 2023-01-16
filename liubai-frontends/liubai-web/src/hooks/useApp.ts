import { useRouteAndLiuRouter } from "../routes/liu-router"
import liuApi from "../utils/liu-api"
import liuUtil from "../utils/liu-util"
import VConsole from 'vconsole';
import { init as initForSystem } from "../utils/system/init"
import { onMounted, onUnmounted } from "vue";
import { useGlobalStateStore } from "./stores/useGlobalStateStore";

// 监听和处理一些全局的事务，比如路由变化

export function useApp() {
  const { router } = useRouteAndLiuRouter()

  router.beforeEach((to, from, next) => {
    next()
  })

  const env = liuUtil.getEnv()
  const cha = liuApi.getCharacteristic()
  if(cha.isMobile) {
    if(env.DEV) {
      new VConsole()
    }
    import("~/styles/mobile-style.css")
  }

  initForSystem()
  initListenSelection()
}


function initListenSelection() {
  const gStore = useGlobalStateStore()
  let lastText = ""

  // 如果 selection 发生了改变则触发
  // 但如果上一次选中的文字和这一次的都是空白的，那么则忽略
  const whenSelect = (e: Event) => {
    const nowText = liuApi.getSelectionText()
    if(!nowText && !lastText) return
    lastText = nowText
    gStore.setLatestSelectionChange()
  }

  onMounted(() => {
    document.addEventListener("selectionchange", whenSelect)
  })

  onUnmounted(() => {
    document.removeEventListener("selectionchange", whenSelect)
  })
}