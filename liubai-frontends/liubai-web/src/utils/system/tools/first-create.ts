import { db } from '../../db'
import time from "../../basic/time"
import type { 
  UserLocalTable, 
  WorkspaceLocalTable, 
  MemberLocalTable 
} from "../../../types/types-table"
import ider from '../../basic/ider'
import localReq from "./local-req"

interface CreateData {
  user: UserLocalTable
  workspace: WorkspaceLocalTable
  member: MemberLocalTable
}

export async function firstCreate(tryNum: number = 1): Promise<CreateData | null> {
  if(tryNum > 3) return null

  const user_local = ider.createUserId()
  const workspace_local = ider.createWorkspaceId()
  const member_local = ider.createMemberId()

  const user = await createUser(user_local, workspace_local)
  if(!user) {
    const res0 = await firstCreate(tryNum + 1)
    return res0
  }
  const workspace = await createWorkspace(workspace_local, user_local)
  if(!workspace) {
    localReq.deleteUser(user_local)
    const res0 = await firstCreate(tryNum + 1)
    return res0
  }
  const member = await createMember(member_local, workspace_local, user_local)
  if(!member) {
    localReq.deleteUser(user_local)
    localReq.deleteWorkspace(workspace_local)
    const res0 = await firstCreate(tryNum + 1)
    return res0
  }

  return { user, workspace, member }
}

async function createUser(
  user_local: string,
  workspace_local: string,
): Promise<UserLocalTable | void> {
  const t = time.getTime()
  const data: UserLocalTable = {
    _id: user_local,
    insertedStamp: t,
    updatedStamp: t,
    lastRefresh: t,
  }

  try {
    const res = await db.users.add(data)
  }
  catch(err) {
    return
  }
  
  return data
}

async function createWorkspace(
  workspace_local: string,
  user_local: string,
): Promise<WorkspaceLocalTable | void> {
  const b1 = time.getBasicStampWhileAdding()
  const data: WorkspaceLocalTable = {
    ...b1,
    _id: workspace_local,
    infoType: "ME",
    oState: "OK",
    owner: user_local,
  }
  try {
    const res = await db.workspaces.add(data)
  }
  catch(err) {
    return
  }
  
  return data
}

async function createMember(
  member_local: string,
  workspace_local: string,
  user_local: string,
): Promise<MemberLocalTable | void> {
  const b1 = time.getBasicStampWhileAdding()
  const data: MemberLocalTable = {
    ...b1,
    _id: member_local,
    spaceId: workspace_local,
    user: user_local,
    oState: "OK",
  }
  try {
    const res = await db.members.add(data)
  }
  catch(err) {
    return
  }
  
  return data
}