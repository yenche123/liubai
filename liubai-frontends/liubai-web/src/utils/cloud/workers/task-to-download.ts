import { db } from "~/utils/db"
import time from "~/utils/basic/time"
import type { SyncRes } from "../tools/types"
import type { LiuFileStore, LiuImageStore } from "~/types"
import type { 
  DownloadTaskLocalTable, 
  MemberLocalTable, 
  UserLocalTable, 
  WorkspaceLocalTable,
  ContentLocalTable,
} from "~/types/types-table"

interface HanTaskRes {
  hasEverUnknown?: boolean
  hasEverBadNetwork?: boolean
}

interface HanFilesRes {
  hasEverUnknown?: boolean
  hasEverBadNetwork?: boolean
  hasEverSuccess?: boolean
  files: LiuFileStore[]
}

interface HanImgsRes {
  hasEverUnknown?: boolean
  hasEverBadNetwork?: boolean
  hasEverSuccess?: boolean
  imgs: LiuImageStore[]
}

interface HanWhateverRes {
  hasEverUnknown?: boolean
  hasEverBadNetwork?: boolean
  [key: string]: any
}

interface FetchRes {
  result: SyncRes
  arrayBuffer?: ArrayBuffer
  size?: number
  mimeType?: string
}


const toDownload = async (url: string): Promise<FetchRes> => {
  
  let res: Response
  try {
    res = await fetch(url)
  }
  catch(err: any) {
    console.log("toDownload fail........")
    console.log(err)
    console.log(" ")
    const errMsg: unknown = err.toString?.()
    const errName = err.name

    if(errName === "TimeoutError") {
      return { result: "bad_network" }
    }
    if(errName === "AbortError") {
      return { result: "bad_network" }
    }
    
    return { result: "unknown" }
  }

  if(!res.ok) {
    return { result: "bad_network" }
  }

  const status = res.status
  if(status >= 400 && status < 500) {
    return { result: "unknown" }
  }

  const contentLength = res.headers.get("Content-Length")
  const mimeType = res.headers.get("Content-Type")
  let size = contentLength ? Number(contentLength) : undefined
  if(size && isNaN(size)) {
    size = undefined
  }

  let arrayBuffer: ArrayBuffer
  try {
    arrayBuffer = await res.arrayBuffer()
  }
  catch(err) {
    console.log("arrayBuffer() fail........")
    console.log(err)
    console.log(" ")
    return { result: "unknown" }
  }

  return {
    result: "success",
    arrayBuffer,
    size,
    mimeType: mimeType ? mimeType : undefined,
  }
}

const delete_task = async (task: DownloadTaskLocalTable) => {
  const res = await db.download_tasks.delete(task._id)
  console.log("任务删除结果: ")
  console.log(res)
  console.log(" ")
}

const add_fail_time = async (task: DownloadTaskLocalTable) => {
  let tryTimes = task.tryTimes ?? 0
  tryTimes++

  if(tryTimes > 3) {
    console.log("尝试次数已大于 3，去删除...........")
    await delete_task(task)
    return
  }

  const u: Partial<DownloadTaskLocalTable> = {
    tryTimes,
    failedStamp: time.getTime(),
  }
  const res = await db.download_tasks.update(task._id, u)
  console.log("add_fail_time res: ")
  console.log(res)
  console.log(" ")
}

const handle_images = async (imgs: LiuImageStore[]): Promise<HanImgsRes> => {
  const imgs2 = imgs.filter(v => {
    if(v.cloud_url && !v.arrayBuffer) {
      return true
    }
    return false
  })
  if(imgs2.length < 1) {
    // 不要返回 hasEverSuccess 为 true，要不然会消耗一次修改数据库
    return { imgs }
  }

  let hasEverUnknown = false
  let hasEverBadNetwork = false
  let hasEverSuccess = false
  for(let i=0; i<imgs2.length; i++) {
    const v = imgs2[i]
    const url = v.cloud_url as string
    const res = await toDownload(url)
    
    const ret = res.result
    if(ret === "success" && !hasEverSuccess) hasEverSuccess = true
    else if(ret === "bad_network" && !hasEverBadNetwork) hasEverBadNetwork = true
    else if(ret === "unknown" && !hasEverUnknown) hasEverUnknown = true

    if(ret !== "success") continue
    imgs.forEach(v2 => {
      const url2 = v2.cloud_url
      if(!url2 || url2 !== url) return

      v2.arrayBuffer = res.arrayBuffer
      if(res.mimeType) v2.mimeType = res.mimeType
    })
  }

  return {
    hasEverUnknown,
    hasEverBadNetwork,
    hasEverSuccess,
    imgs,
  }
}

/** 只要有任何一个结果为 true，该字段的总结果就为 true */
const judgeHanTaskRes = (taskRes: HanTaskRes, newRes: HanWhateverRes) => {
  if(newRes.hasEverBadNetwork) taskRes.hasEverBadNetwork = true
  if(newRes.hasEverUnknown) taskRes.hasEverUnknown = true
}


const handle_member = async (task: DownloadTaskLocalTable) => {
  const id = task.target_id
  const res = await db.members.get(id)
  if(!res) return {}

  const avatar = res.avatar
  if(!avatar || avatar.arrayBuffer) {
    return {}
  }

  let u: Partial<MemberLocalTable> = {}
  let targetUpdated = false

  const res2 = await handle_images([avatar])
  if(res2.hasEverSuccess) {
    targetUpdated = true
    u.avatar = res2.imgs[0]
  }

  if(targetUpdated) {
    u.updatedStamp = time.getTime()
    const res3 = await db.members.update(id, u)
  }

  return {
    hasEverUnknown: res2.hasEverUnknown,
    hasEverBadNetwork: res2.hasEverBadNetwork,
  }
}

const handle_workspace = async (task: DownloadTaskLocalTable) => {
  const id = task.target_id
  const res = await db.workspaces.get(id)
  if(!res) return {}

  const avatar = res.avatar
  if(!avatar || avatar.arrayBuffer) {
    return {}
  }

  let u: Partial<WorkspaceLocalTable> = {}
  let targetUpdated = false

  const res2 = await handle_images([avatar])
  if(res2.hasEverSuccess) {
    targetUpdated = true
    u.avatar = res2.imgs[0]
  }

  if(targetUpdated) {
    u.updatedStamp = time.getTime()
    const res3 = await db.workspaces.update(id, u)
  }

  return {
    hasEverUnknown: res2.hasEverUnknown,
    hasEverBadNetwork: res2.hasEverBadNetwork,
  }
}

const handle_content = async (task: DownloadTaskLocalTable) => {
  const id = task.target_id
  const res = await db.contents.get(id)
  if(!res) return {}
  const { images = [] } = res

  let u: Partial<ContentLocalTable> = {}
  let targetUpdated = false
  const res0: HanTaskRes = {}

  if(images.length > 0) {
    const res2 = await handle_images(images)
    if(res2.hasEverSuccess) {
      targetUpdated = true
      u.images = res2.imgs
    }
    judgeHanTaskRes(res0, res2)
  }

  if(targetUpdated) {
    u.updatedStamp = time.getTime()
    await db.contents.update(id, u)
  }

  return res0
}

const handle_user = async (task: DownloadTaskLocalTable): Promise<HanTaskRes> => {
  const id = task.target_id
  const res = await db.users.get(id)
  if(!res) return {}

  const avatar = res.avatar
  if(!avatar || avatar.arrayBuffer) {
    return {}
  }

  let u: Partial<UserLocalTable> = {}
  let targetUpdated = false

  const res2 = await handle_images([avatar])
  if(res2.hasEverSuccess) {
    targetUpdated = true
    u.avatar = res2.imgs[0]
  }


  if(targetUpdated) {
    u.updatedStamp = time.getTime()
    const res3 = await db.users.update(id, u)
  }

  return {
    hasEverUnknown: res2.hasEverUnknown,
    hasEverBadNetwork: res2.hasEverBadNetwork,
  }
}


const handle_task = async (task: DownloadTaskLocalTable) => {
  const table = task.target_table

  let res: HanTaskRes | undefined
  if(table === "users") {
    res = await handle_user(task)
  }
  else if(table === "workspaces") {
    res = await handle_workspace(task)
  }
  else if(table === "members") {
    res = await handle_member(task)
  }
  else if(table === "contents") {
    res = await handle_content(task)
  }

  const u = res?.hasEverUnknown
  const b = res?.hasEverBadNetwork
  if(u) {
    await add_fail_time(task)
  }
  if(!b && !u) {
    await delete_task(task)
  }

  return res ? res : {}
}


// 每次查询出 LIMIT 个 download_tasks
const LIMIT = 10

/** worker 入口函数 */
onmessage = async (e) => {
  let times = 0

  // 去轮询，查找 DownloadTaskLocalTable 是否有任务存在
  while(true) {
    times++
    if(times > 10) break

    const now = time.getTime()
    const filterFunc = (task: DownloadTaskLocalTable) => {
      const t1 = task.failedStamp
      if(t1 && (now - t1) < time.MINUTE) return false
      return true      
    }

    const col = db.download_tasks.orderBy("insertedStamp").filter(filterFunc)
    const results = await col.limit(LIMIT).toArray()
    const len = results.length

    if(len < 1) break

    for(let i=0; i<results.length; i++) {
      const v = results[i]
      const res = await handle_task(v)
      if(res.hasEverBadNetwork) {
        postMessage("bad_network")
        return
      }
    }

  }

  postMessage("success")
}