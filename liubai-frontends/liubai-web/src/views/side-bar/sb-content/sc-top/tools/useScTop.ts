import type { MenuItem } from "~/components/common/liu-menu/tools/types";
import type { ScTopEmits } from "./types"
import { useRouteAndLiuRouter } from "~/routes/liu-router";
import { usePrefix, useMyProfile } from "~/hooks/useCommon";

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
    if(index === 0) link += "setting"
    else if(index === 1) link += "trash"

    rr.router.push(link)
    emits("canclosepopup")
  }

  return {
    prefix,
    myProfile,
    MORE_ITEMS,
    onTapMoreMenuItem,
  }
}