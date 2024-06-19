import { db } from "~/utils/db"
import time from "~/utils/basic/time"
import type { 
  MainToChildMessage, 
  SyncResState, 
  SyncResult,
} from "../tools/types"
import type { LiuFileStore, LiuImageStore } from "~/types"
import type { 
  DownloadTaskLocalTable, 
  MemberLocalTable,
  WorkspaceLocalTable,
  ContentLocalTable,
  DraftLocalTable,
} from "~/types/types-table"
import { initWorker } from "./tools/worker-funcs"

interface HanTaskRes {
  hasEverUnknown?: boolean
  hasEverBadNetwork?: boolean
  hasEverKnownErr?: boolean
  all_results?: SyncResState[]
}

interface HanFilesRes {
  hasEverUnknown?: boolean
  hasEverBadNetwork?: boolean
  hasEverSuccess?: boolean
  hasEverKnownErr?: boolean
  files: LiuFileStore[]
}

interface HanImgsRes {
  hasEverUnknown?: boolean
  hasEverBadNetwork?: boolean
  hasEverSuccess?: boolean
  hasEverKnownErr?: boolean
  results: SyncResState[]
  imgs: LiuImageStore[]
}

interface HanWhateverRes {
  hasEverUnknown?: boolean
  hasEverBadNetwork?: boolean
  hasEverKnownErr?: boolean
  results?: SyncResState[]
  [key: string]: any
}

interface FetchRes {
  result: SyncResState
  arrayBuffer?: ArrayBuffer
  size?: number
  mimeType?: string
}


const toDownload = async (url: string): Promise<FetchRes> => {
  
  let res: Response
  try {
    res = await fetch(url, {
      // mode: "no-cors",
    })
  }
  catch(err: any) {
    console.log("toDownload fail........")
    console.log(url)
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

  // console.log("toDownload result: ")
  // console.log("status: ", res.status)
  // console.log("statusText: ", res.statusText)
  // console.log(res.ok)
  // console.log(res.headers)
  // console.log("type: ", res.type)
  // console.log("body", res.body)
  // console.log("bodyUsed: ", res.bodyUsed)
  // console.log("redirected: ", res.redirected)
  // console.log("url: ", res.url)
  // console.log(" ")

  const status = res.status
  if(status === 403 || status === 404) {
    return { result: "known_err" }
  }

  if(status >= 400 && status < 500) {
    return { result: "unknown" }
  }

  if(status === 0 && res.type === "opaque") {
    return { result: "opaque" }
  }

  if(!res.ok) {
    return { result: "bad_network" }
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
}

const handle_images = async (
  imgs: LiuImageStore[]
): Promise<HanImgsRes> => {
  const imgs2 = imgs.filter(v => {
    if(v.cloud_url && !v.arrayBuffer) {
      return true
    }
    return false
  })
  if(imgs2.length < 1) {
    // 不要返回 hasEverSuccess 为 true，要不然会消耗一次修改数据库
    return { imgs, results: [] }
  }

  let hasEverUnknown = false
  let hasEverBadNetwork = false
  let hasEverSuccess = false
  let hasEverKnownErr = false
  const results: SyncResState[] = []
  for(let i=0; i<imgs2.length; i++) {
    const v = imgs2[i]
    const url = v.cloud_url as string
    const res = await toDownload(url)
    
    const ret = res.result
    results.push(ret)
    if(ret === "success" && !hasEverSuccess) hasEverSuccess = true
    else if(ret === "known_err" && !hasEverKnownErr) hasEverKnownErr = true
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
    hasEverKnownErr,
    results,
    imgs,
  }
}

/** 只要有任何一个结果为 true，该字段的总结果就为 true */
const judgeHanTaskRes = (
  taskRes: HanTaskRes, 
  newRes: HanWhateverRes,
) => {
  if(newRes.hasEverBadNetwork) taskRes.hasEverBadNetwork = true
  if(newRes.hasEverUnknown) taskRes.hasEverUnknown = true
  if(newRes.hasEverKnownErr) taskRes.hasEverKnownErr = true
  if(newRes.results?.length) {
    if(!taskRes.all_results) taskRes.all_results = []
    taskRes.all_results.push(...newRes.results)
  }
}


const handle_member = async (
  task: DownloadTaskLocalTable
): Promise<HanTaskRes> => {
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
    all_results: res2.results,
  }
}

const handle_workspace = async (
  task: DownloadTaskLocalTable
): Promise<HanTaskRes> => {
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
    all_results: res2.results,
  }
}

const handle_content = async (
  task: DownloadTaskLocalTable
) => {
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

const handle_draft = async (
  task: DownloadTaskLocalTable
) => {
  const id = task.target_id
  const res = await db.drafts.get(id)
  if(!res) return {}
  const { images = [] } = res

  let u: Partial<DraftLocalTable> = {}
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
    await db.drafts.update(id, u)
  }
  return res0
}

const handle_task = async (
  task: DownloadTaskLocalTable
): Promise<HanTaskRes> => {
  const table = task.target_table

  let res: HanTaskRes | undefined
  if(table === "workspaces") {
    res = await handle_workspace(task)
  }
  else if(table === "members") {
    res = await handle_member(task)
  }
  else if(table === "contents") {
    res = await handle_content(task)
  }
  else if(table === "drafts") {
    res = await handle_draft(task)
  }

  const ever_unknown = res?.hasEverUnknown
  const bad_network = res?.hasEverBadNetwork
  const known_err = res?.hasEverKnownErr

  const onlyKnownErr = Boolean(known_err && !ever_unknown && !bad_network)
  const hasErr = Boolean(ever_unknown || known_err)
  const onlySuccess = Boolean(!bad_network && !ever_unknown && !known_err)

  // console.log("handle_task res: ", res)
  // console.log("onlyKnownErr: ", onlyKnownErr)
  // console.log("hasErr: ", hasErr)
  // console.log("onlySuccess: ", onlySuccess)
  // console.log(" ")

  if(onlyKnownErr) {
    // 1. 如果只有已知错误，没有其他错误，那么直接去删除
    await delete_task(task)
  }
  else if(hasErr) {
    // 2. 如果有未知或已知的错误，那么尝试次数加 1
    await add_fail_time(task)
  }
  else if(onlySuccess) {
    // 3. 如果没有任何错误（包括网络请求失败）
    await delete_task(task)
  }

  return res ? res : {}
}


// 每次查询出 LIMIT 个 download_tasks
const LIMIT = 10

/** worker 入口函数 */
onmessage = async (e) => {

  const msg = e.data as MainToChildMessage
  initWorker(msg)

  let times = 0
  const res0: SyncResult = {
    state: "success",
    all_states: [],
  }

  // 1. 去轮询，查找 DownloadTaskLocalTable 是否有任务存在
  while(true) {
    times++
    if(times > 10) break

    const now = time.getTime()
    const _filterFunc = (task: DownloadTaskLocalTable) => {
      const t1 = task.failedStamp
      if(t1 && (now - t1) < time.MINUTE) return false
      return true      
    }

    // 1.1 去加载出 download_tasks
    const col_1 = db.download_tasks.orderBy("insertedStamp")
    const col_2 = col_1.filter(_filterFunc)
    const results = await col_2.limit(LIMIT).toArray()
    const len = results.length

    // 1.2 如果没有任何任务，退出
    if(len < 1) {
      // console.log("没有下载任务 break")
      break
    }

    // 1.3 处理当批次加载出来的任务
    for(let i=0; i<results.length; i++) {
      const v = results[i]
      const res13 = await handle_task(v)

      if(res13.all_results) {
        res0.all_states.push(...res13.all_results)
      }

      if(res13.hasEverBadNetwork) {
        res0.state = "bad_network"
        postMessage(res0)
        return
      }
    }
  }

  postMessage(res0)
}