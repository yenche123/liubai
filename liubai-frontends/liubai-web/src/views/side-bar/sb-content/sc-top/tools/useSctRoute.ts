import { ref, watch } from "vue";
import { useRouteAndLiuRouter } from "~/routes/liu-router";
import typeCheck from "~/utils/basic/type-check";
import type { RouteLocationNormalizedLoaded } from "vue-router"
import type { SctIndicator } from "./types"

export function useSctRoute() {
  const sctIndicator = ref<SctIndicator>("")
  const { route } = useRouteAndLiuRouter()

  const whenRouteChange = (newV: RouteLocationNormalizedLoaded) => {
    const inSetting = newV.meta.inSetting
    if(inSetting) {
      sctIndicator.value = "setting"
      return
    }

    const { name } = newV
    if(!typeCheck.isString(name)) return

    if(name === "notification" || name === "collaborative-notification") {
      sctIndicator.value = "notification"
    }
    else if(name === "trash" || name === "collaborative-trash") {
      sctIndicator.value = "trash"
    }
    else {
      sctIndicator.value = ""
    }
  }

  watch(route, (newV) => {
    if(newV) whenRouteChange(newV)
  }, { immediate: true })

  return {
    sctIndicator
  }
}