import { useSystemStore } from "~/hooks/stores/useSystemStore"

const LIGHT_MAP: Record<string, string> = {
  "--liu-state-1": "#BAAEA2",
  "--liu-state-2": "#909871",
  "--liu-state-3": "#BC7F79",
  "--liu-state-4": "#9786B1",
  "--liu-state-5": "#9D7867",
  "--liu-state-6": "#5E7B87",
  "--liu-state-7": "#51816B",
  "--liu-state-8": "#8F5B77",
  "--liu-state-9": "#5976BA",
  "--liu-state-10": "#ECB165",
}

const DARK_MAP: Record<string, string> = {
  "--liu-state-1": "#C3BBB3",
  "--liu-state-2": "#C4C8A2",
  "--liu-state-3": "#D4B4AF",
  "--liu-state-4": "#AA87B0",
  "--liu-state-5": "#DCBB9F",
  "--liu-state-6": "#8DB1BF",
  "--liu-state-7": "#88927C",
  "--liu-state-8": "#DF9AB7",
  "--liu-state-9": "#88ABDA",
  "--liu-state-10": "#FFD194",
}

/**
 * 映射颜色
 * @param useTo 
 * @param colorKey 可以是: #xxxxxx / var(--liu-state...) / --liu-statexxxx
 * @return 返回 #xxxxxx
 */
export function mapStateColor(
  useTo: "dot_color" | "",
  colorKey: string
) {
  const { supported_theme } = useSystemStore()

  const idx = colorKey.indexOf("#")
  if(idx === 0) return colorKey

  if(colorKey.includes("var")) {
    colorKey = colorKey.substring(4, colorKey.length - 1)
  }

  let res = ""

  // 因为 深色模式时，snackbar 是白色背景的，再用深色模式的颜色时会看不清楚
  // 故遇到 dot_color (也就是 snackbar 上的点颜色)，都使用浅色模式时的配色
  if(useTo === "dot_color") {
    res = LIGHT_MAP[colorKey]
  }
  else if(supported_theme === "light") {
    res = LIGHT_MAP[colorKey]
  }
  else {
    res = DARK_MAP[colorKey]
  }

  return res
}