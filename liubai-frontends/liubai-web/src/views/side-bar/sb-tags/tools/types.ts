
export interface SbTagsData {
  enable: boolean
  everMoved: boolean
  currentTagId: string
  toPath: string
}

export interface SbtEmits {
  (event: "aftertap"): void
}