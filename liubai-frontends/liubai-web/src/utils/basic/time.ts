import valTool from "./val-tool"
import liuEnv from "../liu-env"
import { 
  getStorageSafely, 
  setStorageSafely,
} from "./safe-funcs"

// 将 "秒" / "分" / "时" / "天" 转为 毫秒数
const SECONED = 1000
const MINUTE = 60 * SECONED
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY

const key1 = "liu_time-diff"
const key2 = "liu_time-err"

let diff = 0
let hasSetDiffEver = false
let appSetupStamp = 0  // App.vue setup 周期被执行的时间戳

// 当 App.vue 被运行时，在 setup 周期里调用
const whenAppSetup = () => {
  appSetupStamp = Date.now()
}

// 让各个组件或函数获取 App.vue setup 周期被执行的时间戳
const getAppSetupStamp = () => {
  return appSetupStamp + diff
}

const _getStorageDiff = () => {
  const diffStr = getStorageSafely(key1, false)
  if(!diffStr) return null
  const diffNum = Number(diffStr)
  if(isNaN(diffNum)) return null
  return diffNum
}

const _setStorageDiff = (val: number) => {
  const isOK = setStorageSafely(key1, String(val))
  return isOK
}

const _getTimeErrStamp = () => {
  const errStr = getStorageSafely(key2, false)
  if(!errStr) return 0
  const errNum = Number(errStr)
  if(isNaN(errNum)) return 0
  return errNum
}

const _setTimeErrStamp = (val: number) => {
  const isOK = setStorageSafely(key2, String(val))
  return isOK
}

const _canIReload = () => {
  const now = Date.now()
  const stamp = _getTimeErrStamp()
  if(!stamp) {
    _setTimeErrStamp(now)
    return true
  }
  const duration = now - stamp
  if(duration < MINUTE) return false
  _setTimeErrStamp(now)
  return true
}

// 设置时间差，由 CloudEventBus 调用
const setDiff = (
  val: number,
  fromWorker: boolean = false,
) => {
  diff = val
  hasSetDiffEver = true

  if(fromWorker) return
  const hasBE = liuEnv.hasBackend()
  if(!hasBE) return

  const oldDiff = _getStorageDiff()
  const isOk = _setStorageDiff(val)
  if(!isOk) return

  if(oldDiff === null) return
  const diffBetweenOldAndNew = Math.abs(val - oldDiff)
  const MIN_5 = 5 * MINUTE
  if(diffBetweenOldAndNew < MIN_5) return

  console.warn("we may need to reload the page cause diffBetweenOldAndNew is too large.")
  console.log("oldDiff: ", oldDiff)
  console.log("val: ", val)

  if(!_canIReload()) return

  setTimeout(() => {
    location.reload()
  }, 3 * SECONED)
}

const getDiff = () => diff

// 经过标定的时间
const getTime = () => {
  const hasBE = liuEnv.hasBackend()
  if(!hasBE) return Date.now()
  if(hasSetDiffEver) return Date.now() + diff
  hasSetDiffEver = true

  const sDiff = _getStorageDiff()
  if(sDiff === null) return Date.now()
  diff = sDiff
  
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
const isWithinMillis = (
  stamp: number,
  ms: number,
  onlyLocal: boolean = false,
) => {
  const now = onlyLocal ? getLocalTime() : getTime()
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

export default {
  whenAppSetup,
  getAppSetupStamp,
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