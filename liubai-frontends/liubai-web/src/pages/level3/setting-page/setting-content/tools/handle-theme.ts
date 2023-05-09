import type { SettingContentData } from "./types"
import type { SupportedTheme } from "~/types"
import localCache from "~/utils/system/local-cache"
import { getThemeList } from "./get-list"
import cui from "~/components/custom-ui"
import liuApi from "~/utils/liu-api"
import { useDynamics } from "~/hooks/useDynamics"
import type { UseDynamicsType } from "~/hooks/useDynamics"
import { useWindowSize } from "~/hooks/useVueUse"
import valTool from "~/utils/basic/val-tool"

export async function whenTapTheme(
  data: SettingContentData
) {
  const list = getThemeList()
  const itemList = list.map(v => {
    return {
      text: v.text,
      iconName: v.iconName,
    }
  })

  const res = await cui.showActionSheet({ itemList })
  if(res.result !== "option" || res.tapIndex === undefined) return
  const item = list[res.tapIndex]  
  const id = item.id

  // 0. 判断是否跟原来的选择一致
  if(id === data.theme) return
  
  // 1. 切换到新的主题选择（包括切换到自动或跟随系统）
  data.theme = id
  localCache.setLocalPreference("theme", id)


  // 2. 判断视觉主题是否要做更换，比如当前时间是晚上，原本是自动（日夜切换）
  //    现在切换到 dark 主题，那么视觉上就无需变化。
  let newTheme: SupportedTheme
  if(id === "dark" || id === "light") {
    newTheme = id
  }
  else if(id === "auto") {
    newTheme = liuApi.getThemeFromTime()
  }
  else {
    newTheme = liuApi.getThemeFromSystem()
  }
  const dyn = useDynamics()
  const oldTheme = dyn.theme.value
  if(oldTheme === newTheme) {
    return
  }

  toSetTheme(dyn, newTheme)
}

async function toSetTheme(
  dyn: UseDynamicsType,
  theme: SupportedTheme,
) {

  const isDark = theme === "dark"

  // @ts-expect-error: Transition API
  const isAppearanceTransition: boolean = document.startViewTransition && 
    !liuApi.isPrefersReducedMotion()

  // 不使用 View Transition API
  if(!isAppearanceTransition) {
    dyn.setTheme(theme)
    return
  }

  // 去使用 View Transition API
  // 先等待若干毫秒，让 弹窗关闭
  await valTool.waitMilli(222)

  const { width, height } = useWindowSize()
  const x = width.value / 2
  const y = height.value / 2
  const radius = Math.hypot(x, y)

  // @ts-expect-error: Transition API
  const transition = document.startViewTransition(() => {
    dyn.setTheme(theme)
  })

  const whenTransitionReady = () => {
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${radius}px at ${x}px ${y}px)`,
    ]
    document.documentElement.animate(
      {
        clipPath: isDark ? clipPath : [...clipPath].reverse(),
      },
      {
        duration: 300,
        easing: 'ease-in',
        pseudoElement: isDark ? '::view-transition-new(root)' : '::view-transition-old(root)',
      },
    )
    // console.log("document.documentElement.animate just now.........")
  }

  transition.ready.then(() => {
    // console.log("transition.ready.then...............")
    whenTransitionReady()
  })

  // console.time("finished")
  transition.finished.then(() => {
    // console.log("transition.finished.then...............")
    // console.timeEnd("finished")
  })

  transition.updateCallbackDone.then(() => {
    // console.log("transition.updateCallbackDone.then...............")
  })

}

