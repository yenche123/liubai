// Function Name: sync-operate

import cloud from '@lafjs/cloud'
import { 
  AiToolUtil, 
  checker, 
  encryptDataWithAES, 
  getAESKey, 
  getDocAddId, 
  SpaceUtil, 
  verifyToken,
} from '@/common-util'
import * as vbot from "valibot"
import { 
  type CryptoCipherAndIV, 
  type LiuRqReturn, 
  type Table_AiChat, 
  type Table_AiRoom, 
  type Table_Content, 
  type Table_Member, 
  type Table_User, 
  type Table_Workspace,
  type DataPass,
  SyncOperateAPI,
} from '@/common-types'
import { getBasicStampWhileAdding, getNowStamp } from './common-time'
import { createThreadId } from '@/common-ids'

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
    res = await agree_aichat(user, b.chatId)
  }
  else if(b.operateType === "get-aichat") {
    // for compose-page
    res = await get_aichat(user, b.chatId)
  }
  
  return res
}


interface SharedData {
  funcName: string
  funcJson: Record<string, any>
  theChat: Table_AiChat
  theRoom: Table_AiRoom
}

async function get_aichat(
  user: Table_User,
  chatId: string,
): Promise<LiuRqReturn<SyncOperateAPI.Res_GetAichat>> {
  // 1. get shared data
  const data1 = await getSharedData(user, chatId)
  if(!data1.pass) return data1.err
  const { funcName, funcJson, theChat } = data1.data

  // 2. return directly if there is a content associated with this chat
  if(theChat.contentId) {
    return {
      code: "0000",
      data: {
        operateType: "get-aichat",
        result: "created",
        contentId: theChat.contentId
      }
    }
  }

  // 3. get waiting data
  const waitingData = AiToolUtil.turnJsonToWaitingData(funcName, funcJson, user)
  if(!waitingData) {
    return { code: "E5001", errMsg: "fail to get waitingData" }
  }

  return {
    code: "0000",
    data: {
      operateType: "get-aichat",
      result: "waiting",
      waitingData,
    }
  }
}

async function agree_aichat(
  user: Table_User,
  chatId: string,
): Promise<LiuRqReturn<SyncOperateAPI.Res_AgreeAichat>> {
  // 1. get shared data
  const data1 = await getSharedData(user, chatId)
  if(!data1.pass) return data1.err
  const { funcName, funcJson, theChat } = data1.data

  // 2. return if there is a content associated with this chat
  let contentType: SyncOperateAPI.ContentType = "note"
  if(funcName === "add_todo") contentType = "todo"
  else if(funcName === "add_calendar") contentType = "calendar"
  if(theChat.contentId) {
    return { 
      code: "0000", 
      data: {
        operateType: "agree-aichat",
        contentType,
        contentId: theChat.contentId
      },
    }
  }

  // 3. get my personal space & member
  const spaceAndMember = await getMyPersonalSpaceAndMember(user._id)
  if(!spaceAndMember) {
    return { code: "E5001", errMsg: "fail to get my space or member" }
  }
  const { space, member } = spaceAndMember

  // 4. construct content
  const waitingData = AiToolUtil.turnJsonToWaitingData(funcName, funcJson, user)
  if(!waitingData) {
    return { code: "E5001", errMsg: "fail to get waitingData" }
  }

  // 5. encrypt waitingData
  const aesKey = getAESKey() ?? ""
  const enc_title = encryptDataWithAES(waitingData.title, aesKey)
  let enc_desc: CryptoCipherAndIV | undefined
  if(waitingData.liuDesc) {
    enc_desc = encryptDataWithAES(waitingData.liuDesc, aesKey)
  }
  // TODO: enc_search_text

  // 6. construct content
  const b6 = getBasicStampWhileAdding()
  const first_id = createThreadId()
  const newContent: Partial<Table_Content> = {
    ...b6,
    first_id,
    user: user._id,
    member: member._id,
    spaceId: space._id,
    spaceType: space.infoType,

    infoType: "THREAD",
    oState: "OK",
    visScope: "DEFAULT",
    storageState: "CLOUD",
    aiReadable: "Y",

    enc_title,
    enc_desc,

    calendarStamp: waitingData.calendarStamp,
    remindStamp: waitingData.remindStamp,
    whenStamp: waitingData.whenStamp,
    remindMe: waitingData.remindMe,
    emojiData: { total: 0, system: [] },

    createdStamp: b6.insertedStamp,
    editedStamp: b6.insertedStamp,

    levelOne: 0,
    levelOneAndTwo: 0,
    aiCharacter: theChat.character,
  }

  // 7. check out TODO
  let todoIdx = -1
  if(funcName === "add_todo") {
    const sCfg9 = space.stateConfig ?? SpaceUtil.getDefaultStateCfg()
    sCfg9.stateList?.forEach((v, i) => {
      if(v.id === "TODO") {
        todoIdx = i
      }
    })
    if(todoIdx >= 0) {
      newContent.stateId = "TODO"
    }
  }
  console.log("see newContent: ")
  console.log(newContent)

  // 8. save content
  const cCol = db.collection("Content")
  const res8 = await cCol.add(newContent)
  const contentId = getDocAddId(res8)
  if(!contentId) {
    return { code: "E5001", errMsg: "fail to get contentId" }
  }

  // 9. update stateConfig of space
  if(todoIdx >= 0) {
    addNewContentIntoKanban(contentId, "TODO", space)
  }

  // 10. update ai chat
  const now10 = getNowStamp()
  const u10: Partial<Table_AiChat> = { contentId, updatedStamp: now10 }
  const aCol = db.collection("AiChat")
  aCol.doc(chatId).update(u10)

  return { 
    code: "0000", 
    data: {
      operateType: "agree-aichat",
      contentType,
      contentId,
    },
  }
}


async function getSharedData(
  user: Table_User,
  chatId: string,
): Promise<DataPass<SharedData>> {
  // 1. get the ai chat
  const aiChatCol = db.collection("AiChat")
  const res1 = await aiChatCol.doc(chatId).get<Table_AiChat>()
  const theChat = res1.data
  
  if(!theChat) {
    return { 
      pass: false, 
      err: { code: "E4004", errMsg: "ai chat not found" }
    }
  }
  const { funcName, funcJson } = theChat
  if(!funcName || !funcJson) {
    return {
      pass: false,
      err: { code: "E5001", errMsg: "funcName or funcJson is empty" }
    }
  }

  // 2. get the room
  const roomId = theChat.roomId
  const rCol = db.collection("AiRoom")
  const res2 = await rCol.doc(roomId).get<Table_AiRoom>()
  const theRoom = res2.data
  if(!theRoom) {
    return { 
      pass: false, 
      err: { code: "E4004", errMsg: "ai room not found" }
    }
  }

  // 3. check out permission
  if(theRoom.owner !== user._id) {
    return { 
      pass: false, 
      err: { code: "E4003", errMsg: "permission denied" }
    }
  }

  return {
    pass: true,
    data: {
      funcName,
      funcJson,
      theChat,
      theRoom,
    }
  }
}


async function addNewContentIntoKanban(
  contentId: string,
  stateId: string,
  space: Table_Workspace,
) {
  // 1. get the specific kanban
  const spaceId = space._id
  const sCfg = space.stateConfig ?? SpaceUtil.getDefaultStateCfg()
  const stateList = sCfg.stateList
  const theState = stateList.find(v => v.id === stateId)
  if(!theState) return

  // 2. update the kanban
  const now = getNowStamp()
  const ids = theState.contentIds ?? []
  ids.push(contentId)
  if(ids.length > 16) {
    ids.pop()
  }
  theState.contentIds = ids
  theState.updatedStamp = now
  sCfg.updatedStamp = now

  // 3. construct update data
  const d3: Partial<Table_Workspace> = {
    stateConfig: sCfg,
    updatedStamp: now,
  }
  const wCol = db.collection("Workspace")
  const res3 = await wCol.doc(spaceId).update(d3)

  console.warn("addNewContentIntoKanban res3: ")
  console.log(res3)

  return true
}


function preCheck(
  body: Record<string, any>,
) {
  // checking out the AES key of backend
  const backendAESKey = getAESKey()
  if(!backendAESKey) {
    return { code: "E5001", errMsg: "no backend AES key" }
  }

  // checking out the body
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