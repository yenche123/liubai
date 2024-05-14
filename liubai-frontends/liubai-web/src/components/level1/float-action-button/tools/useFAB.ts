import { ref, toRef, watch } from "vue"
import type { FabCtx, FabProps } from "./types"
import type { LiuTimeout } from "~/utils/basic/type-tool"

export function useFAB(props: FabProps) {

  const enable = ref(false)
  const show = ref(false)
  const scrollPosition = toRef(props, "scrollPosition")

  const ctx: FabCtx = {
    enable,
    show,
    scrollPosition,
  }
  listenScrollPositionChange(ctx)

  return {
    enable,
    show,
  }
}

function listenScrollPositionChange(
  ctx: FabCtx,
) {

  const { show, enable } = ctx

  const onScroll = (newV: number) => {
    
    if(newV > 500 && !show.value) {
      toOpen(ctx)
    }
    else if(newV < 300 && enable.value) {
      toClose(ctx)
    }
  }

  watch(ctx.scrollPosition, onScroll)
}

let toggleTimeout: LiuTimeout
async function toOpen(ctx: FabCtx) {
  const { show, enable } = ctx
  if(show.value) return
  if(toggleTimeout) {
    clearTimeout(toggleTimeout)
  }
  enable.value = true

  toggleTimeout = setTimeout(() => {
    if(enable.value) show.value = true
  }, 16)
}

async function toClose(ctx: FabCtx) {
  const { show, enable } = ctx
  if(!enable.value) return
  if(toggleTimeout) {
    clearTimeout(toggleTimeout)
  }
  show.value = false

  toggleTimeout = setTimeout(() => {
    if(!show.value) enable.value = false
  }, 310)
}