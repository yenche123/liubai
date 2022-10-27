import { isEqual } from 'date-fns'

// 如果当前分钟数 < 30，获取下一个点的整点时间
// 否则获取下两个点的整点时间
export function getDefaultDate() {
  const d = new Date()
  const diffHr = d.getMinutes() < 30 ? 1 : 2
  d.setHours(d.getHours() + diffHr)
  d.setMinutes(0)
  d.setSeconds(0)
  d.setMilliseconds(0)
  return d
}

export function areTheDatesEqual(d1: Date, d2: Date) {
  return isEqual(d1, d2)
}