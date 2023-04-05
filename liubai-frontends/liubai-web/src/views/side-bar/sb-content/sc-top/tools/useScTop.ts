import { storeToRefs } from "pinia";
import { ref, watch, computed } from "vue";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import type { MemberShow } from "~/types/types-content";
import { membersToShows } from "~/utils/other/member-related";
import type { MenuItem } from "~/components/common/liu-menu/tools/types";
import type { ScTopEmits } from "./types"
import { useRouteAndLiuRouter } from "~/routes/liu-router";
import { useLiuWatch } from "~/hooks/useLiuWatch"

const MORE_ITEMS: MenuItem[] = [
  {
    text_key: "common.setting",
    iconName: "setting"
  },
  {
    text_key: "common.trash",
    iconName: "delete_400"
  }
]

export function useScTop(emits: ScTopEmits) {
  const rr = useRouteAndLiuRouter()
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
  useLiuWatch(myMember, whenMemberChange, true)

  const prefix = computed(() => {
    const isCo = isCollaborative.value
    if(isCo) return `/w/${spaceId.value}/`
    return `/`
  })

  const onTapMoreMenuItem = (item: MenuItem, index: number) => {
    let link = prefix.value
    if(index === 0) link += "setting"
    else if(index === 1) link += "trash"

    rr.router.push(link)
    emits("canclosepopup")
  }


  return {
    prefix,
    memberShow,
    MORE_ITEMS,
    onTapMoreMenuItem,
  }
}