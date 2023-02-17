import { storeToRefs } from "pinia";
import { ref, watch, computed } from "vue";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import type { MemberShow } from "~/types/types-content";
import { membersToShows } from "~/utils/other/member-related";

export function useScTop() {
  const memberShow = ref<MemberShow | null>(null)

  const wStore = useWorkspaceStore()
  const { myMember, isCollaborative, spaceId } = storeToRefs(wStore)

  const whenMemberChange = () => {
    const m = myMember.value
    if(!m) {
      return
    }
    let [tmp] = membersToShows([m])
    memberShow.value = tmp
  }
  watch(myMember, (newV) => {
    whenMemberChange()
  }, { deep: true })
  if(myMember.value) {
    whenMemberChange()
  }

  const prefix = computed(() => {
    const isCo = isCollaborative.value
    if(isCo) return `/w/${spaceId.value}/`
    return `/`
  })

  return {
    prefix,
    memberShow,
  }
}