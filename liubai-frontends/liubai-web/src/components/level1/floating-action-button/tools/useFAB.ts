import { ref, toRef, watch } from "vue"
import type { FabCtx, FabProps } from "./types"
import type { LiuTimeout } from "~/utils/basic/type-tool"
import { useLayoutStore } from "~/views/useLayoutStore"

export function useFAB(props: FabProps) {

  const enable = ref(false)
  const show = ref(false)
  const scrollPosition = toRef(props, "scrollPosition")

  const ctx: FabCtx = {
    props,
    enable,
    show,
    scrollPosition,
  }
  listenToContext(ctx)

  return {
    enable,
    show,
  }
}

function listenToContext(
  ctx: FabCtx,
) {
  const { show, enable, props, scrollPosition } = ctx
  const layoutStore = useLayoutStore()

  // 0. decide whether open or close as scroll position change
  const _decideOpenOrClose = (sP: number) => {
    if(sP > 500 && !show.value) {
      toOpen(ctx)
    }
    else if(sP < 300 && enable.value) {
      toClose(ctx)
    }
  }

  // 1. listen to scroll position change
  const _onScroll = (newV: number) => {
    if(props.considerBottomNaviBar) {
      if(layoutStore.bottomNaviBar) {
        if(enable.value) {
          toClose(ctx)
        }
        return
      }
    }
    
    _decideOpenOrClose(newV)
  }
  watch(scrollPosition, _onScroll)


  // 2. listen to bottom navigation bar change
  if(!props.considerBottomNaviBar) return
  watch(() => layoutStore.bottomNaviBar, (newV) => {
    if(newV) {
      if(enable.value) {
        toClose(ctx)
      }
      return
    }
    
    const sP = scrollPosition.value
    _decideOpenOrClose(sP)
  })
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