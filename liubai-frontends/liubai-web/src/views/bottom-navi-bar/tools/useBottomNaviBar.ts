import { reactive, watch } from "vue"
import type { BnbData } from "./types"
import { useWindowSize } from "~/hooks/useVueUse"
import { useLayoutStore } from "~/views/useLayoutStore"
import { storeToRefs } from "pinia"
import cfg from "~/config"
import { useRouteAndLiuRouter } from "~/routes/liu-router"

export function useBottomNaviBar() {
  const bnbData = reactive<BnbData>({
    show: false,
    currentState: "home"
  })
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
  const { width } = useWindowSize()
  const layoutStore = useLayoutStore()
  const { sidebarWidth } = storeToRefs(layoutStore)

  watch([width, sidebarWidth], ([newV1, newV2]) => {
    if(newV2 > 0) {
      if(bnbData.show) {
        toHide(bnbData)
        layoutStore.$patch({ bottomNaviBar: false })
      }
      return
    }

    const needToShow = newV1 <= cfg.breakpoint_max_size.mobile
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