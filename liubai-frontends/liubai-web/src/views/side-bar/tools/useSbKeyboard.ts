import { useWindowSize } from "~/hooks/useVueUse"
import type { LayoutStore } from "../../useLayoutStore"
import { storeToRefs } from "pinia"
import { onMounted, onUnmounted } from "vue"
import liuApi from "~/utils/liu-api"
import cfg from "~/config"
import { SbData } from "./types"
import type { SimpleFunc } from "~/utils/basic/type-tool"
import time from "~/utils/basic/time"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import liuUtil from "~/utils/liu-util"

export function useSbKeyboard(
  layout: LayoutStore,
  sbData: SbData,
  handleOpen: SimpleFunc,
  handleClose: SimpleFunc,
  LISTEN_DELAY: number,        // 防抖节流的阈值毫秒数
) {
  
  const { route } = useRouteAndLiuRouter()
  const { sidebarStatus, sidebarWidth } = storeToRefs(layout)
  const { width } = useWindowSize()

  let lastTrigger = 0
  const cha = liuApi.getCharacteristic()
  const isMac = cha.isMac


  const _judge = () => {
    if(sidebarStatus.value === "fullscreen") {
      // 去关闭全屏
      layout.$patch({ sidebarStatus: "default" })
      return
    }

    if(sbData.openType === "closed_by_user") {
      // 去打开侧边栏
      handleOpen()
      return
    }

    if(sbData.openType === "opened") {
      // 去关闭侧边栏
      handleClose()
      return
    }

  }

  const _whenKeyDown = (e: KeyboardEvent) => {
    if(width.value <= cfg.sidebar_close_point) return
    const ctrlPressed = isMac ? e.metaKey : e.ctrlKey
    const key = e.key?.toLowerCase()

    if(ctrlPressed && key === "\\") {

      // 判断是否有 popup 显示中，若有则忽略
      const isInPopup = liuUtil.isInAPopUp(route)
      if(isInPopup) {
        return
      }

      const now = time.getTime()
      const diff = now - lastTrigger
      if(diff < LISTEN_DELAY) return
      lastTrigger = now

      e.preventDefault()
      _judge()
    }
  }

  onMounted(() => {
    window.addEventListener("keydown", _whenKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener("keydown", _whenKeyDown)
  })
}