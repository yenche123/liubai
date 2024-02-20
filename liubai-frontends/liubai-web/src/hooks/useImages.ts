import { computed } from "vue"
import { useSystemStore } from "./stores/useSystemStore"
import { storeToRefs } from "pinia"

const lightMap = {
  "bg1": "/bg/bg1.svg",
}

const darkMap: typeof lightMap = {
  "bg1": "/bg/bg1_dark.svg",
}

export const useImages = () => {
  const systemStore = useSystemStore()
  const { supported_theme } = storeToRefs(systemStore)

  const images = computed<typeof lightMap>(() => {
    const t = supported_theme.value
    if(t === "light") return lightMap
    return darkMap
  })
  return { images }
}