import cloud from '@lafjs/cloud'
import { AiToolUtil, checker, verifyToken } from '@/common-util'
import * as vbot from "valibot"
import { LiuRqReturn, SyncOperateAPI, Table_AiChat, Table_AiRoom, Table_Content, Table_Member, Table_User, Table_Workspace } from '@/common-types'
import { getBasicStampWhileAdding } from './common-time'

const db = cloud.database()
const _ = db.command

export async function main(ctx: FunctionContext) {

  // 1. pre-check
  const body = ctx.request?.body ?? {}
  const err1 = preCheck(body)
  if(err1) return err1

  // 2. verify token
  const vRes = await verifyToken(ctx, body)
  if(!vRes.pass) return vRes.rqReturn
  const user = vRes.userData
  
  // 3. decide which path to run
  let res: LiuRqReturn = { code: "E4000" }
  const b = body as SyncOperateAPI.Param
  if(b.operateType === "agree-aichat") {

  }
  else if(b.operateType === "get-aichat") {

  }
  
  return res
}


async function agree_aichat(
  user: Table_User,
  chatId: string,
) {
  // 1. get the ai chat
  const aiChatCol = db.collection("AiChat")
  const res1 = await aiChatCol.doc(chatId).get<Table_AiChat>()
  const theChat = res1.data
  if(!theChat) {
    return { code: "E4004", errMsg: "ai chat not found" }
  }
  const { funcName, funcJson } = theChat
  if(!funcName || !funcJson) {
    return { code: "E5001", errMsg: "funcName or funcJson is empty" }
  }

  // 2. get the room
  const roomId = theChat.roomId
  const rCol = db.collection("AiRoom")
  const res2 = await rCol.doc(roomId).get<Table_AiRoom>()
  const theRoom = res2.data
  if(!theRoom) {
    return { code: "E4004", errMsg: "ai room not found" }
  }

  // 3. check out permission
  if(theRoom.owner !== user._id) {
    return { code: "E4003", errMsg: "permission denied" }
  }

  // 4. return if there is a content associated with this chat
  if(theChat.contentId) {
    let contentType: SyncOperateAPI.ContentType = "note"
    if(funcName === "add_todo") contentType = "todo"
    else if(funcName === "add_calendar") contentType = "calendar"
    
    return { 
      code: "0000", 
      data: {
        operateType: "agree-aichat",
        contentType,
        contentId: theChat.contentId
      },
    }
  }

  // 5. get my personal space & member
  const spaceAndMember = await getMyPersonalSpaceAndMember(user._id)
  if(!spaceAndMember) {
    return { code: "E5001", errMsg: "fail to get my space or member" }
  }

  // 6. construct content
  const waitingData = AiToolUtil.turnJsonToWaitingData(funcName, funcJson, user)
  if(!waitingData) {
    return { code: "E5001", errMsg: "fail to get waitingData" }
  }

  // encrypt waitingData


  const b6 = getBasicStampWhileAdding()
  const d6: Partial<Table_Content> = {
    ...b6,
    infoType: "THREAD",
    oState: "OK",
    user: user._id,
  }
  console.log("see d6: ")
  console.log(d6)


  

}


function preCheck(
  body: Record<string, any>,
) {
  const sch = SyncOperateAPI.Sch_Param
  const res1 = vbot.safeParse(sch, body)
  if(!res1.success) {
    const errMsg = checker.getErrMsgFromIssues(res1.issues)
    return { code: "E4000", errMsg }
  }
}

async function getMyPersonalSpaceAndMember(
  userId: string,
) {
  const wCol = db.collection("Workspace")
  const w1: Partial<Table_Workspace> = {
    owner: userId,
    infoType: "ME",
  }
  const res1 = await wCol.where(w1).getOne<Table_Workspace>()
  const space = res1.data
  if(!space) return

  const mCol = db.collection("Member")
  const w2: Partial<Table_Member> = {
    spaceType: "ME",
    spaceId: space._id,
    user: userId,
  }
  const res2 = await mCol.where(w2).getOne<Table_Member>()
  const member = res2.data
  if(!member) return

  return {
    space,
    member,
  }
}