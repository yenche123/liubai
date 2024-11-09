// Function Name: ai-entrance

import type { 
  AiBot,
  Partial_Id, 
  Table_AiChat, 
  Table_AiRoom, 
  Table_User, 
  Wx_Gzh_Send_Msg,
} from "@/common-types"
import OpenAI from "openai"
import { 
  checkAndGetWxGzhAccessToken, 
  checkIfUserSubscribed, 
  getDocAddId,
  valTool,
} from "@/common-util"
import { sendWxMessage } from "@/service-send"
import { getBasicStampWhileAdding, getNowStamp } from "@/common-time"
import { aiBots } from "@/ai-prompt"
import cloud from "@lafjs/cloud"

const db = cloud.database()

/********************* constants ***********************/
const MAX_BOTS = 3
const MAX_TOKEN_1 = 8000
const TOKEN_NEED_COMPRESS = 6000

/************************** types ************************/
interface HistoryData {
  results: Table_AiChat[]
  totalToken: number
}

/********************* empty function ****************/
export async function main(ctx: FunctionContext) {
  console.log("do nothing with ai-entrance")
  return true
}

export interface AiEntrance {
  user: Table_User
  text?: string
  wx_gzh_openid?: string
}

export async function enter_ai(
  entry: AiEntrance,
) {

  // 1. check out text
  const text = entry.text
  if(!text) return

  // 2. check out directive
  const isDirective = AiDirective.check(entry)
  if(isDirective) return

  // 3. check out quota
  const isQuotaEnough = await AiHelper.checkQuota(entry)
  if(!isQuotaEnough) return

  // 4. get my ai room
  const room = await AiHelper.getMyAiRoom(entry)
  if(!room) return
  const roomId = room._id

  // 5. add the current message into db
  const chatId = await AiHelper.addUserMsg(entry, roomId)
  if(!chatId) return

  // 6. get latest chat record
  const res6 = await AiHelper.getLatestChat(roomId)




  






}


async function sendToWxGzh(
  wx_gzh_openid: string,
  obj: Wx_Gzh_Send_Msg,
) {
  const accessToken = await checkAndGetWxGzhAccessToken()
  if(!accessToken) return
  const res = await sendWxMessage(wx_gzh_openid, accessToken, obj)
  return res
}


/** check out if it's a directive, like "召唤..." */
class AiDirective {

  static check(entry: AiEntrance) {

    // 1. get text
    const text = entry.text
    if(!text) return false

    // 2. is it a kick directive?
    const text2 = text.trim().replace("+", " ")
    const botKicked = this.isKickBot(text2)
    if(botKicked) {
      this.toKickBot(entry, botKicked)
      return true
    }

    // 3. is it an adding directive?
    const botAdded = this.isAddBot(text2)
    if(botAdded) {
      this.toAddBot(entry, botAdded)
      return true
    }

    return false
  }

  private static async toKickBot(entry: AiEntrance, bot: AiBot) {

    // 1. get the user's ai room
    const room = await AiHelper.getMyAiRoom(entry)
    if(!room) return

    // 2. find the bot in the room
    const theBot = room.bots.find(v => v === bot.character)
    if(!theBot) return

    // 3. remove the bot from the room
    const newBots = room.bots.filter(v => v !== bot.character)
    const u3: Partial<Table_AiRoom> = {
      bots: newBots,
      updatedStamp: getNowStamp(),
    }
    const rCol = db.collection("AiRoom")
    const res3 = await rCol.doc(room._id).update(u3)

    console.log("toKickBot res3: ")
    console.log(res3)

    return res3    
  }

  private static async toAddBot(entry: AiEntrance, bot: AiBot) {
    // 1. get the user's ai room
    const room = await AiHelper.getMyAiRoom(entry)
    if(!room) return
    const bots = room.bots

    // 2. find the bot in the room
    const theBot = bots.find(v => v === bot.character)
    if(theBot) return

    // 3. check out if the room has reached the max bots
    if(bots.length >= MAX_BOTS) return

    // 4. add the bot to the room
    const newBots = [...bots, bot.character]
    const u4: Partial<Table_AiRoom> = {
      bots: newBots,
      updatedStamp: getNowStamp(),
    }
    const rCol = db.collection("AiRoom")
    const res4 = await rCol.doc(room._id).update(u4)

    console.log("toAddBot res4: ")
    console.log(res4)

    return true
  }

  private static isKickBot(text: string) {
    const prefix = ["踢掉", "移除"]
    let prefixMatched = prefix.find(v => text.startsWith(v))
    if(!prefixMatched) return

    const otherText = text.substring(prefixMatched.length).trim()
    const botMatched = aiBots.find(v => {
      if(v.name === otherText) return true
      if(v.alias.includes(otherText)) return true
      return false
    })

    return botMatched
  }

  private static isAddBot(text: string) {
    const prefix = ["召唤", "添加", "呼叫"]
    let prefixMatched = prefix.find(v => text.startsWith(v))
    if(!prefixMatched) return

    const otherText = text.substring(prefixMatched.length).trim()
    const botMatched = aiBots.find(v => {
      if(v.name === otherText) return true
      if(v.alias.includes(otherText)) return true
      return false
    })
    return botMatched
  }

}



class Zhipu {

  private _client: OpenAI | undefined

  constructor() {
    const _this = this
    const _env = process.env
    const apiKey = _env.LIU_ZHIPU_API_KEY
    const baseURL = _env.LIU_ZHIPU_BASE_URL
    try {
      _this._client = new OpenAI({ apiKey, baseURL })
    } catch(err) {
      console.warn("Zhipu constructor gets client error: ")
      console.log(err)
    }
  }

  async chat(
    params: OpenAI.Chat.ChatCompletionCreateParams,
  ) {
    const client = this._client
    if(!client) return

    try {
      const t1 = getNowStamp()
      const chatCompletion = await client.chat.completions.create(params)
      const t2 = getNowStamp()
      const cost = t2 - t1
      console.log(`zhipu chat cost: ${cost}ms`)
      return chatCompletion as OpenAI.Chat.ChatCompletion
    }
    catch(err) {
      console.warn("zhipu chat error: ")
      console.log(err)
    }
  }

}


/*********************** AI Controller ************************/
class AiController {

  run(
    entry: AiEntrance,
    room: Table_AiRoom,
    historyData: HistoryData,
  ) {
    // 1. compress history data
    let promptToken = historyData.totalToken
    if(promptToken > TOKEN_NEED_COMPRESS) {
      // WIP: compress

    }

    

  }


}



/*********************** helper functions ************************/

class AiHelper {

  static async getMyAiRoom(
    entry: AiEntrance,
  ) {
    // 1. get room
    const userId = entry.user._id
    const rCol = db.collection("AiRoom")
    const res1 = await rCol.where({ owner: userId }).getOne<Table_AiRoom>()
    const room = res1.data
    if(room) return room
  
    // 2. create room
    const b2 = getBasicStampWhileAdding()
    const room2: Partial_Id<Table_AiRoom> = {
      ...b2,
      owner: userId,
      bots: [],
    }
    const res2 = await rCol.add(room2)
    const roomId = getDocAddId(res2)
    if(!roomId) {
      console.warn("cannot get roomId while creating ai room error")
      console.log(res2)
      console.log("entry: ")
      console.log(entry)
      return
    }
  
    // 3. return room
    const newRoom: Table_AiRoom = { _id: roomId, ...room2 }
    return newRoom
  }


  static async checkQuota(
    entry: AiEntrance,
  ) {
    const user = entry.user
    const quota = user.quota
    if(!quota) return true

    const count = quota.aiConversationCount
    const isSubscribed = checkIfUserSubscribed(user)
    const MAX_TIMES = isSubscribed ? 200 : 10

    const available = count < MAX_TIMES
    if(!available) {
      // WIP: send message to user: "please upgrade your subscription to continue"

    }

    return available
  }

  static async addUserMsg(
    entry: AiEntrance,
    roomId: string,
  ) {
    const text = entry.text
    const userId = entry.user._id
    const b1 = getBasicStampWhileAdding()
    const data1: Partial_Id<Table_AiChat> = {
      ...b1,
      roomId,
      msgType: "user",
      text,
      userId,
      channel: "wx_gzh",
    }
    const col = db.collection("AiChat")
    const res1 = await col.add(data1)
    const chatId = getDocAddId(res1)
    if(!chatId) {
      console.warn("cannot get chatId while adding user msg error")
      console.log(res1)
      console.log("entry: ")
      console.log(entry)
      return
    }

    return chatId
  }

  static async getLatestChat(
    roomId: string,
  ): Promise<HistoryData> {
    const _this = this
    const col = db.collection("AiChat")
    const q1 = col.where({ roomId }).orderBy("insertedStamp", "desc")
    const res1 = await q1.limit(50).get<Table_AiChat>()
    const chats = res1.data
    const results: Table_AiChat[] = []
    let totalToken = 0
    for(let i=0; i<chats.length; i++) {
      const v = chats[i]
      if(v.msgType === "clear") {
        break
      }
      const token = _this.calculateToken(v)
      const tmpToken = totalToken + token
      if(tmpToken > MAX_TOKEN_1) {
        break
      }
      totalToken = tmpToken
      results.push(v)
    }

    return { results, totalToken }
  }


  static calculateToken(
    chat: Table_AiChat,
  ) {
    const { msgType, usage, text, imageUrl } = chat
    if(msgType === "assistant") {
      const token1 = usage?.completion_tokens
      if(token1) return token1
    }

    let token = 0
    if(text) {
      for(let i=0; i<text.length; i++) {
        const char = text[i]
        if(valTool.isLatinChar(char)) {
          token += 0.5
        }
        else {
          token += 1
        }
      }
    }
    else if(imageUrl) {
      token += 400
    }

    return token
  }

}
