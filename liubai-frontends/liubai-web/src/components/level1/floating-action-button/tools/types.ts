
import type { Ref } from "vue"

export interface FabProps {
  scrollPosition: number
  considerBottomNaviBar: boolean
}

export interface FabCtx {
  props: FabProps
  enable: Ref<boolean>
  show: Ref<boolean>
  scrollPosition: Ref<number>
}
