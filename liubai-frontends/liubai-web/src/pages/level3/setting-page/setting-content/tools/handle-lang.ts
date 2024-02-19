import type { SettingContentData } from "./types"
import { getLanguageList } from "./get-list"
import cui from "~/components/custom-ui"
import { useSystemStore } from "~/hooks/stores/useSystemStore"

export async function whenTapLanguage(
  data: SettingContentData
) {

  const list = getLanguageList()
  const itemList = list.map(v => ({ text: v.text }))

  const res = await cui.showActionSheet({ itemList })
  if(res.result !== "option" || res.tapIndex === undefined) return

  const item = list[res.tapIndex]
  const id = item.id
  if(id === data.language) return

  const systemStore = useSystemStore()
  systemStore.setLanguage(id)
}