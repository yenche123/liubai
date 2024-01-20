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

/** 编码括号
 *  由于 encodeURIComponent 不会对 `()` 这两个字符进行编码
 *  所以手动进行编码成 %28 和 %29
 */
function encodeBraces(str: string) {
  let url: URL
  try {
    url = new URL(str)
  }
  catch(err) {
    return str
  }

  let s = url.search
  if(s) {
    s = s.replace("(", "%28")
    s = s.replace(")", "%29")
    url.search = s
  }
  
  let p = url.pathname
  // 因为第一个字符肯定是 `/`，所以判断字符数是否大于 1
  if(p && p.length > 1) {
    p = p.replace("(", "%28")
    p = p.replace(")", "%29")
    url.pathname = p
  }

  let newStr = url.toString()
  return newStr
}


export default {
  filterDuplicated,
  checkIdsInLists,
  encodeBraces,
}