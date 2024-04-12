import { useGlobalLoading } from "./tools/useGlobalLoading"
import { useGlobalEvent } from "./tools/useGlobalEvent";
import liuApi from "~/utils/liu-api"
import VConsole from 'vconsole';
import { init as initForSystem } from "~/utils/system/init"
import { onMounted, onUnmounted } from "vue";
import { useGlobalStateStore } from "./stores/useGlobalStateStore";
import liuEnv from "~/utils/liu-env";

// 监听和处理一些全局的事务，比如路由变化

export function useApp() {

  // 监听路由变化，若加载过久，窗口顶部会出现加载条
  useGlobalLoading()

  // 监听全局事件
  useGlobalEvent()

  // init analytics
  initAnalytics()
  
  // init mobile
  initMobile()

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

function initMobile() {
  const cha = liuApi.getCharacteristic()
  if(cha.isMobile) {
    const _env = liuEnv.getEnv()
    if(_env.DEV) {
      new VConsole()
    }
    import("~/styles/mobile-style.css")
  }
}

function initAnalytics() {
  const _env = liuEnv.getEnv()
  const { UMAMI_ID, UMAMI_SCRIPT } = _env
  if(!UMAMI_ID || !UMAMI_SCRIPT) return

  const scriptEl = document.createElement('script')
  scriptEl.type = "text/javascript"
  scriptEl.src = UMAMI_SCRIPT
  scriptEl.setAttribute("data-website-id", UMAMI_ID)
  scriptEl.defer = true
  scriptEl.async = true
  
  const headEl = document.querySelector("head")
  if(!headEl) return

  headEl.appendChild(scriptEl)
}