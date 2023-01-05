import type { ThreadShow } from "~/types/types-content"
import type { RouteAndLiuRouter } from "~/routes/liu-router"
import type { PageState } from "~/types/types-atom";
import type { WhatDetail } from "~/types/other/types-custom";

export interface TdData {
  state: PageState
  threadShow: ThreadShow | undefined
}

export interface TdProps {
  location: WhatDetail
}

export interface ToidCtx {
  thread: ThreadShow
  rr: RouteAndLiuRouter
}