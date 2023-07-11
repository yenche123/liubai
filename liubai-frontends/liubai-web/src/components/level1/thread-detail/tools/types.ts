import type { ThreadShow } from "~/types/types-content"
import type { PageState } from "~/types/types-atom";
import type { WhatDetail } from "~/types/other/types-custom";

export interface TdData {
  state: PageState
  threadShow: ThreadShow | undefined
}

export interface TdProps {
  location: WhatDetail
  threadId: string
  isShowing: boolean
}

export interface TdEmit {
  (evt: "pagestatechange", state: PageState): void
  (evt: "getthreadshow", thread: ThreadShow): void
}

export interface TdCtx {
  id: string
  tdData: TdData
  emit: TdEmit
}
