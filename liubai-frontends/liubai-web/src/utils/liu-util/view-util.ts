import type { BasicView } from "~/types/types-view"
import typeCheck from "~/utils/basic/type-check";

/**
 * 显示某个视图，否则就新增视图
 * @param list 视图列表
 * @param newData 新的视图，只在查无当前视图时，再 push 到 list 里
 * @param targetKey 除了匹配 id 之外，额外要求匹配的字段（可选）
 * @param targetVal 额外要求匹配字段的值（可选）
 */
function showView<T extends BasicView, K extends keyof T>(
  list: T[],
  newData: T,
  targetKey?: K,
  targetVal?: T[K],
) {
  let hasFound = false
  const hasTargetKey = !typeCheck.isUndefined(targetKey)

  for(let i=0; i<list.length; i++) {
    const v = list[i]
    v.show = false
    if(v.id !== newData.id) continue
    if(hasTargetKey) {
      if(v[targetKey] === targetVal) {
        hasFound = true
        v.show = true
      }
    }
    else {
      hasFound = true
      v.show = true
    }
  }

  if(hasFound) return
  list.push(newData)
  if(list.length > 10) {
    list.splice(0, 1)
  }
}

export default {
  showView,
}