import { Ref, ref } from "vue";
import { useLayoutStore } from "../../../../../views/useLayoutStore";


export function useIndexContent() {

  // custom-editor 的底部要不要多一栏，让 完成按钮 跟工具栏不同行
  const lastBar = ref(false)

  initLastBar(lastBar)

  return { lastBar }
}

function initLastBar(
  lastBar: Ref<boolean>,
) {
  const layoutStore = useLayoutStore()
  const leftPx = layoutStore.sidebarWidth

}