import { useDynamics } from "~/hooks/useDynamics"

const LIGHT_MAP: Record<string, string> = {
  "--liu-state-1": "#BAAEA2",
  "--liu-state-2": "#909871",
  "--liu-state-3": "#BC7F79",
  "--liu-state-4": "#7C728B",
  "--liu-state-5": "#9D7867",
  "--liu-state-6": "#47575E",
  "--liu-state-7": "#4A675A",
  "--liu-state-8": "#573F4C",
  "--liu-state-9": "#5976BA",
  "--liu-state-10": "#D39340",
}

const DARK_MAP: Record<string, string> = {
  "--liu-state-1": "#E3E2DF",
  "--liu-state-2": "#D6DBB3",
  "--liu-state-3": "#E2CAC7",
  "--liu-state-4": "#BDB1BF",
  "--liu-state-5": "#DCBB9F",
  "--liu-state-6": "#8DB1BF",
  "--liu-state-7": "#ACB5A0",
  "--liu-state-8": "#E4C3D1",
  "--liu-state-9": "#88ABDA",
  "--liu-state-10": "#FFD194",
}

export type ColorKey = string


/**
 * 映射颜色
 * @param useTo 
 * @param colorKey 可以是: #xxxxxx / var(--liu-state...) / --liu-statexxxx
 * @return 返回 #xxxxxx
 */
export function mapStateColor(
  useTo: "dot_color" | "",
  colorKey: ColorKey
) {
  const { theme } = useDynamics()

  const idx = colorKey.indexOf("#")
  if(idx === 0) return colorKey

  if(colorKey.includes("var")) {
    colorKey = colorKey.substring(4, colorKey.length - 1)
  }

  let res = ""
  if(useTo === "dot_color") {
    res = LIGHT_MAP[colorKey]
  }
  else if(theme.value === "light") {
    res = LIGHT_MAP[colorKey]
  }
  else {
    res = DARK_MAP[colorKey]
  }

  return res
}