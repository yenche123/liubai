import { ref } from "vue"
import { useWindowSize } from "~/hooks/useVueUse"
import type { StateWhichPage } from "./types"

export function useStatePage() {

  // 1: 列表;    2: 看板
  const whichPage = ref<StateWhichPage>(0)

  // 初始化判断 优先展示列表还是看板
  const { width } = useWindowSize()
  if(width.value < 600) whichPage.value = 1
  else whichPage.value = 2

  const onNaviChange = (index: StateWhichPage) => {
    whichPage.value = index
  }

  return {
    whichPage,
    onNaviChange,
  }
}