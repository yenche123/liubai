import { RouteLocation, RouteLocationNormalized, RouteLocationNormalizedLoaded, useLink } from 'vue-router'
import { useRouteAndLiuRouter } from '../../../../routes/liu-router'

type ToRoute = RouteLocation & { href: string }

export function useNaviLink(props: any) {
  const { route: fromRoute, router } = useRouteAndLiuRouter()
  const { href, route: toRouteRef } = useLink(props)

  const onTapLink = (e: MouseEvent) => {
    const toRoute = toRouteRef.value
    const stacks = router.getStack()
    e.preventDefault()

    const num = getNaviBackStackNum(toRoute, fromRoute, stacks)
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
  if(fromRoute.name === toRoute.name) return 0
  const stackLength = stacks.length
  for(let i = stackLength-1; i >= 0; i--) {
    const curStack = stacks[i]
    if(curStack.name === toRoute.name) {
      return stackLength - (i + 1)
    }
  }
  return -1
}