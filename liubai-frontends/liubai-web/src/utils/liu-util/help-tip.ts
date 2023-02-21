
import liuApi from "../liu-api"

const MAC_MAPS = {
  "Mod_Enter": "⌘ + ↵",
  "Mod_P": "⌘ + P",
  "Enter": "↵",
  "Mod": "⌘",
}

type HelpMap = typeof MAC_MAPS

const WIN_MAPS: HelpMap = {
  "Mod_Enter": "Ctrl + Enter",
  "Mod_P": "Ctrl + P",
  "Enter": "Enter",
  "Mod": "Ctrl",
}

export const getHelpTip = (key: keyof HelpMap): string => {
  const cha = liuApi.getCharacteristic()
  if(!cha.isPC) return ""
  if(cha.isMac) return MAC_MAPS[key]
  return WIN_MAPS[key]
}