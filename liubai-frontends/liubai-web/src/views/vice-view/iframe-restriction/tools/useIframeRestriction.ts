import type { VcState } from "../../vice-content/tools/types"
import { ref, toRef, watch } from "vue"
import type { Ref } from "vue"
import { useWindowSize } from "~/hooks/useVueUse"
import valTool from "~/utils/basic/val-tool"
import time from "~/utils/basic/time"


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
}

const MIN_IR_PX = 200
const TRANSITION_MS = 300

export function useIframeRestriction(props: IframeRestrictionProps) {

  const enable = ref(false)
  const show = ref(false)
  const irPx = ref(MIN_IR_PX)

  const vcStateRef = toRef(props, "vcState")
  const vvPxRef = toRef(props, "viceViewPx")

  const ctx: IrCtx = {
    vcStateRef,
    enable,
    show,
    irPx,
    vvPxRef,
  }

  watch(vcStateRef, (newV) => {
    whenVcStateChange(ctx)
  })

  listenViceViewPx(ctx)

  const onTapConfirm = () => {

    // TODO: 操作缓存

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
  let lastTimeout = 0
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
      lastTimeout = 0
      whenVvPxChange()
    }, TRANSITION_MS)
  })
  whenVvPxChange()
}

function whenVcStateChange(
  ctx: IrCtx,
) {
  const enable = ctx.enable.value
  if(ctx.vcStateRef.value !== "iframe") {
    if(enable) close(ctx)
    return
  }

  // Todo: 检查缓存

  // 当前 是 iframe 页没错......
  if(!enable) open(ctx)
}

async function open(
  ctx: IrCtx,
) {
  ctx.enable.value = true
  await valTool.waitMilli(16)
  ctx.show.value = true
}

async function close(
  ctx: IrCtx,
) {
  ctx.show.value = false
  await valTool.waitMilli(TRANSITION_MS)
  ctx.enable.value = false
}