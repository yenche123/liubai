import { computed } from "vue";
import { useRouteAndLiuRouter } from '~/routes/liu-router';
import { useI18n } from 'vue-i18n';
import { usePrefix } from "~/hooks/useCommon"
import liuEnv from "~/utils/liu-env";

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
    if(n === "connectors" || n === "collaborative-connectors") return "connect"
    if(n === "schedule" || n === "collaborative-schedule") return "schedule"
    return ""
  })

  const { prefix } = usePrefix()
  const { CONNECTORS } = liuEnv.getEnv()

  return {
    t,
    state,
    prefix,
    CONNECTORS,
  }
}