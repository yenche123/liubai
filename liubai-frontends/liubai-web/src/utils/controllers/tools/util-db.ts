
export type CriteriaFunc<T> = (row: T) => boolean

// 参数 T 为行数据的类型
export function fastForward<T extends Record<string, any>>(
  lastRow: T, 
  idProp: string,
  otherCriteria: CriteriaFunc<T>,
) {
  let fastForwardComplete = false    // 标识是否已找到末行了
  
  const _find = (item: T) => {
    if(fastForwardComplete) return otherCriteria(item)
    if(item[idProp] === lastRow[idProp]) {
      fastForwardComplete = true
    }
    return false
  }

  return _find
}