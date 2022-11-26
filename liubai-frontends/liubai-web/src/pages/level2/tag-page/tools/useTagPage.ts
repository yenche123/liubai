import { computed, onActivated, onDeactivated, Ref, ref, watch } from "vue";
import { useRouteAndLiuRouter } from "../../../../routes/liu-router";
import type { RouteLocationNormalizedLoaded } from "vue-router";


let isActivated = false

export function useTagPage() {

  const tagName = ref("")
  const { route } = useRouteAndLiuRouter()
  watch(() => route, (newV) => {
    judgeTagName(tagName, route)
  })
  judgeTagName(tagName, route)
  
  return { tagName }
}


function judgeTagName(
  tagName: Ref<string>,
  route: RouteLocationNormalizedLoaded,
) {
  if(!route) return
  const n = route.name
  if(!n) return
  if(n !== "tag" && n !== "collaborative-tag") return


  
  console.log("judgeTagName...........")

  

}