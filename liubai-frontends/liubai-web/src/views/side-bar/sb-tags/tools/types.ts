
export interface SbTagsData {
  enable: boolean
  everMoved: boolean
  currentTagId: string
  toPath: string
  lastTagChangeStamp: number
}

export interface SbtEmits {
  (event: "aftertap"): void
}