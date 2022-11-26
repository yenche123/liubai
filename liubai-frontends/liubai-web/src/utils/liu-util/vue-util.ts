import { isReactive, toRaw } from "vue"


export const toRawData = <T = any>(obj: T): T => {
  if(!obj) return obj
  if(!isReactive(obj)) return obj
  return toRaw(obj)
}

export const getRawList = <T = any>(list?: T[]): T[] => {
  if(!list) return []

  const newList: T[] = []
  for(let i=0; i<list.length; i++) {
    const v = list[i]
    if(isReactive(v)) {
      newList.push(toRaw(v))
    }
    else {
      newList.push(v)
    }
  }

  return newList
}