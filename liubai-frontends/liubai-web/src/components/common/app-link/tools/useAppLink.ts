import { computed } from 'vue'
import { useLink } from 'vue-router'
import { useRouteAndLiuRouter } from '../../../../routes/liu-router'
import valTool from '../../../../utils/basic/val-tool'

export function useAppLink(props: any) {
  const { route: fromRoute, router } = useRouteAndLiuRouter()
  const { navigate, href, route: toRouteRef, isActive, isExactActive } = useLink(props)

  const isExternalLink  = computed(() => {
    const t = props.to
    if(typeof t !== "string") return false
    if(t.startsWith("http")) return true
    return false
  })

  const onTapLink = (e: MouseEvent) => {
    const toRoute = toRouteRef.value

    const frName = fromRoute.name
    const toName = toRoute.name
    const frQuery = fromRoute.query
    const toQuery = toRoute.query
    
    // console.log("frName: ", frName)
    // console.log("toName: ", toName)
    // console.log("frQuery: ", frQuery)
    // console.log("toQuery: ", toQuery)
    // console.log(" ")

    if(toName && frName === toName) {
      const mergedQuery = Object.assign({}, frQuery, toQuery)
      const c1 = valTool.isAIncludedInB(mergedQuery, toQuery)

      // console.log("c1: ", c1)
      
      // 如果 c1 为 ture，表示 mergedQuery 的属性和值都与 toQuery 一致
      // 那么就不用重定向。
      if(!c1) {
        // console.log("阻止默认事件..............")
        // console.log("开始重定向...............")
        // console.log(" ")
        e.preventDefault()
        router.push({ name: toName, query: mergedQuery })
        return
      }
    }
    navigate(e)
  }

  return { isExternalLink, href, isActive, isExactActive, onTapLink }
}