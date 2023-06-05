import { useGlobalLoading } from "./tools/useGlobalLoading"
import liuApi from "~/utils/liu-api"
import VConsole from 'vconsole';
import { init as initForSystem } from "~/utils/system/init"
import { onMounted, onUnmounted } from "vue";
import { useGlobalStateStore } from "./stores/useGlobalStateStore";
import liuEnv from "~/utils/liu-env";
import middleBridge from "~/utils/middle-bridge";

// 监听和处理一些全局的事务，比如路由变化

export function useApp() {

  // 设置 title
  middleBridge.setAppTitle()

  // 监听路由变化，若加载过久，窗口顶部会出现加载条
  useGlobalLoading()

  const env = liuEnv.getEnv()
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