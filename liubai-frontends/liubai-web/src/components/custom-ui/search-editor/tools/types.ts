import type {
  ScContentAtom,
  ScRecentAtom,
  ScThirdPartyAtom,
  ScMode,
} from "~/utils/controllers/search-controller/types"


export interface SearchEditorData {
  mode: ScMode
  inputTxt: string
  trimTxt: string
  excludeThreads: string[]
  indicator: string               // 指示器，表示现在选中的是哪一个
  suggestList: ScContentAtom[]
  recentList: ScRecentAtom[]
  thirdList: ScThirdPartyAtom[]
  innerList: ScContentAtom[]
}

export interface SearchEditorParam {
  type: ScMode
  initText?: ""
  excludeThreads?: string[]

}

export interface SearchEditorRes {
  action: "confirm" | "cancel"
  areaType: "suggestion" | "third_party" | "inner"
  threadId?: string      // 当 action 为 "confirm" 并且 areaType 为 "inner" 时【必有值】
  commentId?: string
}

export type SeResolver = (res: SearchEditorRes) => void