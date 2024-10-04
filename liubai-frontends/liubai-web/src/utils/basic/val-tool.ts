

const waitMilli = (milli: number = 0): Promise<true> => {
  let _t = (a: (a1: true) => void) => {
    setTimeout(() => {
      a(true)
    }, milli)
  }

  return new Promise(_t)
}


// 不要使用 js runtime 的 structuredClone() 进行复制
// 因为 reactive（Proxy）“响应性” 复制后依然存在，但理应不该存在
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

/**
 * 将对象转为 object
 * 若转换失败，返回空字符
 */
const objToStr = <T = any>(obj: T): string => {
  let str = ``
  try {
    str = JSON.stringify(obj)
  }
  catch(err) {}
  return str
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
 * 判断一个字符串，是否能正常地转为数字
 */
const isStringAsNumber = (str: string) => {
  str = str.trim()
  if(!str) return false
  const num = Number(str)
  if(isNaN(num)) return false
  return true
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
  const regex = /^[a-zA-Z]+$/
  return regex.test(val)
}

/**
 * 统计字符的数量，拉丁字母为 1，中文字为 2
 */
const getTextCharNum = (val: string) => {
  let num = 0
  for(let i=0; i<val.length; i++) {
    const v = val[i]
    if(getChineseCharNum(v) > 0) num += 2
    else num += 1
  }
  return num
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
  const arr = /\.([\w]*)$/.exec(name)
  if(!arr) return ""
  const format = arr[1].toLowerCase()
  return format
}

// 检查 hostname 是否为 domain 或其下的子域名
const isInDomain = (
  hostname: string,
  domain: string
) => {
  if(hostname === domain) return true

  // 把 www. 去掉
  const dList = domain.split(".")
  if(dList.length === 3) {
    if(dList[0] === "www") {
      domain = dList[1] + "." + dList[2]
    }
  }

  const firChar = domain[0]
  domain = firChar === "." ? domain : (`.${domain}`)
  hostname = `.${hostname}`

  if(hostname === domain) return true

  const hLen = hostname.length
  const dLen = domain.length
  if(hLen < dLen) return false
  const lastOfHostname = hostname.substring(hLen - dLen)
  return lastOfHostname === domain
}

/**
 * 减1，但确保新值大于等于 0
 * @param oldVal 原始值，也就是被减数
 * @param subtrahend 减数，默认为 1
 */
const minusAndMinimumZero = (
  oldVal: number | undefined,
  subtrahend: number = 1,
) => {
  if(!oldVal) return 0
  let newVal = oldVal - subtrahend
  if(newVal < 0) return 0
  return newVal
}

/** compare version */
const compareVersion = (v1: string, v2: string) => {
  const list1 = v1.split('.')
  const list2 = v2.split('.')
  const len = Math.max(list1.length, list2.length)
  while (list1.length < len) {
    list1.push('0')
  }
  while (list2.length < len) {
    list2.push('0')
  }
  for (let i = 0; i < len; i++) {
    const num1 = parseInt(list1[i])
    const num2 = parseInt(list2[i])
    
    if(num1 > num2) return 1
    if(num1 < num2) return -1
  }

  return 0
}

// removing duplicates from an array
const uniqueArray = (arr: string[]) => {
  const uniqueSet = new Set(arr)
  const uniqueArr = [...uniqueSet]
  return uniqueArr
}

const hasValue = <T>(
  val: any, 
  type: string,
  checkLength: boolean = true,
): val is T => {
  if(val && typeof val === type) {
    if(checkLength && Array.isArray(val)) {
      if(val.length < 1) return false
    }
    return true
  }
  return false
}

const isStringWithVal = (val: any): val is string => {
  return hasValue<string>(val, "string")
}

const getURL = (val: string) => {
  let url: URL | undefined
  try {
    url = new URL(val)
    if(!url.hostname) return
  }
  catch(err) {
    // console.warn("getURL fail........")
    // console.log(err)
    // console.log(val)
    // console.log(" ")
  }
  
  return url
}

export default {
  waitMilli,
  copyObject,
  strToObj,
  objToStr,
  getPromise,
  numToFix,
  isStringAsNumber,
  format0,
  getChineseCharNum,
  isAllEnglishChar,
  getLowerCaseNum,
  getTextCharNum,
  getValInMinAndMax,
  isAIncludedInB,
  getSuffix,
  isInDomain,
  minusAndMinimumZero,
  compareVersion,
  uniqueArray,
  hasValue,
  isStringWithVal,
  getURL,
}