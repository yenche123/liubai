import type { MenuItem } from "~/components/common/liu-menu/tools/types";
import type { ScTopEmits } from "./types"
import { useRouteAndLiuRouter } from "~/routes/liu-router";
import { usePrefix, useMyProfile } from "~/hooks/useCommon";
import cui from "~/components/custom-ui";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import { LocalToCloud } from "~/utils/cloud/LocalToCloud";
import time from "~/utils/basic/time";

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
  const { myProfile } = useMyProfile()
  const { prefix } = usePrefix()

  const onTapMoreMenuItem = (item: MenuItem, index: number) => {
    let link = prefix.value
    if(index === 0) link += "settings"
    else if(index === 1) link += "trash"

    rr.router.push(link)
    emits("canclosepopup")
  }

  const onTapName = async () => {
    const res = await cui.showTextEditor({ 
      title_key: "who_r_u.modify_name", 
      placeholder_key: "who_r_u.modify_name_ph",
      value: myProfile.value?.name,
      maxLength: 20,
    })
    const { confirm, value } = res
    if(!confirm || !value) return
    toModifyName(value)
  }

  return {
    prefix,
    myProfile,
    MORE_ITEMS,
    onTapMoreMenuItem,
    onTapName,
  }
}

async function toModifyName(val: string) {
  const wStore = useWorkspaceStore()
  await wStore.setNickName(val)

  const target_id = wStore.memberId
  if(!target_id) return

  LocalToCloud.addTask({
    uploadTask: "member-nickname",
    target_id,
    operateStamp: time.getTime(),
  }, true)
}