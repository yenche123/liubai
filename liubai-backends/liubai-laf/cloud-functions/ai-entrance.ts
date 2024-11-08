// Function Name: ai-entrance

import type { 
  AiBot,
  Partial_Id, 
  Table_AiRoom, 
  Table_User, 
  Wx_Gzh_Send_Msg,
} from "@/common-types"
import OpenAI from "openai"
import { checkAndGetWxGzhAccessToken, getDocAddId } from "@/common-util"
import { sendWxMessage } from "@/service-send"
import { getBasicStampWhileAdding, getNowStamp } from "@/common-time"
import { aiBots } from "@/ai-prompt"
import cloud from "@lafjs/cloud"

const db = cloud.database()

/********************* constants ************************/
const MAX_BOTS = 3

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

  // 3. get my ai room
  const room = await AiHelper.getMyAiRoom(entry)
  if(!room) return

  






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

}
