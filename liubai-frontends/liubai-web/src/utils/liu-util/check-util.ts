import reg_exp from "~/config/regular-expressions";
import type { StorageState } from "~/types/types-basic";
import type { CommentShow, ThreadShow } from "~/types/types-content";
import type { ContentLocalTable } from "~/types/types-table";
import time from "../basic/time";


/**
 * 检查 val 是否为 email
 * @param val 需要验证的字符串
 */
function isEmail(val: string) {
  // 最短的 email 应该长这样 a@b.cn 至少有 6 个字符
  if(val.length < 6) {
    return false
  }

  // 使用正则判断是否为 email
  const m = val.match(reg_exp.email_completed)
  const res = Boolean(m?.length)
  if(!res) return false

  // 确保第一个字符和最后一个字符 不会是 \. 和 -
  const tmps = [".", "-"]
  const firstChar = val[0]
  if(tmps.includes(firstChar)) return false
  const lastChar = val[val.length - 1]
  if(tmps.includes(lastChar)) return false

  return true
}

function isAllNumber(val: string, digit?: number) {
  if(digit) {
    if(val.length !== digit) return false
  }
  
  const m = val.match(/^\d+$/g)
  const res = Boolean(m?.length)
  return res
}


interface HasEverSyncedData {
  _id: string
  first_id: string
  [key: string]: any
}

// if thw row has ever synced with cloud
function hasEverSynced(row: HasEverSyncedData) {
  const { _id, first_id } = row
  if(_id !== first_id) return true
  return false
}

function isLocalContent(storageState: StorageState) {
  const isLocal = storageState === "LOCAL" || storageState === "ONLY_LOCAL"
  return isLocal
}

function canUpload(
  row: ContentLocalTable | CommentShow | ThreadShow
) {
  const everSynced = hasEverSynced(row)
  if(!everSynced) return false
  const isLocal = isLocalContent(row.storageState)
  if(isLocal) return false
  return true
}

function isJustAppSetup(
  duration: number = 3000,
) {
  const now = time.getTime()
  const stamp = time.getAppSetupStamp()
  const diff = now - stamp
  return diff <= duration
}


export default {
  isEmail,
  isAllNumber,
  hasEverSynced,
  isLocalContent,
  canUpload,
  isJustAppSetup,
}