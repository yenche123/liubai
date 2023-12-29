import { unref } from "vue"
import { isRef } from "vue"
import { 
  isReactive, 
  toRaw, 
  type Ref, 
  ref, 
  type UnwrapRef,
} from "vue"


export const toRawData = <T = any>(obj: T): T => {
  if(!obj) return obj
  if(!isReactive(obj)) return obj
  console.log("去转换 raw data...........")
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

// 逆 toRefs
// 把一个全是 ref 组成的 object，去掉 ref，变成 value
export const unToRefs = (obj: any) => {
  const obj2: any = {}
  const keys = Object.keys(obj)
  for(let i=0; i<keys.length; i++) {
    const k = keys[i]
    const v = obj[k]
    if(isRef(v)) {
      obj2[k] = unref(v)
    } 
    else {
      obj2[k] = v
    }
  }
  return obj2
}