import { db } from '../../db'
import time from "../../basic/time"
import type { 
  UserLocalTable, 
  WorkspaceLocalTable, 
  MemberLocalTable 
} from "../../../types/types-table"
import ider from '../../basic/ider'

interface CreateData {
  user_local: string
  workspace_local: string
  member_local: string
}

export async function firstCreate(tryNum: number = 1): Promise<CreateData | null> {
  if(tryNum > 3) return null

  const user_local = ider.createUserId()
  const workspace_local = ider.createWorkspaceId()
  const member_local = ider.createMemberId()

  const res1 = await createUser(user_local, workspace_local)
  if(!res1) {
    const res0 = await firstCreate(tryNum + 1)
    return res0
  }
  const res2 = await createWorkspace(workspace_local, user_local)
  if(!res2) {
    _deleteUser(user_local)
    const res0 = await firstCreate(tryNum + 1)
    return res0
  }
  const res3 = await createMember(member_local, workspace_local, user_local)
  if(!res3) {
    _deleteUser(user_local)
    _deleteWorkspace(workspace_local)
    const res0 = await firstCreate(tryNum + 1)
    return res0
  }

  return { user_local, workspace_local, member_local }
}

async function createUser(
  user_local: string,
  workspace_local: string,
) {
  const t = time.getTime()
  const data: UserLocalTable = {
    _id: user_local,
    oState: "NORMAL",
    createdStamp: t,
    updatedStamp: t,
    lastRefresh: t,
    workspaces: [workspace_local]
  }

  try {
    const res = await db.users.add(data)
  }
  catch(err) {
    return false
  }
  
  return true
}

async function createWorkspace(
  workspace_local: string,
  user_local: string,
) {
  const t = time.getTime()
  const data: WorkspaceLocalTable = {
    _id: workspace_local,
    infoType: "ME",
    oState: "OK",
    owner: user_local,
    createdStamp: t,
    updatedStamp: t,
  }
  try {
    const res = await db.workspaces.add(data)
  }
  catch(err) {
    return false
  }
  
  return true
}

async function createMember(
  member_local: string,
  workspace_local: string,
  user_local: string,
) {
  const t = time.getTime()
  const data: MemberLocalTable = {
    _id: member_local,
    workspace: workspace_local,
    createdStamp: t,
    updatedStamp: t,
    user: user_local,
    oState: "OK",
  }
  try {
    const res = await db.members.add(data)
  }
  catch(err) {
    return false
  }
  
  return true
}

async function _deleteUser(user_local: string) {
  const del = await db.users.delete(user_local)
  console.log("user 被删除了.........")
  console.log(del)
  console.log(" ")
}

async function _deleteWorkspace(workspace_local: string) {
  const del = await db.workspaces.delete(workspace_local)
  console.log("workspace 被删除了.........")
  console.log(del)
  console.log(" ")
}