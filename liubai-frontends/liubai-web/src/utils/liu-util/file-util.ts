import type { LiuFileStore, LiuImageStore } from "~/types"
import { MemberLocalTable } from "~/types/types-table"
import time from "../basic/time"

// 获取允许的图片类型 由 , 拼接而成的字符串
export function getAcceptImgTypesString() {
  return "image/png,image/jpg,image/jpeg,image/gif,image/webp"
} 

export function getAcceptImgTypesArray() {
  const str = getAcceptImgTypesString()
  return str.split(",")
}

export function createObjURLs(files: Array<Blob | File>): string[] {
  const list = []
  for(let i=0; i<files.length; i++) {
    const v = files[i]
    const res = URL.createObjectURL(v)
    list.push(res)
  }

  return list
}


type UrlMapKey = string

interface UrlMapVal {
  createStamp: number
  usedStamp: number
  url: string
  num: number
}

let fileMap = new Map<UrlMapKey, UrlMapVal>()

export function createURLsFromStore(
  files: Array<LiuImageStore | LiuFileStore>,
) {
  const list: string[] = []
  for(let i=0; i<files.length; i++) {
    const v = files[i]
    const data = fileMap.get(v.id)
    const now = time.getTime()
    if(data) {
      list.push(data.url)
      data.usedStamp = now
      data.num++
      fileMap.set(v.id, data)
    }
    else if(v.arrayBuffer) {
      const blob = new Blob([v.arrayBuffer], { type: v.mimeType })
      const res = URL.createObjectURL(blob)
      list.push(res)
      const newData: UrlMapVal = {
        createStamp: now,
        usedStamp: now,
        url: res,
        num: 1,
      }
      fileMap.set(v.id, newData)
    }
    else {
      list.push("")
    }
  }

  // 修剪 map
  _trimFileMap()

  return list
}

/**
 * 修剪 fileMap，控制 fileMap 的大小
 */
function _trimFileMap() {
  const size = fileMap.size

  const MAX_SIZE = 100
  if(size < MAX_SIZE) return

  const now = time.getTime()
  const MIN_3 = 1000 * 60 * 3

  const keys = fileMap.keys()
  for(let key of keys) {
    const data = fileMap.get(key)
    if(!data) continue
    const diff = now - data.usedStamp
    if(diff < MIN_3) continue
    
    fileMap.delete(key)

    if(fileMap.size < MAX_SIZE) break 
  }
}

export function revokeObjURLs(urls: string[]) {
  for(let i=0; i<urls.length; i++) {
    const v = urls[i]
    URL.revokeObjectURL(v)
  }
  return true
}

export function getArrayFromFileList(fileList: FileList): File[] {
  const arr: File[] = []
  for(let i=0; i<fileList.length; i++) {
    const v = fileList[i]
    arr.push(v)
  }
  return arr
}

/**
 * 从文件中获取图片类型的文件，并且不会改变原数组
 */
export function getOnlyImageFiles(files: File[]): File[] {
  const imgFiles: File[] = []
  const arr = getAcceptImgTypesArray()
  for(let i=0; i<files.length; i++) {
    const v = files[i]
    if(arr.includes(v.type)) imgFiles.push(v)
  }
  return imgFiles
}

export function getNotImageFiles(files: File[]): File[] {
  const newList: File[] = []
  const arr = getAcceptImgTypesArray()
  for(let i=0; i<files.length; i++) {
    const v = files[i]
    console.log("看一下文件的 type: ", v.type)
    if(!arr.includes(v.type)) newList.push(v)
  }
  return newList
}

export function constraintWidthHeight(
  w: number,
  h: number,
  maxW: number,
  maxH: number,
) {
  if (w > maxW && w > h) {
    return {
      width: maxW,
      height: Math.round(h * (maxW / w))
    }
  } else if (h > maxH) {
    return {
      width: Math.round( w * (maxH / h)),
      height: maxH
    }
  }
  return { width: w, height: h }
}