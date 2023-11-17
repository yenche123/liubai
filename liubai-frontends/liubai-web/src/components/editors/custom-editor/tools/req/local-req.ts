import { db } from "~/utils/db"
import type { DraftLocalTable, ContentLocalTable } from "~/types/types-table"
import localCache from "~/utils/system/local-cache"
import ider from "~/utils/basic/ider"

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
  if(!res) return null
  return res
}

async function getDraftByThreadId(threadId: string) {
  const w: Partial<DraftLocalTable> = {
    infoType: "THREAD",
    oState: "OK",
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

// 根据 workspace，来查询有没有 draft 并且 threadEdited 为空的情况
async function getDraft(spaceId: string) {
  const user = _getUserId()
  const w: Partial<DraftLocalTable> = {
    infoType: "THREAD",
    oState: "OK",
    user,
    spaceId,
  }
  const res = await db.drafts.where(w).filter(v => !Boolean(v.threadEdited)).toArray()
  if(!res || res.length < 1) return null
  return res[0]
}

async function deleteDraftById(id: string) {
  await db.drafts.delete(id)
}

async function setDraft(data: Partial<DraftLocalTable>) {
  if(!data._id) data._id = ider.createDraftId()
  const res = await db.drafts.put(data as DraftLocalTable)
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
  setDraft,
  addContent,
  updateContent,
}