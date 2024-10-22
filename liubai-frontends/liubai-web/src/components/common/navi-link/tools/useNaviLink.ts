import { useLink } from 'vue-router'
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
    router.switchTab(toRoute, fromRoute)
    emit("aftertap", toRoute)
  }

  return { href, onTapLink }
}