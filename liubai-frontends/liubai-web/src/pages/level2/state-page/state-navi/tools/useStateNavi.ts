import { toRef, watch, ref, onMounted, nextTick, shallowRef } from "vue";
import type { Ref, ShallowRef } from "vue";
import type { StateWhichPage, SnIndicatorData } from "../../tools/types";
import { useRouteAndLiuRouter } from "~/routes/liu-router";
import valTool from "~/utils/basic/val-tool";
import { useInjectSnIndicator } from "../../tools/useSnIndicator"
import { useI18n } from "vue-i18n";

interface SnProps {
  whichPage: StateWhichPage
}

interface SnCtx {
  whichPage: StateWhichPage
  _indicatorData: ShallowRef<SnIndicatorData>
  indicatorParentEl: Ref<HTMLElement | null>
  indiListEl: Ref<HTMLElement | null>
  indiKanbanEl: Ref<HTMLElement | null>
}

export function useStateNavi(props: SnProps) {

  const _indicatorData = useInjectSnIndicator()

  const indicatorParentEl = ref<HTMLElement | null>(null)
  const indiListEl = ref<HTMLElement | null>(null)
  const indiKanbanEl = ref<HTMLElement | null>(null)

  const whichPage = toRef(props, "whichPage")
  const { t, locale } = useI18n()

  const ctx: SnCtx = {
    _indicatorData,
    indicatorParentEl,
    indiListEl,
    indiKanbanEl,
    whichPage: whichPage.value,
  }

  watch([whichPage, locale], ([newV1, newV2]) => {
    ctx.whichPage = newV1
    whenWhichPageChange(ctx)
  })

  onMounted(() => {
    ctx.whichPage = whichPage.value
    whenWhichPageChange(ctx)
  })

  const { router } = useRouteAndLiuRouter()
  const onTapBack = () => {
    router.naviBack()
  }

  return {
    t,
    indicatorParentEl,
    indiListEl,
    indiKanbanEl,
    onTapBack,
  }
}

async function whenWhichPageChange(
  ctx: SnCtx,
) {

  // await valTool.waitMilli(16)
  await nextTick()

  const parentEl = ctx.indicatorParentEl.value
  if(!parentEl) return
  if(ctx.whichPage < 1) return

  const childRef = ctx.whichPage === 1 ? ctx.indiListEl : ctx.indiKanbanEl
  
  const childEl = childRef.value
  if(!childEl) return

  const parentClient = parentEl.getBoundingClientRect()
  const childClient = childEl.getBoundingClientRect()

  if(!parentClient.width || !parentClient.height) return

  const left = childClient.left - parentClient.left
  const width = childClient.width

  console.log("left: ", left)
  console.log("width: ", width)
  console.log(" ")

  ctx._indicatorData.value = {
    left: `${left}px`,
    width: `${width}px`
  }
}