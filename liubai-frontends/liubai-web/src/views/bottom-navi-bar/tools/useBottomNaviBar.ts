import { reactive, watch } from "vue"
import type { BnbData } from "./types"
import { useLayoutStore } from "~/views/useLayoutStore"
import { storeToRefs } from "pinia"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import { useWindowSize } from "~/hooks/useVueUse"
import { usePrefix } from "~/hooks/useCommon"
import cfg from "~/config"

export function useBottomNaviBar() {
  const { prefix } = usePrefix()
  
  const bnbData = reactive<BnbData>({
    show: false,
    currentState: "home",
    prefix: prefix.value,
  })
  watch(prefix, (newV) => bnbData.prefix = newV)

  listenToContext(bnbData)
  listenToRoute(bnbData)

  return {
    bnbData,
  }
}


function listenToRoute(bnbData: BnbData) {
  const { route } = useRouteAndLiuRouter()
  watch(() => route.name, (newV) => {
    if(newV === "index" || newV === "collaborative-index") {
      bnbData.currentState = "home"
    }
    else if(newV === "mine" || newV === "collaborative-mine") {
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