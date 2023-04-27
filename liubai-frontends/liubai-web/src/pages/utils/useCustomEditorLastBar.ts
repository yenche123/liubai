// 判断 custom-editor 的 "完成" 按钮，是否要跟工具栏同一行
// 目前仅 index-content 和 edit-content 会用到

import { computed, inject, Ref } from "vue";
import { mainViewWidthKey } from "~/utils/provide-keys";

export function useCustomEditorLastBar() {
  // custom-editor 的底部要不要多一栏，让 完成按钮 跟工具栏不同行
  const mvRef = inject(mainViewWidthKey) as Ref<number>
  const lastBar = computed(() => {
    const w = mvRef.value
    if(w < 530) return true
    return false
  })

  return { lastBar }
}