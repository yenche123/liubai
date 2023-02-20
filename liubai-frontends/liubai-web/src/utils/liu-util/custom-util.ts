// 一些自定义的 util
import time from "../basic/time"


/******* 转换颜色 *******/

// 将 --liu 转为 #.....
export function colorToShow(val: string) {
  let idx1 = val.indexOf("var(")
  if(idx1 === 0) return val
  let idx2 = val.indexOf("--liu")
  if(idx2 === 0) {
    return `var(${val})`
  }
  return val
}

// 将 `var(CSS变量)` 变量转为 CSS 变量
export function colorToStorage(val: string) {
  let idx1 = val.indexOf("var(")
  if(idx1 === 0) {
    return val.substring(4, val.length - 1)
  }
  return val
}

/***** 一些防抖节流相关的函数 */
let lastKeyUpDown = 0
export function canKeyUpDown() {
  const now = time.getTime()
  const diff = now - lastKeyUpDown
  if(diff < 28) return false
  lastKeyUpDown = now
  return true
}
