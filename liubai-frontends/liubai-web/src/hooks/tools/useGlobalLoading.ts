import { useRouteAndLiuRouter } from "~/routes/liu-router"
import { showGlobalLoading, hideGlobalLoading } from "~/components/loaders/global-loading"
import time from "~/utils/basic/time";

const DURATION_LOADING = 190

export function useGlobalLoading() {
  const { router } = useRouteAndLiuRouter()

  let s1: number = 0
  let s2: number = 0
  let timeout = 0

  const _beforeEach = async () => {
    timeout = setTimeout(() => {
      timeout = 0
      showGlobalLoading()
    }, DURATION_LOADING)
  }

  router.beforeEach((to, from) => {
    s1 = time.getTime()
    s2 = 0

    // console.log("beforeEach..........")

    _beforeEach()
  })

  router.beforeResolve((to, from) => {
    s2 = time.getTime()
    // console.log("beforeResolve..........")
    // console.log(`耗时: ${s2 - s1}ms`)
    // console.log(" ")

    if(timeout) {
      clearTimeout(timeout)
    }
    else {
      // 去隐藏 loading
      hideGlobalLoading()
    }

    timeout = 0
  })
}