import { storeToRefs } from "pinia";
import { computed, inject, Ref, ref } from "vue";
import { mainViewWidthKey } from "~/utils/provide-keys";
import { useLayoutStore } from "~/views/useLayoutStore";

export function useIndexContent() {

  // 判断是否显示最顶部的边距
  const layoutStore = useLayoutStore()
  const { sidebarWidth, sidebarStatus } = storeToRefs(layoutStore)
  const showTop = computed(() => {
    if(sidebarStatus.value === "fullscreen") return true
    if(sidebarWidth.value <= 0) return false
    return true
  })

  // custom-editor 的底部要不要多一栏，让 完成按钮 跟工具栏不同行
  const mvRef = inject(mainViewWidthKey) as Ref<number>
  const lastBar = computed(() => {
    if(mvRef.value < 570) return true
    return false
  })

  return { lastBar, showTop }
}