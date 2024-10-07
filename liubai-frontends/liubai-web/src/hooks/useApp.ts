import { useGlobalLoading } from "./tools/useGlobalLoading"
import { useGlobalEvent } from "./tools/useGlobalEvent";
import liuApi from "~/utils/liu-api"
import { init as initForSystem } from "~/utils/system/init"
import { onMounted, onUnmounted, provide } from "vue";
import { useGlobalStateStore } from "./stores/useGlobalStateStore";
import liuEnv from "~/utils/liu-env";
import { useIdsChanged } from "./tools/useIdsChanged";
import localCache from "~/utils/system/local-cache";
import { deviceChaKey } from "~/utils/provide-keys";
import type { GetChaRes } from "~/utils/liu-api/tools/types";
import { listenLoaded, listenWxJSBridgeReady } from "./tools/listen-loaded"
import { initServiceWorker } from "./pwa/useServiceWorker"
import { initListenError } from "./tools/initListenError";
import { initAnalytics } from "./tools/initAnalytics";
import { type LocalOnceData } from "~/utils/system/tools/types";
import { useScreenOrientation } from "./useVueUse";
import time from "~/utils/basic/time";
import { initAwake } from "./tools/initAwake";
import limit from "~/utils/limit";

// 监听和处理一些全局的事务，比如路由变化

export function useApp() {

  initListenError()

  const cha = liuApi.getCharacteristic()
  const onceData = initOnceData()

  // init device characteristics
  initDeviceCha(cha)

  // init mobile
  initMobile(cha, onceData)

  // 监听路由变化，若加载过久，窗口顶部会出现加载条
  useGlobalLoading()

  // 监听全局事件
  useGlobalEvent()

  // init analytics
  initAnalytics()

  // init space & CloudFiler & LocalToCloud or initForPureLocalMode
  initForSystem()

  // init text selection
  initListenSelection()

  // init useIdsChanged
  useIdsChanged()

  // listen to document loaded
  listenLoaded()

  // listen to wx jsbridge ready
  if(cha.isWeChat) {
    listenWxJSBridgeReady()
  }

  // init service worker
  initServiceWorker()

  // 在一段时间后，监听页面被显示
  initAwake()

  limit.init()

  return {
    cha,
  }
}


function initOnceData() {
  const onceData = localCache.getOnceData()
  if(!onceData.launchStamp) {
    const now = time.getTime()
    onceData.launchStamp = now
    localCache.setOnceData("launchStamp", now)
  }
  return onceData
}


function initDeviceCha(cha: GetChaRes) {
  provide(deviceChaKey, cha)
}

function printInit() {
  const version = LIU_ENV.version
  const appName = liuEnv.getEnv().APP_NAME
  console.log(`You are using ${appName} v${version}`)
  console.log(" ")
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

async function initMobile(
  cha: GetChaRes,
  onceData: LocalOnceData,
) {

  // 0. return if not mobile
  if(!cha.isMobile) {
    printInit()
    return
  }

  // 1. lock screen orientation
  setTimeout(() => {
    toLockOrientation(cha)
  }, time.SECONED)

  // 2. open vconsole
  const _open = async () => {
    const VConsole = await getVConsole()
    new VConsole.default({
      onReady() {
        printInit()
        console.log("characteristic: ", cha)
        console.log(" ")
      }
    })
    import("~/styles/mobile-style.css")
  }

  const _env = liuEnv.getEnv()
  if(_env.DEV) {
    _open()
    return
  }

  if(onceData.mobile_debug) {
    _open()
    return
  }
  
  printInit()
}


async function toLockOrientation(
  cha: GetChaRes,
) {
  const {
    isSupported,
    orientation,
  } = useScreenOrientation()

  if(!isSupported.value) {
    console.log("screen orientation is not supported")
    return
  }

  // const oType = orientation.value
  // console.log("let me see orientation: ", oType)

}