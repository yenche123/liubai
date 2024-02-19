import type { SettingContentData } from "./types"
import type { SupportedTheme } from "~/types/types-atom"
import { getThemeList } from "./get-list"
import cui from "~/components/custom-ui"
import liuApi from "~/utils/liu-api"
import { useWindowSize } from "~/hooks/useVueUse"
import valTool from "~/utils/basic/val-tool"
import { transitionHelper } from "~/utils/other/transition-related"
import { useSystemStore, type UseSystemType } from "~/hooks/stores/useSystemStore"

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
  

  console.log("用新的方法设置啦........")
  const systemStore = useSystemStore()
  systemStore.setTheme(id)
}


/** Exprimental: View Transition */
async function toSetTheme(
  systemStore: UseSystemType,
  theme: SupportedTheme,
) {

  const isDark = theme === "dark"
  const isAppearanceTransition = liuApi.canIUse.viewTransitionApi()

  // 不使用 View Transition API
  if(!isAppearanceTransition) {
    systemStore.setTheme(theme)
    return
  }

  // 去使用 View Transition API
  // 先等待若干毫秒，让 弹窗关闭
  await valTool.waitMilli(222)

  const { width, height } = useWindowSize()
  const x = width.value / 2
  const y = height.value / 2
  const radius = Math.hypot(x, y)

  // 以下用: I II III IV V 标注执行顺序

  // I. 浏览器已记录 old page 的快照后，触发 startViewTransition 的回调
  // 这个回调会返回一个 promise 所以可以在当中执行 await 
  // 注意，这个函数里更改的 DOM 状态，会马上在 DOM 上响应
  // 只是被伪元素 ::view-transition 挡住了，所以用户才会错觉成界面上展示的还是旧的 DOM
  const updateDOM = async () => {
    console.log("updateDOM........")
    systemStore.setTheme(theme)
  }
  const transition = transitionHelper({ updateDOM, classNames: "liu-switching-theme" })

  // III.
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

  // III. 准备开始执行动画
  transition.ready.then(() => {
    console.log("transition.ready.then...............")
    whenTransitionReady()
  })

  // IV. 动画执行完毕后，最后执行
  transition.finished.then(() => {
    console.log("transition.finished.then...............")
  })

  // II. 在 updateDOM 被触发后，updateCallbackDone 这个 promise 
  // 将立即转为 fulfilled 
  transition.updateCallbackDone.then(() => {
    console.log("transition.updateCallbackDone.then...............")
  })

}

