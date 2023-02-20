

const waitMilli = (milli: number = 0): Promise<true> => {
  let _t = (a: (a1: true) => void) => {
    setTimeout(() => {
      a(true)
    }, milli)
  }

  return new Promise(_t)
}

const copyObject = <T = any>(obj: T): T => {
  let type = typeof obj
  if(type !== "object") return obj

  let obj2: T;
  try {
    obj2 = JSON.parse(JSON.stringify(obj))
  }
  catch(err) {
    return obj
  }
  return obj2
}

// 将字符串 转为 object
const strToObj = <T = any>(str: string): T => {
  let res = {}
  try {
    res = JSON.parse(str)
  }
  catch(err) {}
  return res as T
}

// 快速把入参 val 包裹在 Promise 里返回
const getPromise = <T = any>(val: T): Promise<T> => {
  return new Promise(a => a(val)) 
}


const numToFix = (num: number, fix: number): number => {
  const str = num.toFixed(fix)
  return Number(str)
}

/**
 * 返回小于 2 位时，前面补0
 */
const format0 = (val: string | number): string => {
  if(typeof val === "number") {
    if(val < 10) return "0" + val
    return "" + val  
  }
  if(val.length < 2) return "0" + val
  return val
}

/**
 * 获取文本的中文字符数
 */
const getChineseCharNum = (val: string) => {
  if(!val) return 0
  let num = 0
  for(let i=0; i<val.length; i++) {
    if(val.charCodeAt(i) >= 10000) num++
  }
  return num
}

/**
 * 判断一段文本是否全为英文字符
 */
const isAllEnglishChar = (val: string) => {
  const regex = /^[a-z]+$/
  return regex.test(val)
}

//获取小写字符串的数量
const getLowerCaseNum = (text: string): number => {
  if(!text || text.length < 1) return 0
  let list = text.split("")
  let num = 0
  list.forEach(v => {
    if(v >= "a" && v <= "z") num++
  })
  return num
}

const getValInMinAndMax = (val: number, min: number, max: number): number => {
  if(val < min) return min
  if(val > max) return max
  return val
}

// 检查 a 是否包含于 b，即 a 的属性和值，是否 b 都有且一致（但 b 可以有 a 所没有的属性）
const isAIncludedInB = (a: Record<string, any>, b: Record<string, any>): boolean => {
  for(let key in a) {
    if(a[key] !== b[key]) return false
  }
  return true
}

// 给定文件名或含后缀的文件路径 获取后缀（不含.）
// 会将后缀转为小写
// 若提取失败 则返回空的字符串
const getSuffix = (name: string): string => {
  const arr = /\.([^.]*)$/.exec(name)
  if(!arr) return ""
  const format = arr[1].toLowerCase()
  return format
}

const isSameSimpleList = (
  list1: Array<string | number>, 
  list2: Array<string | number>
): boolean => {
  if(list1.length !== list2.length) return false
  
  for(let i=0; i<list1.length; i++) {
    const v1 = list1[i]
    const v2 = list2[i]
    if(v1 !== v2) return false
  }

  return true
}


export default {
  waitMilli,
  copyObject,
  strToObj,
  getPromise,
  numToFix,
  format0,
  getChineseCharNum,
  isAllEnglishChar,
  getLowerCaseNum,
  getValInMinAndMax,
  isAIncludedInB,
  getSuffix,
  isSameSimpleList,
}