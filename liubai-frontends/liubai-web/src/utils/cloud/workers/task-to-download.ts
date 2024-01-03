import { db } from "~/utils/db"
import time from "~/utils/basic/time"
import type { DownloadRes } from "../tools/types"
import type { LiuFileStore, LiuImageStore } from "~/types"
import type { 
  DownloadTaskLocalTable, 
  MemberLocalTable, 
  UserLocalTable, 
  WorkspaceLocalTable,
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

interface FetchRes {
  result: DownloadRes
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

// 给定一组 LiuFileStore，下载完成后返回一组新的 LiuFileStore
const handle_files = async (files: LiuFileStore[]): Promise<HanFilesRes> => {
  const files2 = files.filter(v => {
    if(v.cloud_url && !v.arrayBuffer) {
      return true
    }
    return false
  })
  if(files2.length < 1) return { hasEverSuccess: true, files }

  let hasEverUnknown = false
  let hasEverBadNetwork = false
  let hasEverSuccess = false
  for(let i=0; i<files2.length; i++) {
    const v = files2[i]
    const url = v.cloud_url as string
    const res = await toDownload(url)
    console.log("看一下文件, 下载结果: ")
    console.log(res)
    console.log(" ")

    const ret = res.result
    if(ret === "success" && !hasEverSuccess) hasEverSuccess = true
    else if(ret === "bad_network" && !hasEverBadNetwork) hasEverBadNetwork = true
    else if(ret === "unknown" && !hasEverUnknown) hasEverUnknown = true

    if(ret !== "success") continue
    files.forEach(v2 => {
      const url2 = v2.cloud_url
      if(!url2 || url2 !== url) return

      v2.arrayBuffer = res.arrayBuffer
      if(res.size) v2.size = res.size
      if(res.mimeType) v2.mimeType = res.mimeType
    })
  }
  
  return {
    hasEverUnknown,
    hasEverBadNetwork,
    hasEverSuccess,
    files,
  }
}

const handle_images = async (imgs: LiuImageStore[]): Promise<HanImgsRes> => {
  const imgs2 = imgs.filter(v => {
    if(v.cloud_url && !v.arrayBuffer) {
      return true
    }
    return false
  })
  if(imgs2.length < 1) return { hasEverSuccess: true, imgs }

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


/** worker 入口函数 */
onmessage = async (e) => {
  let times = 0

  // 每次查询出 LIMIT 个 download_tasks
  const LIMIT = 10

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