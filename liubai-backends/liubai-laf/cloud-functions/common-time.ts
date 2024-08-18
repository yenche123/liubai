// Function Name: common-time

// 关于时间的工具函数

/********************* 空函数 ****************/
export async function main(ctx: FunctionContext) {
  console.log("do nothing on common-time")
  return true
}

/********************* 常量 ****************/
// 将 "秒" / "分" / "时" / "天" 转为 毫秒数
export const SECONED = 1000
export const MINUTE = 60 * SECONED
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR
export const WEEK = 7 * DAY

/********************* 公共函数 ****************/

/** 获取当前时间戳 */
export function getNowStamp() {
  return Date.now()
}

/**
 * 返回 insertedStamp 和 updatedStamp
 */
export function getBasicStampWhileAdding() {
 const now = getNowStamp()
 return {
   insertedStamp: now,
   updatedStamp: now,
 }
}

/** to get the timezone in which the server is */
export function getServerTimezone() {
  const d = new Date()
  const t = d.getTimezoneOffset()
  const t2 = -t / 60
  return t2
}

/** turning string like "8.5" into 8.5 */
export function formatTimezone(str?: string) {
  if(!str) return 0
  const timezone = Number(str)
  if(isNaN(timezone)) return 0
  return timezone
}

export function localizeStamp(stamp: number, timezone?: string) {
  if(!timezone) {
    const envTimezone = process.env.LIU_TIMEZONE
    if(envTimezone) timezone = envTimezone
    else timezone = "0"
  }

  const tz = formatTimezone(timezone)
  const diff = tz - getServerTimezone()
  const newStamp = stamp + diff * HOUR
  return newStamp
}

/** to get the current hours of a specific timezone */
export function currentHoursOfSpecificTimezone(timezone: number) {
  const serverTimezone = getServerTimezone() 
  const serverHrs = (new Date()).getHours()
  const diffTimezone = timezone - serverTimezone
  const hrs = (serverHrs + diffTimezone) % 24 
  return hrs
}

export function isWithinMillis(stamp: number, ms: number) {
  const now = getNowStamp()
  const diff = now - stamp
  if(diff < ms) return true
  return false
}
