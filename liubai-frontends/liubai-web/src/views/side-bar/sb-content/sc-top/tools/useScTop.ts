import { storeToRefs } from "pinia";
import { ref, watch } from "vue";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import type { MemberShow } from "~/types/types-content";
import { membersToShows } from "~/utils/other/member-related";

export function useScTop() {
  const memberShow = ref<MemberShow | null>(null)

  const wStore = useWorkspaceStore()
  const { myMember } = storeToRefs(wStore)

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

  return { memberShow }
}