
import type { LiuRemindLater, LiuRemindEarly } from "../types/types-atom"

export const REMIND_LATER: Array<LiuRemindLater | "other"> = [
  "30min",
  "1hr",
  "2hr",
  "3hr",
  "tomorrow_this_moment",
  "other"
]

export const REMIND_EARLY: LiuRemindEarly[] = [0, 10, 30, 60, 1440]

export const ALLOW_DEEP_TYPES = [
  "orderedList", 
  "bulletList", 
  "listItem", 
  "blockquote",
  "taskList",
  "taskItem",
]

// 各个 popup 弹窗的 route.query 上的 key
export const POPUP_KEYS = [
  "commentpopup",
  "contentpanel",
  "hashtageditor",
  "htselector",
  "previewimage",
  "search",
  "q",
  "shareview",
  "stateeditor",
  "stateselector",
]