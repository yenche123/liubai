import valTool from "../basic/val-tool"


interface StorageMapParam2 {
  data: any
  stamp: number
}

let hasListenStorageChange = false
let storageMap = new Map<string, StorageMapParam2>()   // { key1: { data: 元数据, stamp: 时间戳 } }
const TAG = "liu_"

// 去监听其他标签页 
const _listenStorageChange = () => {
  hasListenStorageChange = true

  // 只有在不同标签页或窗口才监听得到
  window.addEventListener("storage", e => {
    const { key, newValue } = e

    // key 不存在，代表调用了 localStorage.clear()
    if(!key) {
      storageMap = new Map()
      return
    }

    if(!storageMap.has(key)) return
    if(!newValue) return
    let newObj = valTool.strToObj(newValue)
    if(!newObj.data || !newObj.stamp) return
    storageMap.set(key, newObj)
  })
}

// localStorage.setItem 出错时......
// 参考: https://blog.csdn.net/weixin_30632267/article/details/113366007
const _handleSetItemErr = (err: any) => {
  if(!err || !err.code) return
  let { code, name } = err
  if(code === 22) {
    // localStorage 超出存储空间.........
  }
  else if(code === 1014 && name === "NS_ERROR_DOM_QUOTA_REACHED") {
    // firefox 超出存储空间
  }
}

/**
 * 获取缓存
 */
const getStorageSync = <T = any>(key: string): T | undefined | null => {
  if(!key) {
    console.warn(`getStorageSync 没有 key.......`)
    return
  }

  if(!hasListenStorageChange) _listenStorageChange()
  const _key = TAG + key

  if(storageMap.has(_key)) {
    let s1 = storageMap.get(_key) as StorageMapParam2
    return valTool.copyObject(s1.data)
  }

  let s: string | null = null
  try {
    s = localStorage.getItem(_key)
  }
  catch(err) {}
  
  if(s && typeof s === "string") {
    let obj = JSON.parse(s)
    storageMap.set(_key, obj)
    return valTool.copyObject(obj.data)
  }
  storageMap.set(_key, { data: s, stamp: Date.now() })
  return s as null
}

interface StorageRes {
  isOk: boolean
  err?: any
}

/**
 * 设置缓存
 */
const setStorageSync = (key: string, data: any): StorageRes => {
  if(!key) {
    console.warn(`setStorageSync 没有 key.......`)
    return { isOk: false }
  }
  if(data === undefined) {
    console.warn(`setStorageSync 没有 data 不允许设置为 undefined.......`)
    return { isOk: false }
  }
  
  let s = { data, stamp: Date.now() }
  const _key = TAG + key
  storageMap.set(_key, s)
  try {
    localStorage.setItem(_key, JSON.stringify(s))
  }
  catch(err) {
    _handleSetItemErr(err)
    return { isOk: false, err }
  }
  return { isOk: true }
}

const removeStorageSync = (key: string): StorageRes => {
  if(!key) {
    console.warn(`setStorageSync 没有 key.......`)
    return { isOk: false }
  }
  const _key = TAG + key
  if(storageMap.has(_key)) {
    storageMap.delete(_key)
  }
  try {
    localStorage.removeItem(_key)
  }
  catch(err) {
    console.log("移除 ", _key, " localStorage 失败......")
    console.log(err)
    console.log(" ")
  }
  return { isOk: true }
}


/**
 * 仅移除以 TAG对应关键字 为前缀的 storage
 */
const clearStorageSync = (): void => {
  storageMap.clear()
  for(let i=0; i<localStorage.length; i++) {
    const key = localStorage.key(i)
    const idx: number = key?.indexOf(TAG) ?? -1
    if(idx !== 0) continue
    localStorage.removeItem((key as string))
    i--
  }
}

export default {
  getStorageSync,
  setStorageSync,
  removeStorageSync,
  clearStorageSync,
}