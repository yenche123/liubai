import { nanoid } from "nanoid"
import { db } from "../../../../utils/db"
import { DraftLocalTable, ContentLocalTable } from "../../../../types/types-table"
import { getLocalPreference } from "../../../../utils/system/local-preference"

function _getUserId(): string {
  const { local_id } = getLocalPreference()
  return local_id as string
}

async function getThreadByThreadId(threadId: string, workspace: string) {
  
}

async function getDraftByThreadId(threadId: string, workspace: string) {

}

async function getDraftById(id: string, workspace: string) {

}

// 什么入参都没有，查看有没有 draft
async function getDraft(workspace: string) {
  const user = _getUserId()
  const w = {
    infoType: "THREAD",
    oState: "OK",
    user,
    workspace,
  }
  const res = await db.drafts.get(w)
  if(!res) return null
  return res
}

async function createDraft() {
  const id = "draft_" + nanoid()

}

async function deleteDraftById(id: string) {

}

async function setDraft() {
  
}

export default {
  getThreadByThreadId,
  getDraftByThreadId,
  getDraftById,
  getDraft,
  createDraft,
  deleteDraftById,
  setDraft,
}