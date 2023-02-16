import { computed } from "vue";
import { useRouteAndLiuRouter } from '~/routes/liu-router';
import { useI18n } from 'vue-i18n';
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import { storeToRefs } from "pinia";

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

  const wStore = useWorkspaceStore()
  const { isCollaborative, spaceId } = storeToRefs(wStore)
  const prefix = computed(() => {
    const isCo = isCollaborative.value
    if(isCo) return `/w/${spaceId.value}/`
    return `/`
  })

  return {
    t,
    state,
    prefix,
  }
}