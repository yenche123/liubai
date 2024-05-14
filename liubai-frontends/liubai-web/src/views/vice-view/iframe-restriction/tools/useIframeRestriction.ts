import type { VcState } from "../../vice-content/tools/types"
import { ref, toRef, watch, type Ref } from "vue"
import { useWindowSize } from "~/hooks/useVueUse"
import localCache from "~/utils/system/local-cache"
import time from "~/utils/basic/time"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { RouteLocationNormalizedLoaded } from "vue-router"
import type { LiuTimeout } from "~/utils/basic/type-tool"
import liuUtil from "~/utils/liu-util"

interface IframeRestrictionProps {
  viceViewPx: number
  vcState: VcState
}

interface IrCtx {
  vcStateRef: Ref<VcState>
  enable: Ref<boolean>
  show: Ref<boolean>
  irPx: Ref<number>
  vvPxRef: Ref<number>
  route: RouteLocationNormalizedLoaded
}

const MIN_IR_PX = 200
const TRANSITION_MS = 300

export function useIframeRestriction(props: IframeRestrictionProps) {

  const enable = ref(false)
  const show = ref(false)
  const irPx = ref(MIN_IR_PX)

  const vcStateRef = toRef(props, "vcState")
  const vvPxRef = toRef(props, "viceViewPx")
  const { route } = useRouteAndLiuRouter()

  const ctx: IrCtx = {
    vcStateRef,
    enable,
    show,
    irPx,
    vvPxRef,
    route,
  }

  watch(vcStateRef, (newV) => {
    whenVcStateChange(ctx)
  })

  listenViceViewPx(ctx)

  const onTapConfirm = () => {

    // TODO: 操作缓存
    localCache.setOnceData("iframeRestriction", time.getTime())

    close(ctx)
  }

  return {
    enable,
    show,
    irPx,
    onTapConfirm,
  }
}

// 监听 viceViewPx 的变化，去响应 irPx 的变化
function listenViceViewPx(
  ctx: IrCtx,
) {
  let lastTimeout: LiuTimeout
  const { width } = useWindowSize()
  const { vvPxRef, vcStateRef, enable } = ctx

  const whenVvPxChange = () => {
    const diff = width.value - ctx.vvPxRef.value
    ctx.irPx.value = Math.max(diff, MIN_IR_PX)
  }

  watch([vvPxRef, vcStateRef, width, enable], (
    [newV1, newV2, newV3, newV4]
  ) => {
    if(!newV4) return
    if(newV2 !== "iframe") return
    if(lastTimeout) clearTimeout(lastTimeout)
    lastTimeout = setTimeout(() => {
      lastTimeout = undefined
      whenVvPxChange()
    }, TRANSITION_MS)
  })
  whenVvPxChange()
}

function whenVcStateChange(
  ctx: IrCtx,
) {
  const enable = ctx.enable.value
  const show = ctx.show.value
  const { 
    isOpening, 
    isClosing,
  } = liuUtil.view.getOpeningClosing(enable, show)
  const vcState = ctx.vcStateRef.value
  const pdfQuery = ctx.route.query?.vfile

  // 如果当前不是 iframe 或当前为文件（比如 pdf）预览
  if(vcState !== "iframe" || pdfQuery) {
    if(!isClosing) close(ctx)
    return
  }

  // 检查缓存
  const res = localCache.getOnceData()
  if(res.iframeRestriction) return

  // 当前 是 iframe 页并且不是开启的状态
  if(!isOpening) open(ctx)
}

let toggleTimeout: LiuTimeout
async function open(
  ctx: IrCtx,
) {
  if(ctx.show.value) return
  if(toggleTimeout) {
    clearTimeout(toggleTimeout)
  }
  ctx.enable.value = true

  toggleTimeout = setTimeout(() => {
    ctx.show.value = true
  }, 16)
}

async function close(
  ctx: IrCtx,
) {
  if(!ctx.enable.value) return
  if(toggleTimeout) {
    clearTimeout(toggleTimeout)
  }
  ctx.show.value = false

  toggleTimeout = setTimeout(() => {
    ctx.enable.value = false
  }, TRANSITION_MS)
}