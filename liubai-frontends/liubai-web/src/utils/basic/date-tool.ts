
import { 
  add,
  isEqual,
  isToday, 
  isTomorrow, 
  isYesterday, 
  isThisYear, 
  isThisMonth,
  isFuture,
  isPast,
  addHours,
  set as dateFnSet,
} from 'date-fns'
import time from './time'

function isNextMonth(d1: Date) {
  if(!isFuture(d1)) return false

  const now = time.getTime()
  const d2 = new Date(now)

  const y1 = d1.getFullYear()
  const m1 = d1.getMonth() + 1

  const y2 = d2.getFullYear()
  const m2 = d2.getMonth() + 1

  if(y1 === y2 && m1 === (m2 + 1)) return true
  if(y1 === (y2 + 1) && m1 === 1 && m2 === 12) return true

  return true
}

function isPreviousMonth(d1: Date) {
  if(!isPast(d1)) return false

  const now = time.getTime()
  const d2 = new Date(now)

  const y1 = d1.getFullYear()
  const m1 = d1.getMonth() + 1

  const y2 = d2.getFullYear()
  const m2 = d2.getMonth() + 1

  if(y1 === y2 && m1 === (m2 - 1)) return true
  if(y1 === (y2 - 1) && m1 === 12 && m2 === 1) return true

  return false
}


export default {
  add,
  isEqual,
  isToday,
  isTomorrow,
  isYesterday,
  isThisYear,
  isThisMonth,
  isNextMonth,
  isPreviousMonth,
  isFuture,
  isPast,
  addHours,
  dateFnSet,
}


