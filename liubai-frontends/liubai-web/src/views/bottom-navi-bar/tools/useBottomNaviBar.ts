import { reactive, watch, useTemplateRef, inject, onMounted, onBeforeUnmount } from "vue"
import type { BnbData } from "./types"
import { useLayoutStore } from "~/views/useLayoutStore"
import { storeToRefs } from "pinia"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import { useWindowSize, useResizeObserver, useDebounceFn } from "~/hooks/useVueUse"
import { usePrefix } from "~/hooks/useCommon"
import cfg from "~/config";
import cui from '~/components/custom-ui';
import { deviceChaKey } from "~/utils/provide-keys"

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
  listenToRoute(bnbData)

  // listen to resize
  listenToResize()
  const funcs = initFunctions(bnbData)

  const cha = inject(deviceChaKey)
  if(cha?.isAndroid) {
    listenToInputChange(bnbData)
  }

  return {
    bnbData,
    ...funcs,
  }
}


function listenToInputChange(bnbData: BnbData) {
  const _focusin = () => {
    bnbData.tempHidden = true
  }
  const _focusout = () => {
    bnbData.tempHidden = false
  }

  onMounted(() => {
    document.body.addEventListener("focusin", _focusin)
    document.body.addEventListener("focusout", _focusout)
  })
  onBeforeUnmount(() => {
    document.body.removeEventListener("focusin", _focusin)
    document.body.removeEventListener("focusout", _focusout)
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


function listenToRoute(bnbData: BnbData) {
  const { route } = useRouteAndLiuRouter()
  watch(route, (newV) => {
    const { name, query } = newV
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
  }, { immediate: true })
}

function listenToContext(
  bnbData: BnbData
) {
  const layoutStore = useLayoutStore()
  const { sidebarWidth, sidebarStatus } = storeToRefs(layoutStore)
  const { width} = useWindowSize()

  watch([sidebarWidth, sidebarStatus, width], (
    [newV1, newV2, newV3]
  ) => {
    const { sidebarType } = layoutStore
    if(newV1 > 0 || newV2 === "fullscreen") {
      if(bnbData.show) {
        toHide(bnbData)
        layoutStore.$patch({ bottomNaviBar: false })
      }
      return
    }

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