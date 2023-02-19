import type {
  SearchOpt,
  ScRecentAtom,
} from "./types"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import time from "~/utils/basic/time"
import { MemberConfig } from "~/types/other/types-custom"

export function searchRecent(param: SearchOpt) {
  const wStore = useWorkspaceStore()
  const tmpList = wStore.myMember?.config?.searchKeywords ?? []
  const now = time.getTime()
  const list: ScRecentAtom[] = tmpList.map((v, i) => {
    const atomId = `recent_${now + i}`
    return {
      atomId,
      title: v,
    }
  })

  return list
}

export function addKeyword(text: string) {
  const wStore = useWorkspaceStore()
  const memberCfg: MemberConfig = wStore.myMember?.config ?? { searchKeywords: [] }

}