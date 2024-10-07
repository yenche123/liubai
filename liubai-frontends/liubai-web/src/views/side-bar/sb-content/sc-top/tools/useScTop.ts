import type { MenuItem } from "~/components/common/liu-menu/tools/types";
import type { ScTopEmits } from "./types"
import { useRouteAndLiuRouter } from "~/routes/liu-router";
import { usePrefix, useMyProfile } from "~/hooks/useCommon";
import cui from "~/components/custom-ui";
import middleBridge from "~/utils/middle-bridge";

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
  const { myProfile, isPremium } = useMyProfile()
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
    middleBridge.modifyMemberNickname(value)
  }

  const onTapAvatar = () => {

  }

  return {
    prefix,
    myProfile,
    isPremium,
    MORE_ITEMS,
    onTapMoreMenuItem,
    onTapName,
    onTapAvatar,
  }
}

