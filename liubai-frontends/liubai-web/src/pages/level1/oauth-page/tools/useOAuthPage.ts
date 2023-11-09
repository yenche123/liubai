import { reactive, watch } from "vue"
import { type OpData } from "./types"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { RouteLocationNormalizedLoaded } from "vue-router"

export function useOAuthPage() {

  const { router, route } = useRouteAndLiuRouter()

  const opData = reactive<OpData>({
    via: "",
    code: "",
    showLoading: true,
  })

  listenRouteChange(opData, route)

  const onTapBack = () => {
    router.replace({ name: "login" })
  }

  return {
    opData,
  }
}


function listenRouteChange(
  opData: OpData,
  route: RouteLocationNormalizedLoaded,
) {
  watch(route, (newV) => {
    if(!newV) return

    const n = newV.name
    const via = opData.via

    if(n === "login-github" && via !== "github") {
      enterFromGitHub(opData, newV)
    }
    else if(n === "login-google" && via !== "google") {
      enterFromGoogle(opData, newV)
    }
    
  })
}


function enterFromGitHub(
  opData: OpData,
  route: RouteLocationNormalizedLoaded,
) {

}

function enterFromGoogle(
  opData: OpData,
  route: RouteLocationNormalizedLoaded,
) {

}