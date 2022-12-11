import { inject, ref, watch } from "vue";
import type { Ref } from "vue";
import { useLayoutStore } from "../../../../views/useLayoutStore";
import type { LayoutStore } from "../../../../views/useLayoutStore";
import { storeToRefs } from "pinia";
import valTool from "../../../../utils/basic/val-tool";
import { svScollingKey } from "../../../../utils/provide-keys";
import sideBar from "../../../../views/side-bar";

const TRANSITION_DURATION = 300

interface NaviAutoCtx {
  enable: Ref<boolean>
  show: Ref<boolean>
  shadow: Ref<boolean>
  scrollTop: Ref<number>
  layout: LayoutStore,
}

export function useNaviAuto() {
  
  const enable = ref(false)
  const show = ref(false)
  const shadow = ref(false)

  // 引入上下文
  const layout = useLayoutStore()
  const scrollTop = inject(svScollingKey, ref(0))

  const ctx = {
    enable,
    show,
    shadow,
    scrollTop,
    layout,
  }


  // 处理 左侧边栏的变化
  const { sidebarWidth, sidebarStatus } = storeToRefs(layout)
  watch([sidebarWidth, sidebarStatus], (newV) => {
    judgeState(ctx)
  })
  judgeState(ctx)

  // 监听滚动，处理是否要显示阴影
  watch(scrollTop, (newV) => {
    if(!enable.value) return
    judgeShadow(newV, shadow)
  })
  

  const onTapMenu = () => {
    console.log("onTapMenu...........")
    sideBar.showFixedSideBar()
  }
  
  return {
    TRANSITION_DURATION,
    enable,
    show,
    shadow,
    onTapMenu,
  }
}

function judgeShadow(
  sT: number,
  shadow: Ref<boolean>
) {
  if(sT >= 40 && !shadow.value) shadow.value = true
  else if(sT <= 20 && shadow.value) shadow.value = false
}


function judgeState(
  ctx: NaviAutoCtx,
) {
  const { sidebarWidth, sidebarStatus } = ctx.layout
  if(sidebarWidth > 0 || sidebarStatus === "window") _close(ctx.enable, ctx.show)
  else _open(ctx.enable, ctx.show)

  // 判断阴影变化
  judgeShadow(ctx.scrollTop.value, ctx.shadow)
}

async function _open(
  enable: Ref<boolean>,
  show: Ref<boolean>,
) {
  if(show.value) return
  enable.value = true
  await valTool.waitMilli(16)
  show.value = true
}

async function _close(
  enable: Ref<boolean>,
  show: Ref<boolean>,
) {
  if(!enable.value) return
  show.value = false
  await valTool.waitMilli(TRANSITION_DURATION)
  enable.value = false
}


