import { computed, onMounted, Ref, ref } from "vue"
import type { SvProps, SvEmits, RefreshState } from "./types"
import valTool from "../../../../utils/basic/val-tool"

const INIT_CONTROL_Y = 0
const REACH_REFRESH = 60
const MAX_DISTANCE = 120

const ANIMATION_MS = 300

export function useRefresh(
  props: SvProps, 
  emits: SvEmits,
  sv: Ref<HTMLElement | null>, 
  scrollTop: Ref<number>
) {

  
  // 是否正在 refreshing
  let isRefreshing = false

  const refreshState = ref<RefreshState>("default")
  const startY = ref(0)
  const distance = ref(INIT_CONTROL_Y)    // “转转”的移动距离

  // 下拉刷新的外部盒子
  const style1 = computed(() => {
    const r = refreshState.value
    if(r === "loading" || r === "loosing") {
      return { 
        transition: `${ANIMATION_MS}ms`, 
        maxHeight: `${distance.value}px`,
        height: `${distance.value}px`,
      }
    }
    return {
      maxHeight: `${distance.value}px`,
      height: `${distance.value}px`,
    }
  })

  // 下拉刷新的 loading 框的 style
  const style2 = computed(() => {
    const opaDiff = REACH_REFRESH < distance.value ? 0 : REACH_REFRESH - distance.value
    const opacityNum = (1 - opaDiff / REACH_REFRESH)
    const r = refreshState.value
    if(r === "loading" || r === "loosing") {
      return {
        transition: `${ANIMATION_MS}ms`, 
        opacity: opacityNum,
      }
    }
    
    return {
      opacity: opacityNum,
    }
  })

  // 下拉刷新 loading 框的 scale
  const loadingScale = computed(() => {
    const diff = REACH_REFRESH < distance.value ? 0 : REACH_REFRESH - distance.value
    let scaleNum = (1 - diff / REACH_REFRESH)
    if(scaleNum < 0.5) scaleNum = 0.5
    return scaleNum
  })

  const onTouchStart = (e: MouseEvent) => {
    if(isRefreshing) return
    const y = e.clientY
    const h = sv.value?.clientHeight ?? 0

    // 要在可划动区域的上 1/3 才采纳
    if(y < h * 0.33) {
      refreshState.value = "pulling"
      startY.value = y
    }
  }

  const onTouchMove = (e: MouseEvent) => {
    if(scrollTop.value > 0 || isRefreshing || startY.value === 0) return
    if(scrollTop.value === 0 && distance.value > INIT_CONTROL_Y) {
      e.cancelable && e.preventDefault()
    }
    const curY = e.clientY
    const initY = startY.value
    const h = curY - initY
    let ratio = 2
    let diff = 0
    if(h < REACH_REFRESH) ratio = 2
    else if(h < 0.5 * MAX_DISTANCE) {
      ratio = 2.5
      diff = 0.1 * REACH_REFRESH
    }
    else if(h < 0.7 * MAX_DISTANCE) {
      ratio = 3
      diff = (0.1 * REACH_REFRESH) + (0.0333 * MAX_DISTANCE)
    }
    else {
      ratio = 4
      diff = (0.1 * REACH_REFRESH) + (0.09161 * MAX_DISTANCE)
    }

    const containerHeight = (curY - startY.value) / ratio + INIT_CONTROL_Y + diff
    distance.value = containerHeight >= MAX_DISTANCE ? MAX_DISTANCE : containerHeight < 0 ? 0 : containerHeight
  }

  const reset = () => {
    isRefreshing = false
    refreshState.value = "default"
    startY.value = 0
  }

  const onTouchEnd = async (e: MouseEvent) => {
    const d = distance.value
    if(isRefreshing || d <= 0) {
      if(startY.value !== 0) startY.value = 0
      if(!isRefreshing && refreshState.value !== "default") {
        refreshState.value = "default"
      }
      return
    }

    isRefreshing = true

    if(d >= REACH_REFRESH) {
      emits("refresh")
      refreshState.value = "loading"
      distance.value = REACH_REFRESH
      await valTool.waitMilli(ANIMATION_MS + 500)
    }
    refreshState.value = "loosing"
    distance.value = 0
    await valTool.waitMilli(ANIMATION_MS + 2)
    reset()
  }

  return {
    style1,
    style2,
    loadingScale,
    onTouchStart,
    onTouchMove,
    onTouchEnd
  }
}