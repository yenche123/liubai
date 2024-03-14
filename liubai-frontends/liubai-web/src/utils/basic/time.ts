import valTool from "./val-tool"

let diff = 0

// 设置时间差，由 CloudEventBus 调用
const setDiff = (val: number) => {
  diff = val
}

// 经过标定的时间
const getTime = (): number => {
  return Date.now() + diff
}

// 返回当前时间戳的后四码
const getLastCharOfStamp = (digit: number = 4): string => {
  const s = getTime()
  const s1 = String(s)
  const s2 = s1.substring(s1.length - digit)
  return s2
}

// 返回未经过标定的时间
const getLocalTime = (): number => {
  return Date.now()
}

// 返回经过标定的 Date
const getDate = () => {
  return new Date(getTime())
}

// 返回当前时间的字符串
const getLocalTimeStr = (): string => {
  let t = getTime()
  const d = new Date(t)
  const mon = valTool.format0(d.getMonth()+1)
  const date = valTool.format0(d.getDate())
  const hr = valTool.format0(d.getHours())
  const min = valTool.format0(d.getMinutes())
  const sec = valTool.format0(d.getSeconds())
  return `${mon}-${date} ${hr}:${min}:${sec}`
}

function getTimezone() {
  const d = new Date()
  const t = d.getTimezoneOffset()
  const t2 = -t / 60
  return t2
}


// 将 "秒" / "分" / "时" / "天" 转为 毫秒数
const SECONED = 1000
const MINUTE = 60 * SECONED
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY

export default {
  setDiff,
  getTime,
  getLastCharOfStamp,
  getLocalTime,
  getDate,
  getLocalTimeStr,
  getTimezone,
  SECONED,
  MINUTE,
  HOUR,
  DAY,
  WEEK,
}