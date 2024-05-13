import { useGlobalLoading } from "./tools/useGlobalLoading"
import { useGlobalEvent } from "./tools/useGlobalEvent";
import liuApi from "~/utils/liu-api"
import { init as initForSystem } from "~/utils/system/init"
import { onMounted, onUnmounted } from "vue";
import { useGlobalStateStore } from "./stores/useGlobalStateStore";
import liuEnv from "~/utils/liu-env";
import { useIdsChanged } from "./tools/useIdsChanged";

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

  // init space & CloudFiler & LocalToCloud or initForPureLocalMode
  initForSystem()

  // init text selection
  initListenSelection()

  // init useIdsChanged
  useIdsChanged()
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


async function getVConsole() {
  const VConsole = await import("vconsole")
  return VConsole
}

async function initMobile() {
  const cha = liuApi.getCharacteristic()
  if(cha.isMobile) {
    const _env = liuEnv.getEnv()
    if(_env.DEV) {
      const VConsole = await getVConsole()
      new VConsole.default()
    }
    import("~/styles/mobile-style.css")
  }
}

function initAnalytics() {
  const _env = liuEnv.getEnv()
  const { 
    UMAMI_ID, 
    UMAMI_SCRIPT,
    MS_CLARITY_SCRIPT,
    MS_CLARITY_PROJECT_ID,
  } = _env

  if(UMAMI_ID && UMAMI_SCRIPT) {
    initUmami(UMAMI_SCRIPT, UMAMI_ID)
  }

  if(MS_CLARITY_PROJECT_ID && MS_CLARITY_SCRIPT) {
    initClarity(MS_CLARITY_SCRIPT, MS_CLARITY_PROJECT_ID)
  }

}

function initUmami(script: string, umami_id: string) {
  const scriptEl = document.createElement('script')
  scriptEl.type = "text/javascript"
  scriptEl.src = script
  scriptEl.setAttribute("data-website-id", umami_id)
  scriptEl.defer = true
  scriptEl.async = true
  const headEl = document.querySelector("head")
  if(!headEl) return
  headEl.appendChild(scriptEl)
}


function initClarity(script: string, project_id: string) {
  const scriptEl = document.createElement('script')
  scriptEl.type = "text/javascript"
  scriptEl.defer = true
  scriptEl.async = true

  let text = `(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="uuuuu"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "xxxxx");`
  text = text.replace("xxxxx", project_id);
  text = text.replace("uuuuu", script);
  scriptEl.innerHTML = text
  
  const headEl = document.querySelector("head")
  if(!headEl) return
  headEl.appendChild(scriptEl)
}