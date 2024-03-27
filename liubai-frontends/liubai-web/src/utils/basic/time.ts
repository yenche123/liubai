import valTool from "./val-tool"

let diff = 0

// 设置时间差，由 CloudEventBus 调用
const setDiff = (val: number) => {
  diff = val
}

const getDiff = () => diff

// 经过标定的时间
const getTime = () => {
  return Date.now() + diff
}

// 返回当前时间戳的后四码
const getLastCharOfStamp = (digit: number = 4) => {
  const s = getTime()
  const s1 = String(s)
  const s2 = s1.substring(s1.length - digit)
  return s2
}

// 返回未经过标定的时间
const getLocalTime = () => {
  return Date.now()
}

// 返回经过标定的 Date
const getDate = () => {
  return new Date(getTime())
}

// 返回当前时间的字符串
const getLocalTimeStr = () => {
  let t = getTime()
  const d = new Date(t)
  const mon = valTool.format0(d.getMonth()+1)
  const date = valTool.format0(d.getDate())
  const hr = valTool.format0(d.getHours())
  const min = valTool.format0(d.getMinutes())
  const sec = valTool.format0(d.getSeconds())
  return `${mon}-${date} ${hr}:${min}:${sec}`
}

const getTimezone = () => {
  const d = new Date()
  const t = d.getTimezoneOffset()
  const t2 = -t / 60
  return t2
}

/**
 * check if the stamp is within a range of milliseconds
 * @param stamp some last stamp
 * @param range 
 */
const isWithinMillis = (stamp: number, ms: number) => {
  const now = getTime()
  const diff = now - stamp
  if(diff < ms) return true
  return false
}

/** get current stamp while adding */
const getBasicStampWhileAdding = () => {
  const now = getTime()
  return {
    insertedStamp: now,
    updatedStamp: now,
  }
}


// 将 "秒" / "分" / "时" / "天" 转为 毫秒数
const SECONED = 1000
const MINUTE = 60 * SECONED
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY

export default {
  setDiff,
  getDiff,
  getTime,
  getLastCharOfStamp,
  getLocalTime,
  getDate,
  getLocalTimeStr,
  getTimezone,
  isWithinMillis,
  getBasicStampWhileAdding,
  SECONED,
  MINUTE,
  HOUR,
  DAY,
  WEEK,
}