import { computed } from "vue";
import { useRouteAndLiuRouter } from '~/routes/liu-router';
import { useI18n } from 'vue-i18n';
import { usePrefix } from "~/hooks/useCommon"

export function useSbContent() {
  const { t } = useI18n()

  const { route } = useRouteAndLiuRouter()
  const state = computed(() => {
    const n = route.name
    const q = route.query
    if(q.tags === "01") return "tags"
    if(n === "index" || n === "collaborative-index") return "index"
    if(n === "favorite" || n === "collaborative-favorite") return "favorite"
    if(n === "state" || n === "collaborative-state") return "state"
    if(n === "trash" || n === "collaborative-trash") return "trash"
    if(n === "connect" || n === "collaborative-connect") return "connect"
    return ""
  })

  const { prefix } = usePrefix()

  return {
    t,
    state,
    prefix,
  }
}