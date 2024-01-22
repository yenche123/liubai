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

/** 统计某个字符出现的次数 
 *  注意: regChar 是要放在 new RegExp 里头的，所以比如转义字符 `\` 就必须打成 `\\`
 *   要寻找 `(` 就必须达成 `\\(`
*/
function countCharOccurrences(text: string, regChar: string) {
  const matches = text.match(new RegExp(regChar, 'g'))
  return matches ? matches.length : 0
}


interface EncodeBracesRes {
  str: string
  lastCharDeleted: boolean
}

/** 如果最后一个字符是 `)` 那么去判断 `()` 的个数是否成对，再去判断是否要删掉 */
function _handleBracePair(str: string): EncodeBracesRes {
  if(!str) return { str: "", lastCharDeleted: false }
  const length = str.length
  const lastChar = str[length - 1]
  if(lastChar !== ")") return { str, lastCharDeleted: false }
  const num1 = countCharOccurrences(str, "\\(")
  const num2 = countCharOccurrences(str, "\\)")
  if(num1 >= num2) return { str, lastCharDeleted: false }
  // 去删掉最后一个字符
  str = str.substring(0, length - 1)
  return { str, lastCharDeleted: true }
}

/** 编码括号
 *  由于 encodeURIComponent 不会对 `()` 这两个字符进行编码
 *  所以手动进行编码成 %28 和 %29
 */
function encodeBraces(str: string): EncodeBracesRes {
  let url: URL
  try {
    url = new URL(str)
  }
  catch(err) {
    return { str, lastCharDeleted: false }
  }

  let lastCharDeleted = false
  let s = url.search
  let h = url.hash
  // 因为第一个字符肯定是 `?`，所以判断字符数是否大于 1
  if(s && s.length > 1) {
    
    // 判断 参数 是否在 url 的最尾部
    if(!h) {
      const b1 = _handleBracePair(s)
      s = b1.str
      if(b1.lastCharDeleted) lastCharDeleted = true
    }
    
    s = s.replaceAll("(", "%28")
    s = s.replaceAll(")", "%29")
    url.search = s
  }
  
  let p = url.pathname
  // 因为第一个字符肯定是 `/`，所以判断字符数是否大于 1
  if(p && p.length > 1) {

    // 判断 路径 是否在 url 的最尾部
    // 即后方不存在 “参数” 也不存在 “哈希”
    if(!s && !h) {
      const b2 = _handleBracePair(p)
      p = b2.str
      if(b2.lastCharDeleted) lastCharDeleted = true
    }

    p = p.replaceAll("(", "%28")
    p = p.replaceAll(")", "%29")
    url.pathname = p
  }

  let newStr = url.toString()
  return { str: newStr, lastCharDeleted }
}


export default {
  filterDuplicated,
  checkIdsInLists,
  encodeBraces,
}