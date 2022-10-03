import { onMounted, onUnmounted, ref, Ref } from "vue";
import { useLayoutStore, LayoutStore } from "../../useLayoutStore";
import { useWindowSize, useResizeObserver } from "../../../hooks/useVueUse";
import cfg from "../../../config";

const LISTEN_DELAY = 300

interface SidebarData {
  open: Ref<boolean>
  minSidebarPx: Ref<number>
  maxSidebarPx: Ref<number>
  isAnimating: Ref<boolean>
}

export function useSidebar() {

  const layoutStore = useLayoutStore()

  const sidebarEl = ref<HTMLElement | null>(null)

  const open = ref(true)
  const minSidebarPx = ref(cfg.min_sidebar_width)
  const maxSidebarPx = ref(600)
  const isAnimating = ref(false)    // 为 true 时表示正在进行过度动画

  listenUserDrag(sidebarEl, layoutStore)
  listenWindowChange(layoutStore, { open, minSidebarPx, maxSidebarPx, isAnimating })

  return {
    sidebarEl,
    open,
    minSidebarPx,
    maxSidebarPx,
    isAnimating,
  }
}


// 监听用户拖动侧边栏
function listenUserDrag(
  sidebarEl: Ref<HTMLElement | null>,
  layoutStore: LayoutStore
) {
  let lastResizeStamp = 0


  const collectState = () => {
    if(!sidebarEl.value) return
    const newV = sidebarEl.value.offsetWidth
    const oldV = layoutStore.sidebarWidth
    if(newV === oldV) return
    layoutStore.$patch(state => {
      console.log("newV: ", newV)
      state.changeType = "sidebar"
      state.sidebarWidth = newV
    })
  }

  const whenResizeChange = () => {
    if(lastResizeStamp) window.clearTimeout(lastResizeStamp)
    lastResizeStamp = window.setTimeout(() => {
      collectState()
    }, LISTEN_DELAY)
  }

  // console.log("111111111")

  // useResizeObserver(sidebarEl.value, entries => {
  //   console.log("useResizeObserver 监听到发生改变......")
  //   console.log(entries)
  //   whenResizeChange()
  // })

  const rzObserver = new ResizeObserver(entries => {
    whenResizeChange()
  })
  onMounted(() => {
    rzObserver.observe(sidebarEl.value as HTMLElement)
  })
  onUnmounted(() => {
    rzObserver.disconnect()
  })

}

// 监听窗口发生变化
function listenWindowChange(
  layoutStore: LayoutStore,
  sidebarData: SidebarData,
) {

}

// 初始化 sidebar 的宽度
function initSidebar(
  open: Ref<boolean>,
  sidebarPx: Ref<number>,
  minSidebarPx: Ref<number>,
  maxSidebarPx: Ref<number>
) {


}