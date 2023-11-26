// 关于时间的工具函数

/********************* 空函数 ****************/
export async function main(ctx: FunctionContext) {
  console.log("do nothing on common-time")
  return true
}

/********************* 公共函数和变量们 ****************/

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

// 将 "秒" / "分" / "时" / "天" 转为 毫秒数
export const SECONED = 1000
export const MINUTE = 60 * SECONED
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

