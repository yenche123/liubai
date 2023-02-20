import type {
  SearchOpt,
  ScRecentAtom,
} from "./types"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import time from "~/utils/basic/time"
import memberRelated from "~/utils/system/member-related"

export function searchRecent(param: SearchOpt) {
  const wStore = useWorkspaceStore()
  const tmpList = wStore.myMember?.config?.searchKeywords ?? []
  const now = time.getTime()
  let list: ScRecentAtom[] = tmpList.map((v, i) => {
    const atomId = `recent_${now + i}`
    return {
      atomId,
      title: v,
    }
  })
  list = list.filter(v => Boolean(v.title))

  return list
}

export async function addKeywordToRecent(text: string) {
  if(!text) return true
  const wStore = useWorkspaceStore()
  const memberCfg = wStore.myMember?.config ?? memberRelated.getDefaultMemberCfg()
  const { searchKeywords } = memberCfg
  const idx = searchKeywords.indexOf(text)
  if(idx >= 0) {
    searchKeywords.splice(idx, 1)
  }
  searchKeywords.unshift(text)
  if(searchKeywords.length > 10) {
    searchKeywords.pop()
  }
  memberCfg.searchKeywords = searchKeywords
  const res = await wStore.setMemberConfig(memberCfg)
  return res
}