import { db } from "~/utils/db"
import type { DraftLocalTable, ContentLocalTable } from "~/types/types-table"
import localCache from "~/utils/system/local-cache"
import { LocalToCloud } from "~/utils/cloud/LocalToCloud"
import time from "~/utils/basic/time"
import valTool from "~/utils/basic/val-tool"

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

async function getDraftByFirstId(first_id: string) {
  const res = await db.drafts.where({ first_id }).toArray()
  if(!res || res.length < 1) return
  return res[0]
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
) {
  // 1. wait for 1 second, to make sure some pending tasks have been uploaded
  await valTool.waitMilli(1000)

  // 2. get the latest id
  let theDraft = await getDraftById(id)
  if(!theDraft) {
    theDraft = await getDraftByFirstId(id)
  }
  if(!theDraft) return
  console.log("old draft id: ", id)
  id = theDraft._id
  console.log("new draft id: ", id)

  // 3. clear the draft instantly
  LocalToCloud.clearDraft({
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