import type { SettingContentData } from "./types"
import { getLanguageList } from "./get-list"
import cui from "~/components/custom-ui"
import { useSystemStore } from "~/hooks/stores/useSystemStore"
import liuEnv from "~/utils/liu-env"
import { fetchUserSet } from "./requests"

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

  // 1. set language for local
  const systemStore = useSystemStore()
  systemStore.setLanguage(id)

  // 2. check out if we have backend
  const hasBackend = liuEnv.hasBackend()
  if(!hasBackend) return

  // 3. set language for remote
  const res3 = await fetchUserSet(undefined, id)
  console.log("res3: ")
  console.log(res3)
  console.log(" ")
}