// 当用户进入 "应用内" 时触发
//【待完善】并且 workspaceStore 已经完成初始化时
import { watch, type WatchStopHandle } from "vue"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { SimpleFunc } from "~/utils/basic/type-tool"

// 0: 尚未开始监听
// 1: 正在监听中
// 2: 已经进入了
let status: number = 0
let list: SimpleFunc[] = []
let watchStop: WatchStopHandle

export function useEnterIntoApp(
  fn: SimpleFunc,
  triggerWhileEntered: boolean = true,
) {
  if(status === 2) {
    if(triggerWhileEntered) fn()
    return
  }

  list.push(fn)
  if(status === 1) return
  status = 1
  
  const { route } = useRouteAndLiuRouter()
  watchStop = watch(route, (newV) => {

    const pageName = newV.name
    if(!pageName) return

    const { inApp } = newV.meta
    if(inApp === false) return

    status = 2
    list.forEach(v => {
      v()
    })
    list = []
    watchStop()

  }, { immediate: true })
}