import type { VcState } from "../../vice-content/tools/types"
import { ref, toRef, watch } from "vue"
import type { Ref } from "vue"
import { useWindowSize } from "~/hooks/useVueUse"
import valTool from "~/utils/basic/val-tool"


interface IframeRestrictionProps {
  viceViewPx: number
  vcState: VcState
}

interface IrCtx {
  vcState: VcState
  enable: Ref<boolean>
  show: Ref<boolean>
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
    vcState: vcStateRef.value,
    enable,
    show,
  }

  watch(vcStateRef, (newV) => {
    ctx.vcState = newV
    whenVcStateChange(ctx)
  })

  listenViceViewPx(vvPxRef, irPx)

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
  vvPxRef: Ref<number>,
  irPx: Ref<number>,
) {
  const { width } = useWindowSize()

  const whenVvPxChange = (vvPx: number) => {
    const diff = width.value - vvPx
    irPx.value = Math.max(diff, MIN_IR_PX)
  }
  watch(vvPxRef, (newV) => {
    whenVvPxChange(newV)
  })
  whenVvPxChange(vvPxRef.value)
}

function whenVcStateChange(
  ctx: IrCtx,
) {
  if(ctx.enable.value) return
  if(ctx.vcState !== "iframe") return

  // Todo: 检查缓存

  open(ctx)
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