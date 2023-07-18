import type { ParticularScript } from "~/types/types-third-party"
import type { RouteLocationNormalizedLoaded } from "vue-router";
import type { LiuRouter } from "~/routes/liu-router"

export type VcState = "thread" | "comment" | "iframe" | "third" | ""

// iframe vs. third 的区别
//   third: 不是用 iframe 打开的，而是用了 script

export type VcThirdParty = ParticularScript

export interface VcViewAtom {
  state: VcState
  id: string        // thread 时对应 cid
                    // comment 时对应 cid2
                    // iframe 时对应 iframeSrc
                    // third 时对应原链接
  thirdParty?: VcThirdParty    // 只在 state 为 "third" 时有效
  otherData?: Record<string, any>    // 存储一些辅助信息，比如 isYouTube 等等
  show: boolean
}

export interface VcData {
  list: VcViewAtom[]
  currentState: VcState
  currentId: string
}

export interface VcCtx {
  route: RouteLocationNormalizedLoaded
  router: LiuRouter
  vcData: VcData
}

export interface VcProps {
  isOutterDraging: boolean
}