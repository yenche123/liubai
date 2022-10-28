import { computed } from "vue"
import { useDynamics } from "./useDynamics"

const lightMap = {
  "bg1": "/bg/bg1.svg",
}

const darkMap: typeof lightMap = {
  "bg1": "/bg/bg1_dark.svg",
}

export const useImages = () => {
  const { theme } = useDynamics()
  const images = computed<typeof lightMap>(() => {
    const t = theme.value
    if(t === "light") return lightMap
    return darkMap
  })
  return { images }
}