import { db } from "~/utils/db"
import type { DraftLocalTable, ContentLocalTable } from "~/types/types-table"
import localCache from "~/utils/system/local-cache"
import { LocalToCloud } from "~/utils/cloud/LocalToCloud"
import time from "~/utils/basic/time"
import liuUtil from "~/utils/liu-util"

function _getUserId(): string {
  const { local_id } = localCache.getPreference()
  return local_id as string
}

async function getContentById(threadId: string) {
  const w: Partial<ContentLocalTable> = {
    _id: threadId,
    infoType: "THREAD",
    oState: "OK",
  }
  const res = await db.contents.get(w)
  return res
}

async function getDraftByThreadId(threadId: string) {
  const user = _getUserId()
  const w: Partial<DraftLocalTable> = {
    infoType: "THREAD",
    user,
    threadEdited: threadId,
  }
  const res = await db.drafts.get(w)
  if(!res) return null
  return res
}

async function getDraftById(id: string) {
  const res = await db.drafts.get(id)
  return res
}

// 根据 workspace，来查询有没有 draft 并且 threadEdited / commentEdited 为空的情况
async function getDraft(spaceId: string) {
  const user = _getUserId()
  const w: Partial<DraftLocalTable> = {
    infoType: "THREAD",
    user,
    spaceId,
  }

  const _filter = (v: DraftLocalTable) => {
    if(v.threadEdited) return false
    if(v.commentEdited) return false
    const oState = v.oState
    if(oState === "DELETED" || oState === "POSTED") {
      return false
    }
    return true
  }

  const q = db.drafts.where(w).filter(_filter).limit(1)
  const res = await q.reverse().sortBy("editedStamp")
  if(!res || res.length < 1) return null
  return res[0]
}

async function deleteDraftById(
  id: string,
) {
  await db.drafts.delete(id)
}

async function setDraftAsPosted(
  id: string,
) {
  const now = time.getTime()
  const u: Partial<DraftLocalTable> = {
    oState: "POSTED",
    updatedStamp: now,
  }
  await db.drafts.update(id, u)
}

async function clearDraftOnCloud(
  id: string,
  originDraft?: DraftLocalTable,
) {
  if(!originDraft) {
    const res = await db.drafts.get(id)
    if(!res) return
    originDraft = res
  }

  const synced = liuUtil.check.hasEverSynced(originDraft)
  if(!synced) {
    console.warn("没有同步过，还是去远端删除！......")
  }

  LocalToCloud.addTask({
    uploadTask: "draft-clear",
    target_id: id,
    operateStamp: time.getTime(),
  })
}


async function setDraft(data: DraftLocalTable) {
  const res = await db.drafts.put(data)
  return res
}

async function addContent(data: ContentLocalTable) {
  const res = await db.contents.add(data)
  // console.log("查看 contents 被添加的结果.........")
  // console.log(res)
  // console.log(" ")
  return res
}

async function updateContent(id: string, data: Partial<ContentLocalTable>) {
  const res = await db.contents.update(id, data)
  // console.log("查看 contents 被更新的结果.........")
  // console.log(res)
  // console.log(" ")
  return res
}

export default {
  getContentById,
  getDraftByThreadId,
  getDraftById,
  getDraft,
  deleteDraftById,
  setDraftAsPosted,
  clearDraftOnCloud,
  setDraft,
  addContent,
  updateContent,
}