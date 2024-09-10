import { 
  type RouteLocationNormalized, 
  type RouteLocationNormalizedLoaded, 
  useLink,
} from 'vue-router'
import { useRouteAndLiuRouter } from '~/routes/liu-router'
import type { ToRoute } from "~/types"

export interface NaviLinkEmits {
  (event: "aftertap", toRoute: ToRoute): void
}

export function useNaviLink(props: any, emit: NaviLinkEmits) {
  const { route: fromRoute, router } = useRouteAndLiuRouter()
  const { href, route: toRouteRef } = useLink(props)

  const onTapLink = (e: MouseEvent) => {
    const toRoute = toRouteRef.value
    const stacks = router.getStack()

    emit("aftertap", toRoute)

    const num = getNaviBackStackNum(toRoute, fromRoute, stacks)
    // console.log("num: ", num)
    if(num === 0) {
      return
    }
    else if(num > 0) {
      router.go(-num)
      return
    }
    
    router.push(toRoute)
  }

  return { href, onTapLink }
}


// 获取返回多少页面 可以到达 tab 页
// 若没有 则返回 -1
// 若当前页面就是 则返回 0
function getNaviBackStackNum(
  toRoute: ToRoute, 
  fromRoute: RouteLocationNormalizedLoaded,
  stacks: RouteLocationNormalized[],
) {
  if(fromRoute.name === toRoute.name) {
    return 0
  }
  const stackLength = stacks.length
  // console.log(valTool.copyObject(stacks))
  // console.log("stackLength: ", stackLength)

  for(let i = stackLength-1; i >= 0; i--) {
    const curStack = stacks[i]
    if(curStack.name === toRoute.name) {
      return stackLength - (i + 1)
    }
  }
  return -1
}