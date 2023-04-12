import { ref, toRef, watch } from "vue"
import valTool from "~/utils/basic/val-tool"
import type { FabCtx, FabProps } from "./types"

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

async function toOpen(ctx: FabCtx) {
  const { show, enable } = ctx
  if(show.value) return
  enable.value = true
  await valTool.waitMilli(16)
  if(enable.value) show.value = true
}

async function toClose(ctx: FabCtx) {
  const { show, enable } = ctx
  if(!enable.value) return
  show.value = false
  await valTool.waitMilli(310)
  if(!show.value) enable.value = false
}