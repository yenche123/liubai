// Function Name: ai-entrance

import type { 
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
  if(!text) {
    console.warn("no text")
    return
  }

  // 2. check out directive
  const isDirective = AiDirective.check(entry)
  if(isDirective) return



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

    // 2. is it a kick directive
    const text2 = text.trim().replace("+", " ")
    const botKicked = this.isKickBot(text2)
    if(botKicked) {
      // WIP: to kick
      return true
    }
    

  }

  static isKickBot(text: string) {
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
async function getMyAiRoom(
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
    return
  }

  // 3. return room
  const newRoom: Table_AiRoom = { _id: roomId, ...room2 }
  return newRoom
}

