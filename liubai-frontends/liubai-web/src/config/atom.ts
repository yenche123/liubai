
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