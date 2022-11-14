import { db } from "../../../../utils/db"
import { DraftLocalTable, ContentLocalTable } from "../../../../types/types-table"
import { getLocalPreference } from "../../../../utils/system/local-preference"
import ider from "../../../../utils/basic/ider"

function _getUserId(): string {
  const { local_id } = getLocalPreference()
  return local_id as string
}

async function getThreadByThreadId(threadId: string, workspace: string) {
  const w: Partial<ContentLocalTable> = {
    _id: threadId,
    infoType: "THREAD",
    oState: "OK",
    workspace,
  }
  const res = await db.contents.get(w)
  if(!res) return null
  return res
}

async function getDraftByThreadId(threadId: string, workspace: string) {
  const w: Partial<DraftLocalTable> = {
    infoType: "THREAD",
    oState: "OK",
    workspace,
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

// 什么入参都没有，查看有没有 draft
async function getDraft(workspace: string) {
  const user = _getUserId()
  const w: Partial<DraftLocalTable> = {
    infoType: "THREAD",
    oState: "OK",
    user,
    workspace,
  }
  const res = await db.drafts.get(w)
  if(!res) return null
  return res
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
  console.log("查看 contents 被添加的结果.........")
  console.log(res)
  console.log(" ")
  return res
}

async function updateContent(id: string, data: Partial<ContentLocalTable>) {
  const res = await db.contents.update(id, data)
  console.log("查看 contents 被更新的结果.........")
  console.log(res)
  console.log(" ")
  return res
}

export default {
  getThreadByThreadId,
  getDraftByThreadId,
  getDraftById,
  getDraft,
  deleteDraftById,
  setDraft,
  addContent,
  updateContent,
}