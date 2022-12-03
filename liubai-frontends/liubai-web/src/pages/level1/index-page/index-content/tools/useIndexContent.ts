import { storeToRefs } from "pinia";
import { computed, inject, Ref, ref } from "vue";
import { mvKey } from "../../../../../utils/provide-keys";
import { useLayoutStore } from "../../../../../views/useLayoutStore";

export function useIndexContent() {

  const layoutStore = useLayoutStore()
  const { sidebarWidth } = storeToRefs(layoutStore)

  // custom-editor 的底部要不要多一栏，让 完成按钮 跟工具栏不同行
  const mvRef = inject(mvKey) as Ref<number>
  const lastBar = computed(() => {
    if(mvRef.value < 570) return true
    return false
  })

  return { lastBar, sidebarWidth }
}