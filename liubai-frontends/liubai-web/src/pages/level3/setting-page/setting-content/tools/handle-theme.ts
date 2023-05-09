import type { SettingContentData } from "./types"
import type { SupportedTheme } from "~/types"
import localCache from "~/utils/system/local-cache"
import { getThemeList } from "./get-list"
import cui from "~/components/custom-ui"
import liuApi from "~/utils/liu-api"
import { useDynamics } from "~/hooks/useDynamics"
import type { UseDynamicsType } from "~/hooks/useDynamics"

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

function toSetTheme(
  dyn: UseDynamicsType,
  theme: SupportedTheme,
) {
  dyn.setTheme(theme)

}

