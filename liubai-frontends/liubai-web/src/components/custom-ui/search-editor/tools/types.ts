import type {
  ScContentAtom,
  ScRecentAtom,
  ScThirdPartyAtom,
  ScThirdPartyType,
  ScMode,
} from "~/utils/controllers/search-controller/types"
import type {
  InjectionKey,
  Ref,
} from "vue"

export type ThirdPartyType = ScThirdPartyType

export type SearchListType = "suggest" | "recent" | "results" | "third_party"

export interface SearchEditorData {
  reloadNum: number
  mode: ScMode
  inputTxt: string
  nativeInputTxt: string
  trimTxt: string
  excludeThreads: string[]
  indicator: string               // 指示器，表示现在选中的是哪一个
  suggestList: ScContentAtom[]   // 建议的结果
  recentList: ScRecentAtom[]     // 最近的关键词
  thirdList: ScThirdPartyAtom[]  // 第三方
  innerList: ScContentAtom[]     // 搜索结果
}

export interface SearchEditorParam {
  type: ScMode
  initText?: string
  excludeThreads?: string[]
}

export interface SearchEditorRes {
  action: "confirm" | "cancel"
  threadId?: string
  commentId?: string
  atomId?: string
}

export type SeResolver = (res: SearchEditorRes) => void


export interface SearchFuncs {
  mouseenteritem: (newIndicator: string) => void
  tapitem: (listType: SearchListType, atomId: string) => void
  clearitem: (listType: SearchListType, atomId: string) => void
}

export const searchFuncsKey = Symbol() as InjectionKey<SearchFuncs>

export interface SeKeyboardParam {
  whenOpen: (param: SearchEditorParam) => Promise<SearchEditorRes>
  seData: SearchEditorData
  tranMs: number
  show: Ref<boolean>
}