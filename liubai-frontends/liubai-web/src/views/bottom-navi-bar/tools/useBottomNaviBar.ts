import { reactive, watch, useTemplateRef, inject } from "vue"
import type { BnbData } from "./types"
import { useLayoutStore } from "~/views/useLayoutStore"
import { storeToRefs } from "pinia"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import { useWindowSize, useResizeObserver, useDebounceFn } from "~/hooks/useVueUse"
import { usePrefix } from "~/hooks/useCommon"
import cfg from "~/config";
import cui from '~/components/custom-ui';
import { deviceChaKey } from "~/utils/provide-keys"
import liuUtil from "~/utils/liu-util"
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore"

export function useBottomNaviBar() {
  const { prefix } = usePrefix()
  
  const bnbData = reactive<BnbData>({
    show: false,
    currentState: "index",
    prefix: prefix.value,
    tempHidden: false,
  })
  watch(prefix, (newV) => bnbData.prefix = newV)

  listenToContext(bnbData)

  // listen to resize
  listenToResize()
  const funcs = initFunctions(bnbData)

  const cha = inject(deviceChaKey)
  if(cha?.isMobile) {
    listenToInputChange(bnbData)
  }

  return {
    bnbData,
    ...funcs,
  }
}


function listenToInputChange(bnbData: BnbData) {
  const gStore = useGlobalStateStore()
  const { customEditorInputing } = storeToRefs(gStore)
  watch(customEditorInputing, (newV) => {
    bnbData.tempHidden = newV
  })
}


function initFunctions(
  bnbData: BnbData,
) {
  const layoutStore = useLayoutStore()
  const rr = useRouteAndLiuRouter()

  const onTapSearch = () => {
    cui.showSearchEditor({ type: "search" })
  }

  const _switchTab = (to: string) => {
    rr.router.switchTab(to, rr.route)
  }

  const onTapHome = () => {
    if(bnbData.currentState === "index") {
      layoutStore.triggerBnbGoToTop()
      return
    }
    _switchTab(bnbData.prefix)
  }

  const onTapMine = () => {
    if(bnbData.currentState === "mine") {
      layoutStore.triggerBnbGoToTop()
      return
    }
    _switchTab(bnbData.prefix + "mine")
  }

  return {
    onTapSearch,
    onTapHome,
    onTapMine,
  }
}


function listenToResize() {
  const layoutStore = useLayoutStore()
  const elRef = useTemplateRef<HTMLElement>("bottom-navi-bar")
  const _resize = useDebounceFn((entries: readonly ResizeObserverEntry[]) => {
    const entry = entries[0]
    const { height } = entry.contentRect
    if(height > 0 && height !== layoutStore.bnbHeight) {
      layoutStore.$patch({ bnbHeight: height })
    }
  }, 200)
  useResizeObserver(elRef, _resize)
}

function listenToContext(
  bnbData: BnbData
) {
  const { route } = useRouteAndLiuRouter()
  const layoutStore = useLayoutStore()
  const { sidebarWidth, sidebarStatus } = storeToRefs(layoutStore)
  const { width} = useWindowSize()

  watch([sidebarWidth, sidebarStatus, width, route], (
    [newV1, newV2, newV3, newV4]
  ) => {
    const { sidebarType } = layoutStore
    const { name, query } = newV4
    const hasViceView = liuUtil.needToOpenViceView(query)
    
    // 1. force to hide
    if(newV1 > 0 || newV2 === "fullscreen" || hasViceView) {
      if(bnbData.show) {
        toHide(bnbData)
        layoutStore.$patch({ bottomNaviBar: false })
      }
      return
    }

    // 2. handle currentState
    const search = query?.search
    const q = query?.q
    if(search === "01" || q) {
      bnbData.currentState = "search"
    }
    else if(name === "index" || name === "collaborative-index") {
      bnbData.currentState = "index"
    }
    else if(name === "mine" || name === "collaborative-mine") {
      bnbData.currentState = "mine"
    }

    // 3. show or hide
    let needToShow = sidebarType === "closed_by_auto"
    if(newV3 <= cfg.breakpoint_max_size.mobile) {
      needToShow = true
    }
    if (needToShow && !bnbData.show) {
      toShow(bnbData)
      layoutStore.$patch({ bottomNaviBar: true })
    }
    else if (!needToShow && bnbData.show) {
      toHide(bnbData)
      layoutStore.$patch({ bottomNaviBar: false })
    }

  }, { immediate: true })
}

function toShow(bnbData: BnbData) {
  bnbData.show = true
}

function toHide(bnbData: BnbData) {
  bnbData.show = false
}