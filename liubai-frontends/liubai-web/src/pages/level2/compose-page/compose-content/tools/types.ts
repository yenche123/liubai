import { ShallowRef } from "vue";
import type { RouteAndLiuRouter } from "~/routes/liu-router";
import type { ComposingData, PageState } from "~/types/types-atom";

export interface CcData {
  pageState: PageState
  chatId?: string
}

export interface CcContext {
  ccData: CcData
  rr: RouteAndLiuRouter
  composingDataRef: ShallowRef<ComposingData | undefined>
}