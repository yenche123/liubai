
import type { Ref } from "vue"

export interface FabProps {
  scrollPosition: number
}

export interface FabCtx {
  enable: Ref<boolean>
  show: Ref<boolean>
  scrollPosition: Ref<number>
}
