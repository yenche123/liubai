import { useSystemStore } from "~/hooks/stores/useSystemStore"
import { getFontSizeList } from "./get-list"
import type { SettingContentData } from "./types"
import cui from "~/components/custom-ui"

export async function whenTapFontSize(
  data: SettingContentData
) {

  const list = getFontSizeList()
  const itemList = list.map(v => {
    return {
      text: v.text,
      iconName: v.iconName,
    }
  })

  const res = await cui.showActionSheet({ itemList })
  if(res.result !== "option" || res.tapIndex === undefined) return
  const item = list[res.tapIndex]  
  const id = item.id

  // 0. 判断是否跟原来的选择一致
  const oldFs = data.fontSize
  if(id === oldFs) return

  // 1. set theme for local
  const systemStore = useSystemStore()
  systemStore.setFontSize(id)
}