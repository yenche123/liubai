import { toRef, watch, ref, onMounted, nextTick, inject } from "vue";
import type { Ref, ShallowRef } from "vue";
import type { StateWhichPage, SnIndicatorData } from "../../tools/types";
import { stateProvideKey } from "../../tools/types";
import { useRouteAndLiuRouter } from "~/routes/liu-router";
import { useInjectSnIndicator } from "../../tools/useSnIndicator"
import { useI18n } from "vue-i18n";
import { useWindowSize } from "~/hooks/useVueUse"
import liuUtil from "~/utils/liu-util";

interface SnProps {
  current: StateWhichPage
  indicatorData: SnIndicatorData
  pageIn: StateWhichPage
}

interface SnCtx {
  whichPage: StateWhichPage
  pageIn: StateWhichPage
  _indicatorData: ShallowRef<SnIndicatorData>
  indicatorParentEl: Ref<HTMLElement | null>
  indiListEl: Ref<HTMLElement | null>
  indiKanbanEl: Ref<HTMLElement | null>
  innerCurrent: Ref<StateWhichPage>
}

export function useStateNavi(
  props: SnProps
) {

  const _indicatorData = useInjectSnIndicator()

  const indicatorParentEl = ref<HTMLElement | null>(null)
  const indiListEl = ref<HTMLElement | null>(null)
  const indiKanbanEl = ref<HTMLElement | null>(null)

  const whichPage = toRef(props, "current")
  const innerCurrent = ref(whichPage.value)
  const pageIn = toRef(props, "pageIn")
  const { t, locale } = useI18n()

  const ctx: SnCtx = {
    _indicatorData,
    indicatorParentEl,
    indiListEl,
    indiKanbanEl,
    whichPage: whichPage.value,
    pageIn: pageIn.value,
    innerCurrent,
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

  const stateProvideData = inject(stateProvideKey)

  listenWindowWidthChange(ctx)

  // 点击 "刷新"
  const reloadRotateDeg = ref(0)
  const onTapReload = () => {
    if(!liuUtil.canTap()) return
    stateProvideData?.tapreload()
    reloadRotateDeg.value += 360
  }


  const onTapAddState = () => {
    if(!liuUtil.canTap()) return
    stateProvideData?.tapaddstate()
  }
  
  return {
    t,
    reloadRotateDeg,
    indicatorParentEl,
    indiListEl,
    indiKanbanEl,
    onTapBack,
    onTapReload,
    onTapAddState,
    stateProvideData,
    innerCurrent,
  }
}


function listenWindowWidthChange(
  ctx: SnCtx
) {
  const { width } = useWindowSize()
  let lastWidthPx = width.value

  const critialPoint = 355

  watch(width, (newV) => {
    let needChange = false
    if(newV <= critialPoint && lastWidthPx > critialPoint) needChange = true
    else if(newV > critialPoint && lastWidthPx <= critialPoint) needChange = true

    if(!needChange) return
    lastWidthPx = newV
    if(ctx.whichPage !== ctx.pageIn) return
    whenWhichPageChange(ctx)
  })
}

async function whenWhichPageChange(
  ctx: SnCtx,
) {

  await nextTick()

  const parentEl = ctx.indicatorParentEl.value
  if(!parentEl) return
  if(ctx.whichPage < 1) return

  const oldInnerCurrent = ctx.innerCurrent.value
  if(oldInnerCurrent !== ctx.whichPage) {
    await liuUtil.waitAFrame()
    ctx.innerCurrent.value = ctx.whichPage
  }

  const childRef = ctx.whichPage === 1 ? ctx.indiListEl : ctx.indiKanbanEl
  
  const childEl = childRef.value
  if(!childEl) return

  const info = liuUtil.getIndicatorLeftAndWidth(parentEl, childEl)
  if(!info) return
  ctx._indicatorData.value = info
}