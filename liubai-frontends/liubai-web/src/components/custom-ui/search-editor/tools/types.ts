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
  threadId?: string
  commentId?: string
}

export type SeResolver = (res: SearchEditorRes) => void