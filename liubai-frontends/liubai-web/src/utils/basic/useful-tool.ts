// 一些实用的小函数，不知道存放在哪，姑且都收集在这

export interface FdBase {
  _id: string
  [otherKey: string]: any
}

/** 过滤掉 originals 里已有的 item 
 * 注意，该方法会直接返回原 newList 的引用
 * 所有修改都直接发生在 newList 上
*/
function filterDuplicated(
  orginals: FdBase[],
  newList: FdBase[],
) {
  if(orginals.length < 1 || newList.length < 1) return newList
  for(let i=0; i<newList.length; i++) {
    const v1 = newList[i]
    const v2 = orginals.find(v => v._id === v1._id)
    if(v2) {
      console.log("发现一个重复项............")
      newList.splice(i, 1)
      i--
    }
  }
  return newList
}


export interface CiiBase {
  id: string
  [otherKey: string]: any
}

/**
 * 检查两个 list 里的 id 排序是否一致
 * 注意: 若两者数组长度已不同，则视为不一致
 */
function checkIdsInLists(
  list1: CiiBase[],
  list2: CiiBase[],
) {
  if(list1.length !== list2.length) return false
  for(let i=0; i<list1.length; i++) {
    const v1 = list1[i]
    const v2 = list2[i]
    if(v1.id !== v2.id) return false
  }
  return true
}


export default {
  filterDuplicated,
  checkIdsInLists,
}