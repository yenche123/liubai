import { onMounted, onUnmounted, ref, Ref, watch } from "vue";
import { useLayoutStore, LayoutStore } from "../../useLayoutStore";
import { useWindowSize, useResizeObserver } from "../../../hooks/useVueUse";
import cfg from "../../../config";

const LISTEN_DELAY = 300


type OpenType = "closed_by_user" | "closed_by_auto" | "open"

interface SidebarData {
  open: Ref<OpenType>
  minSidebarPx: Ref<number>
  maxSidebarPx: Ref<number>
  isAnimating: Ref<boolean>
}

export function useSidebar() {

  const layoutStore = useLayoutStore()

  const sidebarEl = ref<HTMLElement | null>(null)

  const open = ref<OpenType>("open")
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
  let lastResizeTimeout = 0

  const collectState = () => {
    if(!sidebarEl.value) return
    const newV = sidebarEl.value.offsetWidth
    const oldV = layoutStore.sidebarWidth
    if(newV === oldV) return
    layoutStore.$patch(state => {
      state.changeType = "sidebar"
      state.sidebarWidth = newV
    })
  }

  const whenResizeChange = () => {
    if(lastResizeTimeout) window.clearTimeout(lastResizeTimeout)
    lastResizeTimeout = window.setTimeout(() => {
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
  const { width } = useWindowSize()
  let lastWindowTimeout = 0

  const collectState = () => {
    
    const newV = width.value
    const oldV = layoutStore.clientWidth
    if(newV === oldV) return
    let curSidebarPx = layoutStore.sidebarWidth
    let curOpen = sidebarData.open

    // 如果用户已选择关闭侧边栏时
    if(curOpen.value === "closed_by_user") {
      layoutStore.$patch(state => {
        state.changeType = "window"
        state.clientWidth = newV
      })
      return
    }

    // 如果是自动关闭侧边栏时
    if(curOpen.value === "closed_by_auto") {

    }
    
  }

  const whenWindowChange = () => {
    if(lastWindowTimeout) clearTimeout(lastWindowTimeout)
    lastWindowTimeout = window.setTimeout(() => {
      collectState()
    }, LISTEN_DELAY)
  }

  // watch 挂在 setup 周期内 所以不需要在 onUnmounted 手写销毁，vue 会自动完成
  watch(width, (newV, oldV) => {
    whenWindowChange()
  })
}

// 初始化 sidebar 的宽度
function initSidebar(
  open: Ref<boolean>,
  sidebarPx: Ref<number>,
  minSidebarPx: Ref<number>,
  maxSidebarPx: Ref<number>
) {


}